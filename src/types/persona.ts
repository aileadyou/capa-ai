export type PersonaID =
  | "initiator"
  | "qa_deviation"
  | "head_of_dept"
  | "head_of_qa"
  | "sme";

export interface Persona {
  id: PersonaID;
  displayName: string;
  role: string;
  department: string;
  nik: string;
  avatarInitials: string;
}

