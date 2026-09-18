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
