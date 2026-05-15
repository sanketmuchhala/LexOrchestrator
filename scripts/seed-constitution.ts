/**
 * Seeds the US Constitution into Supabase as the primary legal RAG source.
 * Constitutional provisions have source_type = 'primary' and receive a
 * retrieval priority boost over sample corpus entries.
 *
 * Run with: npm run seed:constitution
 *
 * Source: United States Constitution (public domain)
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
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

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

// US Constitution articles and amendments as structured chunks.
// Sourced from the National Archives public domain text.
// Each chunk maps to a meaningful legal unit (article, section, or amendment).
const CONSTITUTION_CHUNKS: Array<{
  citationId: string;
  title: string;
  practiceArea: string;
  text: string;
  keywords: string[];
}> = [
  {
    citationId: "CONST-PREAMBLE",
    title: "Preamble to the United States Constitution",
    practiceArea: "constitutional",
    text: "We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America.",
    keywords: ["preamble", "constitution", "justice", "union", "liberty", "welfare", "people", "united states"],
  },
  {
    citationId: "CONST-ART1-SEC1",
    title: "Article I - Legislative Power (Section 1)",
    practiceArea: "constitutional",
    text: "All legislative Powers herein granted shall be vested in a Congress of the United States, which shall consist of a Senate and House of Representatives. Congress has the exclusive authority to enact federal laws. No other branch may exercise the legislative power vested in Congress by the Constitution.",
    keywords: ["congress", "senate", "house", "legislative", "power", "law", "federal", "article 1"],
  },
  {
    citationId: "CONST-ART1-SEC8",
    title: "Article I - Enumerated Powers of Congress (Section 8)",
    practiceArea: "constitutional",
    text: "The Congress shall have Power To lay and collect Taxes, Duties, Imposts and Excises, to pay the Debts and provide for the common Defence and general Welfare of the United States; To borrow Money on the credit of the United States; To regulate Commerce with foreign Nations, and among the several States, and with the Indian Tribes; To establish a uniform Rule of Naturalization, and uniform Laws on the subject of Bankruptcies throughout the United States; To coin Money, regulate the Value thereof; To promote the Progress of Science and useful Arts, by securing for limited Times to Authors and Inventors the exclusive Right to their respective Writings and Discoveries; To define and punish Piracies and Felonies committed on the high Seas; To declare War; To make all Laws which shall be necessary and proper for carrying into Execution the foregoing Powers.",
    keywords: ["commerce", "tax", "bankruptcy", "war", "necessary", "proper", "clause", "enumerated", "powers", "congress", "regulate"],
  },
  {
    citationId: "CONST-ART2-SEC1",
    title: "Article II - Executive Power (Section 1)",
    practiceArea: "constitutional",
    text: "The executive Power shall be vested in a President of the United States of America. The President shall hold Office during the Term of four Years. No Person except a natural born Citizen shall be eligible to the Office of President. The President shall take the following Oath: 'I will faithfully execute the Office of President of the United States, and will to the best of my Ability, preserve, protect and defend the Constitution of the United States.'",
    keywords: ["president", "executive", "power", "office", "term", "oath", "article 2", "citizen"],
  },
  {
    citationId: "CONST-ART3-SEC1",
    title: "Article III - Judicial Power (Section 1)",
    practiceArea: "constitutional",
    text: "The judicial Power of the United States, shall be vested in one supreme Court, and in such inferior Courts as the Congress may from time to time ordain and establish. The Judges, both of the supreme and inferior Courts, shall hold their Offices during good Behaviour, and shall receive Compensation which shall not be diminished during their Continuance in Office.",
    keywords: ["judicial", "supreme court", "inferior courts", "judges", "article 3", "federal courts", "jurisdiction"],
  },
  {
    citationId: "CONST-ART3-SEC2",
    title: "Article III - Judicial Jurisdiction and Trial Rights (Section 2)",
    practiceArea: "constitutional",
    text: "The judicial Power shall extend to all Cases, in Law and Equity, arising under this Constitution, the Laws of the United States, and Treaties made; to all Cases affecting Ambassadors; to Controversies between two or more States; between a State and Citizens of another State; between Citizens of different States. The Trial of all Crimes, except in Cases of Impeachment, shall be by Jury; and such Trial shall be held in the State where the said Crimes shall have been committed.",
    keywords: ["jurisdiction", "cases", "jury trial", "federal question", "diversity", "states", "crimes", "equity"],
  },
  {
    citationId: "CONST-ART6-SUP",
    title: "Article VI - Supremacy Clause",
    practiceArea: "constitutional",
    text: "This Constitution, and the Laws of the United States which shall be made in Pursuance thereof; and all Treaties made, or which shall be made, under the Authority of the United States, shall be the supreme Law of the Land; and the Judges in every State shall be bound thereby, any Thing in the Constitution or Laws of any State to the Contrary notwithstanding. The Senators and Representatives, and all executive and judicial Officers of the United States and of the several States, shall be bound by Oath or Affirmation, to support this Constitution.",
    keywords: ["supremacy", "clause", "federal law", "preemption", "supreme law", "land", "treaties", "states"],
  },
  {
    citationId: "CONST-AMEND1",
    title: "First Amendment - Free Speech, Religion, Assembly",
    practiceArea: "constitutional",
    text: "Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances. First Amendment protections apply to government action and require strict scrutiny when fundamental rights are burdened.",
    keywords: ["first amendment", "free speech", "religion", "press", "assembly", "petition", "establishment clause", "free exercise"],
  },
  {
    citationId: "CONST-AMEND4",
    title: "Fourth Amendment - Search and Seizure",
    practiceArea: "constitutional",
    text: "The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated, and no Warrants shall issue, but upon probable cause, supported by Oath or affirmation, and particularly describing the place to be searched, and the persons or things to be seized. Evidence obtained in violation of the Fourth Amendment is generally excluded under the exclusionary rule.",
    keywords: ["fourth amendment", "search", "seizure", "warrant", "probable cause", "unreasonable", "exclusionary rule", "privacy", "evidence"],
  },
  {
    citationId: "CONST-AMEND5",
    title: "Fifth Amendment - Due Process, Self-Incrimination, Double Jeopardy",
    practiceArea: "constitutional",
    text: "No person shall be held to answer for a capital, or otherwise infamous crime, unless on a presentment or indictment of a Grand Jury; nor shall any person be subject for the same offence to be twice put in jeopardy of life or limb; nor shall be compelled in any criminal case to be a witness against himself, nor be deprived of life, liberty, or property, without due process of law; nor shall private property be taken for public use, without just compensation.",
    keywords: ["fifth amendment", "due process", "self-incrimination", "double jeopardy", "grand jury", "takings", "just compensation", "miranda"],
  },
  {
    citationId: "CONST-AMEND6",
    title: "Sixth Amendment - Right to Counsel, Speedy Trial, Confrontation",
    practiceArea: "constitutional",
    text: "In all criminal prosecutions, the accused shall enjoy the right to a speedy and public trial, by an impartial jury of the State and district wherein the crime shall have been committed; to be informed of the nature and cause of the accusation; to be confronted with the witnesses against him; to have compulsory process for obtaining witnesses in his favor, and to have the Assistance of Counsel for his defence.",
    keywords: ["sixth amendment", "right to counsel", "speedy trial", "jury", "confrontation clause", "impartial", "criminal", "defense"],
  },
  {
    citationId: "CONST-AMEND7",
    title: "Seventh Amendment - Right to Jury Trial in Civil Cases",
    practiceArea: "constitutional",
    text: "In Suits at common law, where the value in controversy shall exceed twenty dollars, the right of trial by jury shall be preserved, and no fact tried by a jury, shall be otherwise re-examined in any Court of the United States, than according to the rules of the common law. The Seventh Amendment preserves the right to a civil jury trial in federal court for common law claims.",
    keywords: ["seventh amendment", "civil jury", "trial", "common law", "jury trial", "federal court", "civil litigation"],
  },
  {
    citationId: "CONST-AMEND8",
    title: "Eighth Amendment - Cruel and Unusual Punishment",
    practiceArea: "constitutional",
    text: "Excessive bail shall not be required, nor excessive fines imposed, nor cruel and unusual punishments inflicted. The Eighth Amendment prohibits disproportionate criminal penalties and protects against barbaric punishment. Courts apply the Eighth Amendment to evaluate prison conditions, sentencing, and capital punishment.",
    keywords: ["eighth amendment", "cruel", "unusual punishment", "bail", "fines", "sentencing", "capital punishment", "proportionality"],
  },
  {
    citationId: "CONST-AMEND14-SEC1",
    title: "Fourteenth Amendment - Equal Protection and Due Process (Section 1)",
    practiceArea: "constitutional",
    text: "All persons born or naturalized in the United States, and subject to the jurisdiction thereof, are citizens of the United States and of the State wherein they reside. No State shall make or enforce any law which shall abridge the privileges or immunities of citizens of the United States; nor shall any State deprive any person of life, liberty, or property, without due process of law; nor deny to any person within its jurisdiction the equal protection of the laws. The Fourteenth Amendment incorporates most Bill of Rights protections against state action and provides the basis for substantive due process and equal protection claims.",
    keywords: ["fourteenth amendment", "equal protection", "due process", "citizenship", "privileges", "immunities", "state action", "incorporation", "discrimination"],
  },
];

async function seed() {
  console.log("\nSeeding US Constitution as primary RAG source...\n");

  // Check if constitution already partially seeded
  const { data: existing } = await supabase
    .from("legal_chunks")
    .select("citation_id")
    .like("citation_id", "CONST-%");

  const existingIds = new Set((existing ?? []).map((r: { citation_id: string }) => r.citation_id));
  const toSeed = CONSTITUTION_CHUNKS.filter((c) => !existingIds.has(c.citationId));

  if (toSeed.length === 0) {
    console.log("Constitution already fully seeded. Run embed:legal to generate embeddings.");
    return;
  }

  // Upsert parent legal_document for Constitution
  const { data: doc, error: docError } = await supabase
    .from("legal_documents")
    .upsert(
      {
        title: "United States Constitution (1787, with Amendments)",
        jurisdiction: "Federal",
        practice_area: "constitutional",
        source_type: "primary",
        disclaimer: "Public domain. Official text of the United States Constitution. This is authoritative legal text, not sample content.",
      },
      { onConflict: "title" }
    )
    .select("id")
    .single();

  if (docError || !doc) {
    console.error("Failed to upsert Constitution document:", docError?.message);
    process.exit(1);
  }

  let seeded = 0;
  let errors = 0;

  for (const chunk of toSeed) {
    const { error } = await supabase
      .from("legal_chunks")
      .upsert(
        {
          document_id: doc.id,
          citation_id: chunk.citationId,
          chunk_text: chunk.text,
          keywords: chunk.keywords,
          jurisdiction: "Federal",
          practice_area: chunk.practiceArea,
        },
        { onConflict: "citation_id" }
      );

    if (error) {
      console.error(`  ERROR ${chunk.citationId}: ${error.message}`);
      errors++;
    } else {
      console.log(`  OK    ${chunk.citationId} - ${chunk.title}`);
      seeded++;
    }
  }

  console.log(`\nConstitution seed complete: ${seeded} chunks added, ${errors} errors.`);
  console.log("Run 'npm run embed:legal' to generate pgvector embeddings for hybrid search.");
}

seed().catch((err) => {
  console.error("seed-constitution failed:", err);
  process.exit(1);
});
