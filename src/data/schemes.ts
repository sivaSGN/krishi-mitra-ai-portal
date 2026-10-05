import type { AppNotification, FarmerProfile, Scheme, SchemeStatus } from "@/types/app";
import rawSchemes from "./raw-schemes.json";

export interface RawSchemeItem {
  scheme_id: number;
  scheme_name: string;
  ministry_department: string;
  category: string;
  launch_year: number | string;
  objective: string;
  target_beneficiaries: string;
  benefits: string;
  state: string;
  eligibility: string;
  documents_required: string;
  official_resource: string;
}

const commonFaqs = [
  {
    q: "Is there an application fee?",
    a: "No fee is charged on the official government portal. Avoid paying agents without verification.",
  },
  {
    q: "How will I know my application status?",
    a: "Use the acknowledgement number on the official portal or contact your nearest agriculture department office.",
  },
  {
    q: "Can tenant farmers apply?",
    a: "Several schemes (such as KCC, Crop Insurance, State input subsidies) include tenant farmers subject to state verification.",
  },
];

function generateSlug(id: number, name: string): string {
  const match = name.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1].toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

function parseList(text: string): string[] {
  if (!text) return [];
  return text
    .split(/;|\. |\n/)
    .map((s) => s.trim().replace(/^[-•*]\s*/, ""))
    .filter((s) => s.length > 2);
}

function calculateMatchScore(index: number, state: string): number {
  if (state.toLowerCase().includes("telangana")) return 94 - (index % 12);
  if (state.toLowerCase().includes("andhra")) return 92 - (index % 15);
  if (state.toLowerCase().includes("tamil")) return 90 - (index % 14);
  return 96 - (index % 25);
}

function getStatus(index: number): SchemeStatus {
  if (index % 5 === 0) return "Closing soon";
  if (index % 3 === 0) return "Year-round";
  return "Open";
}

function getDeadline(index: number): string {
  if (index % 5 === 0) return "31 Jul 2026";
  if (index % 3 === 0) return "Year-round";
  if (index % 4 === 0) return "30 Nov 2026";
  if (index % 2 === 0) return "15 Dec 2026";
  return "31 Mar 2027";
}

export const schemes: Scheme[] = (rawSchemes as RawSchemeItem[]).map((raw, idx) => {
  const slug = generateSlug(raw.scheme_id, raw.scheme_name);
  const matchScore = calculateMatchScore(idx, raw.state);
  const status = getStatus(idx);
  const deadline = getDeadline(idx);
  const eligibilityList = parseList(raw.eligibility);
  const docsList = parseList(raw.documents_required);
  const stateNorm = raw.state === "India" ? "All India" : raw.state;

  return {
    id: slug || `scheme-${raw.scheme_id}`,
    name: raw.scheme_name,
    shortName: raw.scheme_name.includes("(")
      ? raw.scheme_name.split("(")[0]!.trim()
      : raw.scheme_name,
    department: raw.ministry_department,
    category: raw.category,
    description: raw.objective,
    benefit: raw.benefits,
    eligibility: eligibilityList.length ? eligibilityList : [raw.eligibility],
    documents: docsList.length ? docsList : ["Aadhaar card", "Land records", "Bank account details"],
    state: stateNorm,
    deadline,
    status,
    matchScore,
    why: [
      `Suitable for ${raw.target_beneficiaries.toLowerCase()}`,
      `Available in ${stateNorm}`,
      `Category: ${raw.category}`,
    ],
    applicationSteps: [
      "Check your eligibility criteria",
      "Prepare the listed documents and identification",
      "Apply through the official portal or local service centre",
      "Keep your acknowledgement number for status tracking",
    ],
    dates: [
      { label: "Applications status", value: status === "Open" ? "Active" : status },
      { label: "Launch year", value: String(raw.launch_year || "Ongoing") },
      { label: "Next review / deadline", value: deadline },
    ],
    faqs: [
      ...commonFaqs,
      {
        q: `Who is the primary target of ${raw.scheme_name}?`,
        a: raw.target_beneficiaries,
      },
    ],
  };
});

export const defaultProfile: FarmerProfile = {
  name: "Ramesh Kumar",
  age: "46",
  gender: "Male",
  state: "Telangana",
  district: "Warangal",
  farmerType: "Small Farmer",
  crop: "Paddy & Cotton",
  experience: "18 years",
  irrigation: "Borewell",
  ownership: "Owned",
  landSize: "3.5 acres",
  landLocation: "Warangal Rural",
  income: "₹1,80,000",
  aadhaar: true,
  bank: true,
  landDocument: true,
};

export const defaultNotifications: AppNotification[] = [
  {
    id: "n1",
    title: "New scheme available in your state",
    detail: "Rythu Bharosa and Annadata Sukhibhava details updated.",
    time: "12 min ago",
    type: "scheme",
    read: false,
  },
  {
    id: "n2",
    title: "PM-KISAN information updated",
    detail: "Direct income support next instalment schedule announced.",
    time: "2 hours ago",
    type: "update",
    read: false,
  },
  {
    id: "n3",
    title: "Saved scheme deadline approaching",
    detail: "PM Fasal Bima Yojana enrolment window is open.",
    time: "Yesterday",
    type: "deadline",
    read: false,
  },
  {
    id: "n4",
    title: "Eligibility profile needs updating",
    detail: "Review your crop and land details for refreshed recommendations.",
    time: "3 days ago",
    type: "profile",
    read: true,
  },
];

export const activities = [
  "Eligibility checked for PM-KISAN",
  "Saved Kisan Credit Card (KCC)",
  "Asked AI about crop insurance (PMFBY)",
  "Explored Rythu Bharosa & Subsidies",
];
