export type CefrTarget = "A1" | "A2" | "B1" | "B2" | "C1";

export interface PublicUser {
  id: string;
  email: string;
  phone: string | null;
  role: "STUDENT" | "PARENT" | "CURATOR" | "ADMIN";
  status: "ACTIVE" | "PENDING_CONSENT" | "BLOCKED";
  firstName: string;
  lastName: string | null;
  locale: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface StudentProfile {
  birthDate: string;
  isMinor: boolean;
  targetLevel: CefrTarget | null;
  goal: string | null;
  dailyMinutes: number;
}

export interface MeResponse extends PublicUser {
  studentProfile: StudentProfile | null;
  activeConsents: { type: string; version: string; grantedAt: string }[];
  requiresParentConsent: boolean;
}

export interface LinkCode {
  code: string;
  expiresAt: string;
}
