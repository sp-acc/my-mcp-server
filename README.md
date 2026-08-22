# my-mcp-server

A playground and experimentation project for building an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server using TypeScript. It demonstrates how to expose **tools** and **resources** to AI agents and language models via the stdio transport.

The server manages a simple user database (backed by a local JSON file) and exposes endpoints that an AI agent can call to read or create user records.

---

## Features

- **Tool — `my-create-tool`**: Creates a new user by accepting `name`, `address`, `email`, and `phone` fields and persisting the record to `src/users.json`.
- **Resource — `users://all`**: Returns the full list of users from the mock database as JSON.
- **Resource — `users://{userId}/profile`**: Returns the profile of a single user identified by `userId`.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) v9 or later

---

## Installation

```bash
npm install
```

---

## Running the Server

### Development mode (using `tsx`, no build step)

```bash
npm run server:dev
```

### Build & run compiled output

```bash
npm run server:build   # compiles TypeScript → JavaScript
node dist/server.js    # run the compiled server
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
│   └── users.json     # Mock user database (read/written at runtime)
├── package.json
└── tsconfig.json
```

---

## Tech Stack

| Package | Role |
|---|---|
| `@modelcontextprotocol/sdk` | MCP server SDK (tools, resources, stdio transport) |
| `zod` | Input schema validation for tools |
| `tsx` | Run TypeScript directly without a build step |
| `typescript` | TypeScript compiler |
| `@modelcontextprotocol/inspector` | Browser-based MCP debug UI |

---

## License

ISC
