# my-mcp-server

A playground and experimentation project for building an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server using TypeScript. It demonstrates how to expose **tools** and **resources** to AI agents and language models via the stdio transport.

The server manages a user database backed by **PostgreSQL** (via [Drizzle ORM](https://orm.drizzle.team/)) and exposes tools and resources that an AI agent can call to read, create, update, and delete user records.

---

## Features

- **Tool — `create_user`**: Creates a new user from `name`, `email`, `address`, and `phone` fields (all required) and returns the created record with its database id.
- **Tool — `update_user`**: Updates an existing user by id; at least one field must be provided and only the provided fields are changed.
- **Tool — `delete_user`**: Deletes a user by id and returns the deleted record.
- **Resource — `users://all`**: Returns the full list of users from the database as JSON.
- **Resource — `users://{userId}/profile`**: Returns the profile of a single user identified by `userId`.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) v9 or later
- [Docker](https://www.docker.com/) (for the local Postgres database)

---

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure the database connection. Copy `.env.example` to `.env` and adjust the values if needed:

   ```bash
   cp .env.example .env
   ```

3. Start the Postgres container:

   ```bash
   npm run db:up   # or: docker compose up -d db
   ```

On startup the server connects to the database, creates the `users` table if it does not exist, and seeds it from `data/users.json` the first time (the seed is skipped once the table has data).

---

## Running the Server

### Development mode (using `tsx`, no build step)

```bash
npm run server:dev
```

### Build & run compiled output

```bash
npm run server:build   # compiles TypeScript → JavaScript
npm start              # run the compiled server
```

### Watch mode (auto-recompile on changes)

```bash
npm run server:build:watch
```

### Inspect with MCP Inspector UI

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) lets you interactively call tools and browse resources in a browser UI:

```bash
npm run server:inspect
```

> **Note:** `server:inspect` sets `DANGEROUSLY_OMIT_AUTH=true` — use this only for local development.

---

## Loading the MCP Server in Agent Environments

### Agent CLI (e.g. Claude Code CLI)

Existence of .mcp.json should be picked up by the agent and prompted to load the server. Otherwise it's a simple MCP server config that needs to be added to the configuration with other servers.

---

## Project Structure

```
my-mcp-server/
├── src/
│   ├── server.ts      # MCP server entry point (tools & resources)
│   └── db.ts          # Postgres connection, schema, and seeding
├── data/
│   └── users.json     # Seed data imported into Postgres on first start
├── docker-compose.yml # Local Postgres container
├── package.json
└── tsconfig.json
```

---

## Tech Stack

| Package | Role |
|---|---|
| `@modelcontextprotocol/sdk` | MCP server SDK (tools, resources, stdio transport) |
| `drizzle-orm` | TypeScript ORM / query builder for Postgres |
| `pg` | Postgres driver |
| `zod` | Input schema validation for tools |
| `dotenv` | Loads `.env` into `process.env` |
| `tsx` | Run TypeScript directly without a build step |
| `typescript` | TypeScript compiler |
| `@modelcontextprotocol/inspector` | Browser-based MCP debug UI |

---

## License

ISC
