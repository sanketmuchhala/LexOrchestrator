# LexOrchestrator Demo Video Script

Target length: 4 to 5 minutes.

---

## 0:00 -- 0:30 | Problem

**[Screen: blank or terminal]**

"Legal drafting has a reliability problem. Attorneys use AI tools that generate citations they can't verify, miss local-rule requirements they can't easily check, and produce work product with no audit trail.

I built LexOrchestrator to explore what a reliability layer for litigation AI actually looks like -- what it means to not just generate a motion draft but to ground it in retrieved authority, verify every citation, flag what the opposing side will attack, and score the output before it leaves the system."

---

## 0:30 -- 1:15 | Architecture

**[Screen: docs/ARCHITECTURE.md or the Mermaid diagram]**

"The system runs two parallel pipelines in the same Next.js app. The original seven-agent research pipeline handles legal research queries. The litigation workflow -- the new one -- takes a drafting request through eight specialist agents.

Intake normalizes the motion type, jurisdiction, and key facts. Retrieval does a hybrid RAG search over indexed court opinions -- keyword scoring at 35%, vector cosine at 45%, with authority boosts for jurisdiction match, court match, and recency. Drafting generates the outline grounded in what retrieval found. The citation agent verifies every citation in that draft against the local corpus. Adversarial runs the red-team. Local rules does section detection. Judge brief does a DB lookup on cached profile data. Eval scores the full output with a weighted formula.

Everything degrades gracefully. No API key -- deterministic fallback. No Supabase -- ephemeral run IDs, no history. The demo works either way."

---

## 1:15 -- 2:30 | Run the Draft Workflow

**[Screen: http://localhost:3000/draft]**

"Starting at the draft form. Motion type, jurisdiction, court, judge name, facts, desired output.

I'll click Load Demo -- this populates the canonical fixture. SDNY. Motion to dismiss. Judge Rakoff. The plaintiff is Aurora Analytics, a SaaS company claiming the defendant verbally committed to a production rollout after a pilot. The defendant is arguing there's no binding production contract.

[Click Submit]

The pipeline is running. You can see it in the workflow list as it progresses. Eight agents. In demo mode with no LLM key it takes a few seconds. With an API key the quality improves significantly.

[Redirect to /draft/id]

Here's the draft workspace."

---

## 2:30 -- 3:30 | Verification Inspector, Judge Brief, Local Rules

**[Screen: /draft/[id] -- right column]**

"Right column. Verification Inspector first.

Every citation in the draft gets checked: existence, quote accuracy, pin cite, proposition support, and treatment. Green means verified. Amber means warn -- citation found but something is off. Red means not found in the indexed corpus.

The summary strip shows pass/warn/fail counts at a glance. [Point to counts] One thing I want to be explicit about: verification is limited to locally indexed opinions. If a citation isn't in the corpus, it returns not_found -- that's not a claim that the case doesn't exist. It means I haven't indexed it yet.

[Scroll to Judge Brief]

Judge brief. If the judge was found in the database, this panel shows preparation signals derived from indexed opinions: style notes, citation preferences, argument guidance for this specific motion type. This is not outcome prediction. It's the same thing a senior associate would compile from reading the judge's prior rulings.

[Scroll to Local Rules]

Local rules. The agent ran section detection against the SDNY profile. Required sections: Preliminary Statement, Statement of Facts, Legal Standard, Argument, Conclusion. Each gets a pass or fail badge. Below that: formatting notes, citation format requirements, filing notes, and an explicit limitations block."

---

## 3:30 -- 4:15 | Evals and Agent Trace

**[Screen: /evals/[id] then /workflows/[id]]**

"Click Full Eval.

Eight score bars. Overall confidence is a weighted formula -- citation pass rate at 35%, faithfulness at 25%, retrieval coverage at 15%, local rules completeness at 10%, adversarial safety at 10%, judge coverage at 5%. The weights are documented in the codebase. The formula is deterministic, not an LLM assessment.

Below that: citation quality breakdown, retrieval quality panel, artifact quality -- which agents ran and which sections were detected -- and agent runtime with total latency and token count.

[Navigate to /workflows/[id]]

Technical inspection. Every agent event, in order, with latency. Raw artifact cards -- the outline, the red-team memo, the local rules check, the eval artifact. Full citation report table with every sub-status column.

This is what I'd show an engineering audience that asks how something actually works."

---

## 4:15 -- 5:00 | MCP and Roadmap

**[Screen: terminal -- npm run smoke:mcp output]**

"The system also runs as an MCP server. Nine tools over stdio. Any MCP client -- Claude Desktop, Cursor, or a custom orchestration layer -- can call search_legal_opinions, verify_citation, run_litigation_workflow, get_judge_brief, get_eval_summary.

[Show smoke:mcp output]

All five tests pass. The server starts in under a second.

What's next: file upload intake so attorneys can drop in an existing brief. Real CourtListener or CAP ingestion to expand the citation corpus beyond the demo data. A Python worker for more rigorous citation verification using eyecite. An editable motion editor so the draft can be revised inline. And PDF or DOCX export.

The core architecture -- the agent pipeline, the eval layer, the MCP interface -- is in place. The remaining work is expanding the data layer and adding the editing surface on top."

**[End]**

---

## Notes for Recording

- Use `npm run dev` and open at 1440x900 or similar wide viewport.
- Keep browser font size at default. The design uses EB Garamond for legal prose and IBM Plex Mono for labels.
- Do not show any API keys in the terminal.
- If running without an LLM key, say so upfront and explain the fallback.
- Pause after submitting the draft form to let it complete before continuing narration.
