import type {
  DashboardStats,
  DuplicateJob,
  JobApplication,
  JobStatus,
  JobUploadResponse,
  RecruiterContact,
  RecruiterUploadResponse
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function getDashboardStats() {
  return apiRequest<DashboardStats>("/api/dashboard/stats");
}

export async function getJobs(filters: { date?: string; status?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  return apiRequest<JobApplication[]>(`/api/jobs${query ? `?${query}` : ""}`);
}

export async function getDuplicateJobs(filters: { date?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  return apiRequest<DuplicateJob[]>(`/api/jobs/duplicates${query ? `?${query}` : ""}`);
}

export async function uploadJobs(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/api/jobs/upload`, {
    method: "POST",
    body: formData
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? "Upload failed");
  }
  return response.json() as Promise<JobUploadResponse>;
}

export async function createJob(payload: { jobUrl: string; status: JobStatus }) {
  return apiRequest<JobUploadResponse>("/api/jobs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateJobStatus(id: number, status: JobStatus) {
  return apiRequest<JobApplication>(`/api/jobs/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export async function getRecruiters(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiRequest<RecruiterContact[]>(`/api/recruiters${query}`);
}

export async function createRecruiter(payload: {
  companyName: string;
  recruiterName?: string;
  recruiterEmail: string;
  mobileNumber?: string;
}) {
  return apiRequest<RecruiterContact>("/api/recruiters", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateRecruiter(
  id: number,
  payload: { companyName: string; recruiterName?: string; recruiterEmail: string; mobileNumber?: string }
) {
  return apiRequest<RecruiterContact>(`/api/recruiters/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteRecruiter(id: number) {
  return apiRequest<void>(`/api/recruiters/${id}`, {
    method: "DELETE"
  });
}

export async function uploadRecruiters(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/api/recruiters/upload`, {
    method: "POST",
    body: formData
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? "Recruiter upload failed");
  }
  return response.json() as Promise<RecruiterUploadResponse>;
}
