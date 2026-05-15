/**
 * Seeds demo litigation workflow data into Supabase.
 * Run with: npm run seed:litigation-demo
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local or .env
 * Idempotent: uses upsert on external_id where possible.
 *
 * DISCLAIMER: All content below is DEMO FIXTURE DATA only.
 * Not real legal authority. Not real judge analysis. Do not rely on this for legal advice.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local or .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const DISCLAIMER = "[DEMO FIXTURE] Sample educational content only. Not real legal authority.";

async function seed() {
  console.log("Starting litigation demo seed...\n");
  let seeded = 0;
  let errors = 0;

  // ── 1. Seed legal_opinions ──────────────────────────────────────────────

  const opinions = [
    {
      external_id: "DEMO-DAUBERT-001",
      source: "demo" as const,
      court: "SCOTUS",
      jurisdiction: "Federal",
      case_name: "Daubert v. Merrell Dow Pharmaceuticals, Inc.",
      citation: "509 U.S. 579 (1993)",
      decision_date: "1993-06-28",
      judge_name: "Blackmun, J.",
      opinion_url: "https://supreme.justia.com/cases/federal/us/509/579/",
      raw_text: `${DISCLAIMER}\n\nThe Federal Rules of Evidence assign to the trial judge the task of ensuring that an expert's testimony both rests on a reliable foundation and is relevant to the task at hand. Pertinent evidence based on scientifically valid principles will satisfy those demands. The inquiry envisioned by Rule 702 is a flexible one. Its overarching subject is the scientific validity and thus the evidentiary relevance and reliability of the principles that underlie a proposed submission. The focus must be solely on principles and methodology, not on the conclusions that they generate.`,
      metadata: { demo: true, disclaimer: DISCLAIMER },
    },
    {
      external_id: "DEMO-KUMHO-002",
      source: "demo" as const,
      court: "SCOTUS",
      jurisdiction: "Federal",
      case_name: "Kumho Tire Co. v. Carmichael",
      citation: "526 U.S. 137 (1999)",
      decision_date: "1999-03-23",
      judge_name: "Breyer, J.",
      opinion_url: "https://supreme.justia.com/cases/federal/us/526/137/",
      raw_text: `${DISCLAIMER}\n\nThe trial court's gatekeeping obligation under Daubert applies not only to testimony based on scientific knowledge, but also to testimony based on technical and other specialized knowledge. The test of reliability is flexible, and Daubert's list of specific factors neither necessarily nor exclusively applies to all experts or in every case. The trial judge has broad latitude in deciding how to test an expert's reliability.`,
      metadata: { demo: true, disclaimer: DISCLAIMER },
    },
    {
      external_id: "DEMO-JOINER-003",
      source: "demo" as const,
      court: "SCOTUS",
      jurisdiction: "Federal",
      case_name: "General Electric Co. v. Joiner",
      citation: "522 U.S. 136 (1997)",
      decision_date: "1997-12-15",
      judge_name: "Rehnquist, C.J.",
      opinion_url: "https://supreme.justia.com/cases/federal/us/522/136/",
      raw_text: `${DISCLAIMER}\n\nThe abuse-of-discretion standard of review applies to a district court's decision to admit or exclude expert testimony under Daubert. A court of appeals applying abuse-of-discretion review may not categorically distinguish between the methodology and conclusions of an expert. Conclusions and methodology are not entirely distinct from one another. A court may conclude that there is simply too great an analytical gap between the data and the opinion proffered.`,
      metadata: { demo: true, disclaimer: DISCLAIMER },
    },
  ];

  for (const op of opinions) {
    const { error } = await supabase
      .from("legal_opinions")
      .upsert(op, { onConflict: "external_id" });

    if (error) {
      console.error(`  x Failed to upsert opinion "${op.case_name}":`, error.message);
      errors++;
    } else {
      console.log(`  + Opinion: ${op.citation} - ${op.case_name}`);
      seeded++;
    }
  }

  // ── 2. Seed legal_opinion_chunks ────────────────────────────────────────

  for (const op of opinions) {
    const { data: opRow } = await supabase
      .from("legal_opinions")
      .select("id, citation, court, jurisdiction, decision_date")
      .eq("external_id", op.external_id)
      .single();

    if (!opRow) {
      console.error(`  x Could not find opinion row for ${op.external_id}`);
      errors++;
      continue;
    }

    const paragraphs = (op.raw_text || "")
      .split("\n\n")
      .filter((p) => p.trim().length > 20 && !p.startsWith("[DEMO"));

    for (let i = 0; i < paragraphs.length; i++) {
      const { error } = await supabase
        .from("legal_opinion_chunks")
        .upsert(
          {
            opinion_id: opRow.id,
            chunk_index: i,
            chunk_text: paragraphs[i].trim(),
            citation: opRow.citation,
            court: opRow.court,
            jurisdiction: opRow.jurisdiction,
            decision_date: opRow.decision_date,
            metadata: { demo: true },
          },
          { onConflict: "opinion_id,chunk_index" }
        );

      if (error) {
        console.error(`  x Failed to upsert chunk ${op.external_id}[${i}]:`, error.message);
        errors++;
      } else {
        console.log(`  + Chunk: ${op.citation} chunk ${i}`);
        seeded++;
      }
    }
  }

  // ── 3. Seed legal_judges ────────────────────────────────────────────────

  const judge = {
    external_id: "DEMO-JUDGE-RAKOFF",
    full_name: "Jed S. Rakoff",
    court: "SDNY",
    jurisdiction: "Federal",
    appointment_source: "Clinton appointee, 1996",
    education: "Swarthmore College, Harvard Law School",
    prior_roles: "AUSA SDNY, private practice, adjunct professor Columbia Law",
    biography: `${DISCLAIMER} Demo judge profile for testing. Jed S. Rakoff serves as a Senior United States District Judge for the Southern District of New York. Known for rigorous Daubert analysis and skepticism of overly broad expert testimony.`,
    metadata: { demo: true, disclaimer: DISCLAIMER },
  };

  const { error: judgeError } = await supabase
    .from("legal_judges")
    .upsert(judge, { onConflict: "external_id" });

  if (judgeError) {
    console.error(`  x Failed to upsert judge:`, judgeError.message);
    errors++;
  } else {
    console.log(`  + Judge: ${judge.full_name} (${judge.court})`);
    seeded++;
  }

  // ── 4. Seed judge_profiles ──────────────────────────────────────────────

  const { data: judgeRow } = await supabase
    .from("legal_judges")
    .select("id")
    .eq("external_id", "DEMO-JUDGE-RAKOFF")
    .single();

  if (judgeRow) {
    const profile = {
      judge_id: judgeRow.id,
      profile_version: "v1",
      motion_type: "daubert",
      jurisdiction: "Federal",
      grant_rate_summary: {
        note: DISCLAIMER,
        daubert_motions: "Demo data only. Real grant rates require empirical analysis.",
        estimated_grant_rate: "N/A - demo fixture",
      },
      citation_preferences: {
        note: DISCLAIMER,
        preferred_sources: ["SCOTUS trilogy (Daubert, Joiner, Kumho)"],
        formatting_notes: "Bluebook citation format expected",
      },
      style_notes: `${DISCLAIMER} Tends to write detailed opinions with methodical Daubert factor analysis. Values empirical rigor over credentials alone.`,
      argument_guidance: `${DISCLAIMER} Frame expert reliability arguments around methodology, not credentials. Address each Daubert factor explicitly. Anticipate Joiner analytical-gap challenges.`,
      source_opinion_count: 3,
      generated_by: "demo-seed-script",
      metadata: { demo: true, disclaimer: DISCLAIMER },
    };

    // Delete existing profile for this combo before inserting to avoid unique constraint conflicts
    await supabase
      .from("judge_profiles")
      .delete()
      .eq("judge_id", judgeRow.id)
      .eq("profile_version", "v1")
      .eq("motion_type", "daubert")
      .eq("jurisdiction", "Federal");

    const { error: profileError } = await supabase
      .from("judge_profiles")
      .insert(profile);

    if (profileError) {
      console.error(`  x Failed to insert judge profile:`, profileError.message);
      errors++;
    } else {
      console.log(`  + Judge Profile: ${judge.full_name} / daubert / v1`);
      seeded++;
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────

  console.log(`\nSeed complete: ${seeded} rows seeded, ${errors} errors.`);
  if (errors > 0) process.exit(1);
}

seed().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
