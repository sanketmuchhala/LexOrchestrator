import * as dotenv from "dotenv";
import * as path from "path";

// Load env vars before any other imports read process.env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function startServer() {
  const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");

  const { register: registerSearch } = await import("./tools/searchLegalOpinionsTool");
  const { register: registerExtract } = await import("./tools/extractCitationsTool");
  const { register: registerVerify } = await import("./tools/verifyCitationTool");
  const { register: registerWorkflow } = await import("./tools/runLitigationWorkflowTool");
  const { register: registerStatus } = await import("./tools/getWorkflowStatusTool");
  const { register: registerArtifacts } = await import("./tools/getDraftArtifactsTool");
  const { register: registerJudge } = await import("./tools/getJudgeBriefTool");
  const { register: registerEval } = await import("./tools/getEvalSummaryTool");
  const { register: registerLocalRules } = await import("./tools/getLocalRulesProfileTool");

  const server = new McpServer(
    { name: "lexorchestrator", version: "1.0.0" },
    {
      capabilities: { tools: {} },
      instructions:
        "LexOrchestrator MCP server. Tools for legal opinion search, citation verification, litigation workflow drafting, judge brief preparation, and eval quality metrics. All tools degrade gracefully when the database or API keys are absent.",
    }
  );

  registerSearch(server);
  registerExtract(server);
  registerVerify(server);
  registerWorkflow(server);
  registerStatus(server);
  registerArtifacts(server);
  registerJudge(server);
  registerEval(server);
  registerLocalRules(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write("[lexorchestrator-mcp] Server ready on stdio\n");
}

startServer().catch((err) => {
  process.stderr.write(
    `[lexorchestrator-mcp] Startup failed: ${err instanceof Error ? err.message : String(err)}\n`
  );
  process.exit(1);
});
