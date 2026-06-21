export type JobStatus = "PENDING" | "APPLIED" | "NOT_RELEVANT" | "SAVED";
export type JobSourceType = "FILE_UPLOAD" | "MANUAL_ENTRY";

export interface JobApplication {
  id: number;
  serialNo: number;
  jobUrl: string;
  companyName: string | null;
  sourceType: JobSourceType;
  status: JobStatus;
  uploadedAt: string;
  appliedAt: string | null;
  statusUpdatedAt: string;
}

export interface DuplicateJob {
  id: number;
  jobUrl: string;
  companyName: string | null;
  sourceType: JobSourceType;
  originalUploadedAt: string;
  duplicateDetectedAt: string;
}

export interface InvalidJobLine {
  line: string;
  reason: string;
}

export interface JobUploadResponse {
  inserted: JobApplication[];
  duplicates: DuplicateJob[];
  invalidLines: InvalidJobLine[];
}

export interface DashboardStats {
  totalCount: number;
  todayCount: number;
  recentCount: number;
  statusCounts: Record<string, number>;
}

export interface RecruiterContact {
  id: number;
  companyName: string;
  recruiterName: string | null;
  recruiterEmail: string;
  mobileNumber: string | null;
  createdAt: string;
}

export interface RecruiterUploadResponse {
  inserted: RecruiterContact[];
  duplicates: string[];
  invalidLines: string[];
}
