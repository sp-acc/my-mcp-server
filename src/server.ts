import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs/promises";

const server = new McpServer({
    name: "MyServer",
    version: "1.0.0",
});

type Params = {
    name: string;
    address: string;
    email: string;
    phone: string;
}

server.registerTool("my-create-tool", {
        title: "My Create Tool",
        description: "Tool to create a new user",
        inputSchema: z.object({
            name: z.string(),
            address: z.string(),
            email: z.string(),
            phone: z.string(),
        }),
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
    async (params: Params) => {
        await createUser(params);
        return {
            content: [{ type: "text" as const, text: "A success occurred" }]
        };
    }
)

server.registerResource("users", "users://all", {
    description: "All users from the mock database with their profile data",
    mimeType: "application/json",
    },
    async (uri) => {
        const users = await retrieveUsers();
        return returnContents(uri.href, users, false);
    }
)

server.registerResource("users-template", new ResourceTemplate("users://{userId}/profile", {
    list: undefined
}), {
    description: "Single user from the mock database with his profile data",
    mimeType: "application/json",
}, async (uri, { userId }) => {
    const users = await retrieveUsers();
    // Extract the user based on provided id
    const user = users.find((user) => user.id === parseInt(userId as string));

    if (user == null) {
        return returnContents(uri.href, null, true);
    }

    return returnContents(uri.href, user, false);
})

/**
 * Creates a new user by appending it to the existing user list and persisting the updated list.
 * @param {Params} user - The user data to create.
 * @returns {Promise<number>} A promise that resolves to the newly assigned user id.
 */
async function createUser(user: Params) {
    const users = await retrieveUsers();
    // Add the new user to the list and increase the id
    const id = users.length + 1;
    users.push({ ...user, id });

    await fs.writeFile("./src/users.json", JSON.stringify(users, null, 2));

    return id;
}

/**
 * Retrieves the list of users by loading them from the bundled JSON file.
 *
 * @return {Promise<Object[]>} A promise that resolves to the array of user objects.
 */
async function retrieveUsers() {
    return await import("./users.json", {
        with: { type: "json" }
    }).then((module) => module.default);
}

/**
 * Constructs a response object containing a single content item with the given URI.
 * The content text is a JSON string representing either an error object or the provided data,
 * depending on the withErr flag.
 *
 * @param {string} href - The URI to include in the content item.
 * @param {object | null} data - The data object to serialize as JSON when withErr is false; otherwise ignored.
 * @param {boolean} withErr - When true, serializes an error object instead of data.
 * @return {object} An object with a content array containing one content item: { uri, mimeType, text }.
 */
function returnContents(href: string, data: object | null, withErr: boolean) {
    return {
        contents: [{
            uri: href,
            mimeType: "application/json",
            text: JSON.stringify(withErr ? { error: "User not found" } : data)
        }]
    }
}

async function go() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

go()
