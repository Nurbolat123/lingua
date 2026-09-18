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

export type ConsentType = "DATA_PROCESSING" | "VOICE_RECORDING" | "CAMERA" | "MICROPHONE" | "MARKETING";

export interface ActiveConsent {
  type: ConsentType;
  version: string;
  grantedAt: string;
}

export interface ChildSummary {
  id: string;
  firstName: string;
  lastName: string | null;
  status: "ACTIVE" | "PENDING_CONSENT" | "BLOCKED";
  lastLoginAt: string | null;
  linkedAt: string;
  studentProfile: {
    isMinor: boolean;
    birthDate: string;
    targetLevel: CefrTarget | null;
    dailyMinutes: number;
  };
  consents: ActiveConsent[];
}

export interface CuratorStudent {
  id: string;
  firstName: string;
  lastName: string | null;
  status: "ACTIVE" | "PENDING_CONSENT" | "BLOCKED";
  lastLoginAt: string | null;
  assignedAt: string;
  studentProfile: {
    isMinor: boolean;
    targetLevel: CefrTarget | null;
    dailyMinutes: number;
  };
}

export interface StudentSummary {
  id: string;
  firstName: string;
  lastName: string | null;
  status: "ACTIVE" | "PENDING_CONSENT" | "BLOCKED";
  locale: string;
  lastLoginAt: string | null;
  createdAt: string;
  studentProfile: {
    isMinor: boolean;
    targetLevel: CefrTarget | null;
    goal: string | null;
    dailyMinutes: number;
  };
  curator: { id: string; firstName: string; lastName: string | null; assignedAt: string } | null;
}
