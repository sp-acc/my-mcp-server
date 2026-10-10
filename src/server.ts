import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, initDb, users } from "./db.js";

const server = new McpServer({
    name: "MyServer",
    version: "1.0.0",
});

server.registerTool("create_user", {
        title: "Create User",
        description: "Create a new user (all fields required) and return the created record with its database id",
        inputSchema: z.object({
            name: z.string().min(1, "Name must not be empty"),
            email: z.string().email("Invalid email address"),
            address: z.string(),
            phone: z.string(),
        }),
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
    async ({ name, email, address, phone }) => {
        try {
            const [user] = await db.insert(users).values({ name, email, address, phone }).returning();
            return success("User created", user);
        } catch (err) {
            console.error("[create_user]", err);
            return failure("Failed to create user", err);
        }
    }
);

server.registerTool("update_user", {
        title: "Update User",
        description: "Update an existing user by id. At least one of name, email, address, or phone must be provided; only provided fields are changed.",
        inputSchema: z.object({
            id: z.number().int().positive("Id must be a positive integer"),
            name: z.string().min(1).optional(),
            email: z.string().email().optional(),
            address: z.string().optional(),
            phone: z.string().optional(),
        }).refine(
            (data) => data.name !== undefined || data.email !== undefined || data.address !== undefined || data.phone !== undefined,
            { message: "At least one of name, email, address, or phone must be provided" },
        ),
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    async (params) => {
        try {
            const patch: Partial<typeof users.$inferInsert> = {};
            if (params.name !== undefined) patch.name = params.name;
            if (params.email !== undefined) patch.email = params.email;
            if (params.address !== undefined) patch.address = params.address;
            if (params.phone !== undefined) patch.phone = params.phone;

            const [user] = await db.update(users).set(patch).where(eq(users.id, params.id)).returning();
            if (!user) {
                return notFound();
            }
            return success("User updated", user);
        } catch (err) {
            console.error("[update_user]", err);
            return failure("Failed to update user", err);
        }
    }
);

server.registerTool("delete_user", {
        title: "Delete User",
        description: "Delete a user by id and return the deleted record",
        inputSchema: z.object({
            id: z.number().int().positive("Id must be a positive integer"),
        }),
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    async ({ id }) => {
        try {
            const [user] = await db.delete(users).where(eq(users.id, id)).returning();
            if (!user) {
                return notFound();
            }
            return success("User deleted", user);
        } catch (err) {
            console.error("[delete_user]", err);
            return failure("Failed to delete user", err);
        }
    }
);

server.registerResource("users", "users://all", {
    description: "All users from the database with their profile data",
    mimeType: "application/json",
    },
    async (uri) => {
        try {
            const all = await db.select().from(users).orderBy(users.id);
            return returnContents(uri.href, all);
        } catch (err) {
            console.error("[users://all]", err);
            return returnContents(uri.href, null, "Failed to load users");
        }
    }
);

server.registerResource("users-template", new ResourceTemplate("users://{userId}/profile", {
    list: async () => {
        const all = await db.select({ id: users.id }).from(users).orderBy(users.id);
        return {
            resources: all.map(({ id }) => ({
                uri: `users://${id}/profile`,
                name: `User ${id}`,
                mimeType: "application/json",
            })),
        };
    }
}), {
    description: "Single user from the database with their profile data",
    mimeType: "application/json",
}, async (uri, { userId }) => {
    const id = parseInt(userId as string, 10);
    if (Number.isNaN(id)) {
        return returnContents(uri.href, null, "User not found");
    }
    try {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        if (!user) {
            return returnContents(uri.href, null, "User not found");
        }
        return returnContents(uri.href, user);
    } catch (err) {
        console.error("[users://{userId}/profile]", err);
        return returnContents(uri.href, null, "Failed to load user");
    }
});

/**
 * Builds a tool result with the affected record as JSON text plus a
 * structuredContent payload for machine-readable clients.
 */
function success(message: string, data: unknown) {
    return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
        structuredContent: { message, data },
    };
}

function notFound() {
    return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: "User not found" }) }],
        structuredContent: { error: "User not found" },
        isError: true,
    };
}

function failure(message: string, err: unknown) {
    return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: message, detail: (err as Error).message }) }],
        structuredContent: { error: message },
        isError: true,
    };
}

/**
 * Constructs a resource response with a single JSON content item.
 * Passing an error string emits an { error } object instead of the data.
 */
function returnContents(href: string, data: unknown, error?: string) {
    return {
        contents: [{
            uri: href,
            mimeType: "application/json",
            text: JSON.stringify(error ? { error } : data)
        }]
    };
}

async function go() {
    await initDb();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[server] MCP server ready");
}

go();
