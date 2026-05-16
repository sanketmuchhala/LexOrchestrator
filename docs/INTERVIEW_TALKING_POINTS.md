# LexOrchestrator -- Interview Talking Points

---

## 30-Second Pitch

"LexOrchestrator is a multi-agent litigation workflow demo I built in TypeScript. It takes a motion drafting request through eight specialist agents -- retrieval, drafting, citation verification, adversarial review, local rules check, judge brief preparation, and eval scoring -- and surfaces everything in a structured workspace UI. It also exposes a stdio MCP server with nine tools. The goal was to build a serious reliability layer, not a chatbot wrapper."

---

## 90-Second Technical Explanation

"The system runs on Next.js 16 with Supabase for persistence and OpenRouter for LLM calls.

The litigation workflow is eight sequential agents. Intake normalizes the request. Retrieval does hybrid RAG over indexed court opinions -- 35% keyword, 45% vector cosine, plus jurisdiction and authority boosts. Drafting generates the outline grounded in what retrieval found. The citation agent runs every citation through a verifier that checks existence, quote accuracy, pin cite, proposition support, and treatment status against the local corpus. Adversarial generates the red-team critique. Local rules does section detection against static profiles for SDNY, Federal generic, and New York State. Judge brief does a DB lookup on cached profile data derived from indexed opinions. Eval computes a weighted confidence score from all of that output -- deterministically, no LLM involved.

Everything degrades gracefully. No API key, no database -- the workflow completes with deterministic fallback outputs and ephemeral run IDs. The UI shows empty states instead of errors.

The MCP server exposes nine tools over stdio. The eval dashboard aggregates quality metrics across runs. The whole thing runs on a single Next.js server with no separate inference infrastructure."

---

## Architecture Deep Dive

**Two parallel pipelines.** The original seven-agent research pipeline (`/research`, `/runs`) stays active and unchanged. The litigation workflow is entirely separate. Neither touches the other.

**Agent context pattern.** Each agent receives an `AgentContext` object that accumulates outputs from prior agents. This makes it easy to reason about what each agent knows and what it can reference.

**Retrieval scoring.** The formula is explicit: keyword overlap at 0.35, vector cosine at 0.45, with separate boosts for jurisdiction match (0.08), court match (0.06), citation presence (0.05), and recency (up to 0.03). I can point to the exact line in `searchLegalOpinions.ts`.

**Eval formula.** Citation pass rate is weighted at 35% because it's the most actionable signal. Faithfulness and retrieval coverage matter but are harder to verify externally. The formula is deterministic -- I don't ask the LLM to score itself.

**MCP server.** Loads env vars via dotenv before importing tool modules, because `supabaseServer.ts` reads env vars at module evaluation time. All tool callbacks return structured errors instead of throwing.

---

## Reliability Story

The word I keep coming back to is "accountability." Every agent event is logged. Every citation check produces a structured result with sub-statuses. The eval formula is documented and deterministic. The local rules check tells you exactly which required sections are missing. The adversarial agent tells you what opposing counsel will attack.

None of this claims the output is hallucination-free or legally accurate. What it claims is that I can trace exactly how the output was produced and what signals were used to score it. That's a different and more useful guarantee than "the LLM said so."

---

## Citation Verification Story

The citation verifier runs five checks: does the case exist in the corpus, does the quote appear in the text, does the pin cite match, does the cited proposition appear in the relevant passages, and what is the subsequent treatment status.

The limitation I'm honest about: verification is bounded by the local corpus. A citation that's not indexed returns `not_found` -- not a claim that the case is fake, just that I haven't seen it. The Phase 14 roadmap item is CourtListener/CAP ingestion to expand that corpus. Phase 15 is a Python worker using eyecite for more rigorous extraction and normalization.

In the current demo, the Daubert line of cases is indexed and verifies correctly. Citations outside that set return `not_found`.

---

## Judge Brief Story

The judge brief is not an LLM generation. It's a DB lookup on cached profile data -- structured records that were built from indexed opinions and stored in `judge_profiles`. The data includes style notes, citation preferences, and argument guidance indexed by judge and motion type.

The language constraint is important: I use "preparation signal," "argument guidance," "style notes." Never "will rule," "likely outcome," or "win probability." A senior associate builds this kind of document from reading the judge's prior decisions. The judge brief automates that retrieval step.

If the judge isn't in the database, the system says so clearly and still returns generic court-level guidance. It doesn't hallucinate a profile.

---

## Evals Story

The eval is computed twice. First in-flight by the eval agent, using synthetic DB row objects built from in-memory agent outputs -- because the artifacts aren't persisted yet when eval runs. Then again from persisted DB rows when the `/evals/[id]` page loads, using the same `computeWorkflowEval` function.

The confidence formula weights are explicit: citation pass rate (0.35), faithfulness (0.25), retrieval coverage (0.15), local rules completeness (0.10), adversarial safety (0.10), judge coverage (0.05). Pass requires both >= 0.75 confidence AND zero failed citations. That's a conjunctive gate, not just a threshold.

The eval dashboard aggregates across runs in-memory -- no materialized aggregate table. That's fine for the current data volume. At scale I'd add a scheduled job.

---

## What I Would Build Next

The single highest-leverage next step is file upload intake. Right now the facts go in as a text field. The natural next step is attaching a PDF -- a complaint, a contract, a prior brief -- so the system can read from the actual documents rather than a typed summary.

After that: real CourtListener or CAP ingestion. The current corpus is three demo opinions. Expanding that to actual published opinions changes the utility of citation verification and retrieval quality significantly.

Then the motion editor -- the ability to edit the generated outline inline, have citations re-verified on change, and see the local rules check update in real time.

---

## Tradeoffs and Limitations

**Sequential vs parallel agents.** The eight agents run sequentially. Adversarial, local rules, and judge brief have no data dependency on each other -- they could run in parallel after drafting. I kept it sequential intentionally to keep the execution model simple for the demo. Parallelizing them is a clear next step.

**Static local rules profiles.** The local rules module uses hardcoded data for three jurisdictions. The right long-term approach is a structured database of local rules that can be updated without a code change.

**Citation corpus size.** Three indexed opinions. The verifier's usefulness scales with the corpus. That's a data problem, not an architecture problem.

**MCP transport.** Stdio only. SSE transport would allow browser-based MCP clients. It's not complex to add -- `@modelcontextprotocol/sdk` has an `SSEServerTransport` -- but it adds deployment complexity I didn't want to take on for the demo.

**LLM dependency on fallback quality.** The deterministic fallbacks work for demonstrating the architecture but produce lower-quality legal text than a real LLM would. In a production environment, the LLM is required.
