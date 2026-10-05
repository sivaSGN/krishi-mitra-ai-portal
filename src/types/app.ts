export type Language = "en" | "hi" | "te" | "ta";
export type SchemeStatus = "Open" | "Closing soon" | "Year-round";
export interface Scheme { id:string; name:string; shortName:string; department:string; category:string; description:string; benefit:string; eligibility:string[]; documents:string[]; state:string; deadline:string; status:SchemeStatus; matchScore:number; why:string[]; applicationSteps:string[]; dates:{label:string;value:string}[]; faqs:{q:string;a:string}[] }
export interface FarmerProfile { name:string; age:string; gender:string; state:string; district:string; farmerType:string; crop:string; experience:string; irrigation:string; ownership:string; landSize:string; landLocation:string; income:string; aadhaar:boolean; bank:boolean; landDocument:boolean }
export interface ChatMessage { id:string; role:"user"|"assistant"; content:string; schemeIds?:string[]; confidence?:number; createdAt:string }
export interface ChatThread { id:string; title:string; updatedAt:string; messages:ChatMessage[] }
export interface AppNotification { id:string; title:string; detail:string; time:string; type:"scheme"|"deadline"|"profile"|"update"; read:boolean }
