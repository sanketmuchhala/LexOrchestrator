export const demoJurisdiction = "SDNY";
export const demoCourt = "S.D.N.Y.";
export const demoMotionType = "motion_to_dismiss";
export const demoJudgeName = "Jed S. Rakoff";

export const demoFacts = [
  "Plaintiff Aurora Analytics LLC alleges that defendant Northstar Retail Systems breached a pilot software agreement after a six-week evaluation period.",
  "The written pilot agreement stated that any production deployment required a later signed order form, but no order form was signed.",
  "The complaint asserts breach of contract, promissory estoppel, and unjust enrichment based on alleged oral assurances that Northstar would proceed to a paid rollout.",
  "Northstar seeks dismissal because the complaint does not identify a binding production contract, pleads no definite promise beyond negotiations, and duplicates quasi-contract claims where the pilot agreement governs the parties' relationship.",
].join(" ");

export const demoUploadedText = [
  "DEMO ONLY. The pilot agreement allowed Aurora Analytics LLC to configure a sample dashboard for Northstar Retail Systems.",
  "The agreement disclaimed any obligation to purchase a production subscription absent a mutually executed order form.",
  "Aurora alleges that Northstar employees praised the pilot and discussed possible rollout timing, but the parties never signed a production order form.",
].join("\n\n");

export const demoDesiredOutput =
  "Draft a concise defendant-side motion to dismiss outline with verified citations, SDNY local rules notes, adversarial review, and judge brief where available. Demo content only; not legal advice.";

export const demoQuery = [
  `Prepare a motion to dismiss in ${demoCourt}.`,
  demoFacts,
  `Desired output: ${demoDesiredOutput}`,
].join(" ");
