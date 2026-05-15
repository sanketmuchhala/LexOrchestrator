# LexOrchestrator MCP Server

A Model Context Protocol (MCP) server that exposes LexOrchestrator litigation tools over stdio. Allows Claude and other MCP clients to search legal opinions, verify citations, run litigation workflows, and retrieve quality metrics.

## Transport

stdio only. SSE transport is planned for a future phase.

## Tools

| Tool | Description |
|---|---|
| `search_legal_opinions` | Hybrid RAG search over indexed court opinions (keyword + vector) |
| `extract_citations` | Regex-based extraction of U.S. legal citations from freeform text |
| `verify_citation` | Existence and accuracy verification of a single citation against indexed opinions |
| `run_litigation_workflow` | Run the full eight-agent litigation drafting pipeline |
| `get_workflow_status` | Retrieve workflow status and agent event feed by run ID |
| `get_draft_artifacts` | Retrieve draft artifacts (outline, red-team memo, local rules check, judge brief) |
| `get_judge_brief` | Look up cached judge preparation guidance from indexed opinions |
| `get_eval_summary` | Compute full quality evaluation for a completed workflow run |
| `get_local_rules_profile` | Return local rules profile for a jurisdiction and court |

All tools degrade gracefully when the database or API keys are absent.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL -- enables DB-backed tools |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Supabase service role key -- required for DB writes |
| `OPENROUTER_API_KEY` | Optional | OpenRouter key -- enables LLM-backed agents |
| `OPENAI_API_KEY` | Optional | OpenAI key -- alternative to OpenRouter |

Without any keys, all tools fall back to deterministic outputs. No secrets are required to run the server.

## Running Locally

```bash
# From the repo root
npm run mcp:server
```

The server waits for MCP protocol messages on stdin and writes responses to stdout. Startup confirmation is written to stderr.

## Claude Desktop Configuration

Add the following to your Claude Desktop config file:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "lexorchestrator": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/TO/REPO/mcp/server.ts"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "your-supabase-url",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "OPENROUTER_API_KEY": "your-openrouter-key"
      }
    }
  }
}
```

Replace `/ABSOLUTE/PATH/TO/REPO` with the actual path to this repository. Replace the env values with your credentials or omit the `env` block to run without a database (deterministic fallback mode).

## Smoke Test

```bash
npm run smoke:mcp
```

Directly calls tool handler functions and prints pass/fail for each tool. Does not require a running Claude Desktop or MCP client.

## Limitations

- SSE transport not yet implemented (stdio only)
- Citation verification is limited to locally indexed opinions
- Legal opinion search requires migration 004/005 and seeded demo data for full results
- Judge brief requires seeded judge profiles (run `npm run seed:litigation-demo`)
- Eval summary requires a completed workflow run ID persisted in the database
- All output is for demonstration and internal quality signaling only -- not legal advice
