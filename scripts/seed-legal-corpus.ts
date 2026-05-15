/**
 * Seeds the LexOrchestrator legal corpus into Supabase.
 * Run with: npm run seed:legal
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Uses upsert on citation_id - safe to re-run.
 *
 * DISCLAIMER: All content below is SAMPLE EDUCATIONAL MATERIAL only.
 * Not real legal authority. Do not rely on this for legal advice.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const DISCLAIMER = "Sample educational content only - not real legal authority. Do not rely on this for legal advice.";

interface SeedEntry {
  citationId: string;
  title: string;
  practiceArea: string;
  jurisdiction: string;
  chunkText: string;
  keywords: string[];
}

const corpus: SeedEntry[] = [
  {
    citationId: "SAMPLE-001",
    title: "Elements of Breach of Contract",
    practiceArea: "contract",
    jurisdiction: "General / Multi-Jurisdiction",
    chunkText: "A breach of contract claim requires the plaintiff to establish four elements: (1) a valid contract supported by offer, acceptance, and consideration; (2) the plaintiff's performance or excused non-performance; (3) the defendant's failure to perform; and (4) resulting damages. The burden rests with the plaintiff to prove each element by a preponderance of the evidence.",
    keywords: ["breach", "contract", "elements", "offer", "acceptance", "consideration", "damages", "performance", "plaintiff"],
  },
  {
    citationId: "SAMPLE-002",
    title: "Negligence - Duty of Care Standard",
    practiceArea: "tort",
    jurisdiction: "General / Multi-Jurisdiction",
    chunkText: "To establish a negligence claim, a plaintiff must prove: (1) the defendant owed a duty of care; (2) the defendant breached that duty by failing to act as a reasonably prudent person; (3) the breach was the actual and proximate cause of the injury; and (4) the plaintiff suffered actual, cognizable damages. The reasonable person standard is an objective measure applied to the facts.",
    keywords: ["negligence", "duty", "care", "reasonably", "prudent", "breach", "proximate", "cause", "damages", "tort"],
  },
  {
    citationId: "SAMPLE-003",
    title: "Daubert Standard for Expert Witness Admissibility",
    practiceArea: "evidence",
    jurisdiction: "Federal",
    chunkText: "Under the federal evidentiary framework, expert testimony is admissible if: (1) the witness is qualified as an expert; (2) the testimony is based on sufficient facts or data; (3) the testimony is the product of reliable principles and methods; and (4) the expert has reliably applied those principles to the facts. Trial courts act as gatekeepers to exclude unreliable expert opinion.",
    keywords: ["daubert", "expert", "witness", "admissibility", "testimony", "reliable", "methods", "qualified", "federal", "evidentiary", "gatekeeper"],
  },
  {
    citationId: "SAMPLE-004",
    title: "Expert Witness Qualification Requirements",
    practiceArea: "evidence",
    jurisdiction: "General / Multi-Jurisdiction",
    chunkText: "An expert witness must possess specialized knowledge, skill, experience, training, or education sufficient to assist the trier of fact. Qualification is assessed case-by-case within the sound discretion of the trial court. Mere credentials are insufficient absent demonstrated practical knowledge in the field. The expert must articulate the basis for opinions with reasonable certainty.",
    keywords: ["expert", "witness", "qualification", "knowledge", "skill", "experience", "training", "education", "trier", "fact", "discretion"],
  },
  {
    citationId: "SAMPLE-005",
    title: "Discovery - Proportionality Obligation",
    practiceArea: "discovery",
    jurisdiction: "Federal",
    chunkText: "Discovery requests must be proportional to the needs of the case, considering: the importance of the issues, the amount in controversy, the parties' relative access to information, the parties' resources, the importance of the discovery, and whether burden or expense outweighs likely benefit. Courts may limit discovery that is cumulative, duplicative, or obtainable from more convenient sources.",
    keywords: ["discovery", "proportional", "proportionality", "burden", "expense", "information", "resources", "cumulative", "duplicative", "scope"],
  },
  {
    citationId: "SAMPLE-006",
    title: "Summary Judgment Standard",
    practiceArea: "procedure",
    jurisdiction: "Federal",
    chunkText: "Summary judgment is appropriate when there is no genuine dispute as to any material fact and the movant is entitled to judgment as a matter of law. The movant bears the initial burden of demonstrating the absence of a genuine issue. The non-movant must produce specific facts showing a genuine issue for trial. Courts view all facts in the light most favorable to the non-moving party.",
    keywords: ["summary", "judgment", "genuine", "dispute", "material", "fact", "movant", "burden", "inferences", "trial"],
  },
  {
    citationId: "SAMPLE-007",
    title: "Motion to Dismiss - Plausibility Pleading Standard",
    practiceArea: "procedure",
    jurisdiction: "Federal",
    chunkText: "To survive a motion to dismiss, a complaint must contain sufficient factual matter, accepted as true, to state a claim for relief that is plausible on its face. A claim is plausible when the plaintiff pleads factual content allowing the court to draw the reasonable inference of liability. Threadbare recitals of elements supported by mere conclusory statements do not suffice.",
    keywords: ["motion", "dismiss", "plausibility", "pleading", "complaint", "factual", "inference", "liable", "conclusory", "12(b)(6)"],
  },
  {
    citationId: "SAMPLE-008",
    title: "Judicial Discretion - Abuse of Discretion Review Standard",
    practiceArea: "procedure",
    jurisdiction: "General / Multi-Jurisdiction",
    chunkText: "An appellate court reviews evidentiary and procedural rulings for abuse of discretion. A trial court abuses its discretion when it makes an error of law, applies the wrong legal standard, relies on clearly erroneous facts, or reaches a conclusion outside the range of permissible conclusions. Deference is warranted because the trial court is best positioned to assess proceedings and credibility.",
    keywords: ["abuse", "discretion", "appellate", "review", "evidentiary", "procedural", "deference", "error", "law", "credibility"],
  },
  {
    citationId: "SAMPLE-009",
    title: "Contract Breach - Consequential vs. Direct Damages",
    practiceArea: "contract",
    jurisdiction: "General / Multi-Jurisdiction",
    chunkText: "Damages for breach of contract are divided into direct (general) damages, which flow naturally from the breach, and consequential (special) damages, which are foreseeable at the time of contracting. Consequential damages require the breaching party to have had reason to know of special circumstances at contracting. Courts apply the Hadley v. Baxendale foreseeability limitation. Plaintiffs have a duty to mitigate damages.",
    keywords: ["contract", "breach", "damages", "consequential", "direct", "general", "foreseeable", "foreseeability", "mitigation", "hadley"],
  },
  {
    citationId: "SAMPLE-010",
    title: "Negligence - Proximate Cause and Foreseeability",
    practiceArea: "tort",
    jurisdiction: "General / Multi-Jurisdiction",
    chunkText: "Proximate cause requires that the plaintiff's injury be a foreseeable result of the defendant's negligent conduct. A defendant is not liable for harm outside the scope of risk that made the conduct negligent. The superseding intervening cause doctrine may break the chain of causation where an unforeseeable independent act of a third party produces the harm.",
    keywords: ["negligence", "proximate", "cause", "foreseeability", "foreseeable", "intervening", "superseding", "causation", "risk", "reasonable"],
  },
  {
    citationId: "SAMPLE-011",
    title: "Frye Standard - General Acceptance Test",
    practiceArea: "evidence",
    jurisdiction: "State (Various)",
    chunkText: "Under the Frye general acceptance test, expert scientific testimony is admissible only if the underlying scientific methodology has gained general acceptance in the relevant scientific community. This standard, still applied in some state jurisdictions, focuses on community consensus rather than individual reliability. Courts assess whether the technique is generally accepted as reliable by recognized experts.",
    keywords: ["frye", "general", "acceptance", "expert", "scientific", "testimony", "admissibility", "methodology", "community", "reliable", "state"],
  },
  {
    citationId: "SAMPLE-012",
    title: "Discovery - Attorney-Client Privilege",
    practiceArea: "discovery",
    jurisdiction: "General / Multi-Jurisdiction",
    chunkText: "The attorney-client privilege protects confidential communications between a client and attorney made for the purpose of obtaining or providing legal advice. To invoke it, the party must show: (1) an attorney-client relationship; (2) a confidential communication; and (3) the purpose was legal advice, not business advice. Privilege is narrowly construed. The burden of establishing it rests on the asserting party. Waiver may occur through disclosure.",
    keywords: ["attorney", "client", "privilege", "confidential", "communication", "legal", "advice", "waiver", "disclosure", "discovery"],
  },
];

async function seed() {
  console.log("Starting legal corpus seed...\n");
  let seeded = 0;
  let errors = 0;

  for (const entry of corpus) {
    // Upsert legal_documents record
    const { data: doc, error: docError } = await supabase
      .from("legal_documents")
      .upsert(
        {
          title: entry.title,
          jurisdiction: entry.jurisdiction,
          practice_area: entry.practiceArea,
          source_type: "sample",
          disclaimer: DISCLAIMER,
        },
        { onConflict: "title" }
      )
      .select("id")
      .single();

    if (docError || !doc) {
      console.error(`  ✗ Failed to upsert document "${entry.title}":`, docError?.message);
      errors++;
      continue;
    }

    // Upsert legal_chunks record
    const { error: chunkError } = await supabase
      .from("legal_chunks")
      .upsert(
        {
          document_id: doc.id,
          citation_id: entry.citationId,
          chunk_text: entry.chunkText,
          keywords: entry.keywords,
          jurisdiction: entry.jurisdiction,
          practice_area: entry.practiceArea,
        },
        { onConflict: "citation_id" }
      );

    if (chunkError) {
      console.error(`  ✗ Failed to upsert chunk ${entry.citationId}:`, chunkError.message);
      errors++;
    } else {
      console.log(`  ✓ ${entry.citationId} - ${entry.title}`);
      seeded++;
    }
  }

  console.log(`\nSeed complete: ${seeded} chunks seeded, ${errors} errors.`);
  if (errors > 0) process.exit(1);
}

seed().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
