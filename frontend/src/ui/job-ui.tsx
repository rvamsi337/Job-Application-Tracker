import { ArrowDown, ArrowUp, ArrowUpDown, Check, Copy, Link2, Mail, Phone } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { DuplicateJob, JobApplication, JobStatus, RecruiterContact } from "../types";

export const APP_TIME_ZONE = "America/Chicago";
export const STATUSES: JobStatus[] = ["PENDING", "APPLIED", "NOT_RELEVANT", "SAVED"];

export const statusStyles: Record<JobStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  APPLIED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  NOT_RELEVANT: "bg-rose-50 text-rose-700 ring-rose-200",
  SAVED: "bg-sky-50 text-sky-700 ring-sky-200"
};

export function prettyStatus(status: JobStatus) {
  return status.replaceAll("_", " ");
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: APP_TIME_ZONE
  }).format(new Date(value));
}

export function formatDateKey(value: Date | string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(typeof value === "string" ? new Date(value) : value);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";
  return `${year}-${month}-${day}`;
}

export function sanitizeDateParam(value: string | null) {
  if (!value) {
    return "";
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

export function FieldLabel({ label, children }: { label: string; children: import("react").ReactNode }) {
  return (
    <label className="text-sm font-medium text-slate-600">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

export function Panel({
  title,
  description,
  icon,
  children
}: {
  title: string;
  description: string;
  icon?: import("react").ReactNode;
  children: import("react").ReactNode;
}) {
  return (
    <section className="rounded-[1.6rem] border border-[#d5d9d9] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] p-6 shadow-panel">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {icon ? <div className="rounded-2xl border border-[#f7d8a8] bg-[linear-gradient(180deg,#fff8ed,#fff1d6)] p-3 text-[#b12704]">{icon}</div> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function InlineError({ message }: { message: string }) {
  return <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{message}</p>;
}

type SortDirection = "asc" | "desc";

function compareText(left: string | null | undefined, right: string | null | undefined, direction: SortDirection) {
  const result = (left ?? "").localeCompare(right ?? "", undefined, { sensitivity: "base" });
  return direction === "asc" ? result : -result;
}

function compareNumber(left: number, right: number, direction: SortDirection) {
  return direction === "asc" ? left - right : right - left;
}

function compareDate(left: string, right: string, direction: SortDirection) {
  const leftValue = new Date(left).getTime();
  const rightValue = new Date(right).getTime();
  return direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
}

function SortHeader({
  label,
  active,
  direction,
  onClick
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-1 py-1 transition ${
        active ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
      }`}
      aria-label={`Sort by ${label} ${active && direction === "asc" ? "descending" : "ascending"}`}
    >
      <span>{label}</span>
      {active ? (
        direction === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4" />
      )}
    </button>
  );
}

export function JobTable({
  jobs,
  onStatusSave,
  selectedJobIds,
  onToggleJobSelection,
  onToggleAllJobSelections,
  sortField,
  sortDirection,
  onSortChange
}: {
  jobs: JobApplication[];
  onStatusSave: (jobId: number, status: JobStatus) => void;
  selectedJobIds: number[];
  onToggleJobSelection: (jobId: number) => void;
  onToggleAllJobSelections: (jobIds: number[]) => void;
  sortField: "serialNo" | "uploadedAt" | "companyName" | "status";
  sortDirection: SortDirection;
  onSortChange: (field: "serialNo" | "uploadedAt" | "companyName" | "status") => void;
}) {
  const [draftStatuses, setDraftStatuses] = useState<Record<number, JobStatus>>({});
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const resolvedStatuses = useMemo(() => {
    const next: Record<number, JobStatus> = {};
    jobs.forEach((job) => {
      next[job.id] = draftStatuses[job.id] ?? job.status;
    });
    return next;
  }, [draftStatuses, jobs]);

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    window.setTimeout(() => setCopiedValue((current) => (current === value ? null : current)), 1600);
  }

  const allVisibleSelected = jobs.length > 0 && jobs.every((job) => selectedJobIds.includes(job.id));

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[#d5d9d9] bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-[linear-gradient(180deg,#f8f9fb,#edf1f4)] text-left text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={() => onToggleAllJobSelections(jobs.map((job) => job.id))}
                aria-label="Select all visible applications"
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
              />
            </th>
            <th className="px-4 py-3 font-medium">
              <SortHeader label="S.No" active={sortField === "serialNo"} direction={sortDirection} onClick={() => onSortChange("serialNo")} />
            </th>
            <th className="px-4 py-3 font-medium">
              <SortHeader label="Company" active={sortField === "companyName"} direction={sortDirection} onClick={() => onSortChange("companyName")} />
            </th>
            <th className="px-4 py-3 font-medium">Link</th>
            <th className="px-4 py-3 font-medium">
              <SortHeader label="Date" active={sortField === "uploadedAt"} direction={sortDirection} onClick={() => onSortChange("uploadedAt")} />
            </th>
            <th className="px-4 py-3 font-medium">
              <SortHeader label="Current Status" active={sortField === "status"} direction={sortDirection} onClick={() => onSortChange("status")} />
            </th>
            <th className="px-4 py-3 font-medium">Update Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {jobs.map((job) => (
            <tr key={job.id} className="align-top transition hover:bg-[#fffaf2]">
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedJobIds.includes(job.id)}
                  onChange={() => onToggleJobSelection(job.id)}
                  aria-label={`Select application ${job.serialNo}`}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
              </td>
              <td className="px-4 py-4 font-semibold text-slate-900">{job.serialNo}</td>
              <td className="px-4 py-4">
                <p className="font-medium text-slate-900">{job.companyName ?? "Unknown"}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{job.sourceType.replace("_", " ")}</p>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-start gap-2">
                  <a
                    href={job.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-[24rem] items-center gap-2 break-all text-brand hover:underline"
                  >
                    <Link2 className="h-4 w-4 shrink-0" />
                    {job.jobUrl}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyText(job.jobUrl)}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-brand/40 hover:text-brand"
                    aria-label={`Copy link for application ${job.serialNo}`}
                  >
                    {copiedValue === job.jobUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </td>
              <td className="px-4 py-4 text-slate-600">{formatDateTime(job.uploadedAt)}</td>
              <td className="px-4 py-4">
                <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[job.status]}`}>
                  {prettyStatus(job.status)}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[resolvedStatuses[job.id]]}`}>
                  {prettyStatus(resolvedStatuses[job.id])}
                </div>
                <div className="flex gap-2">
                  <select
                    aria-label={`Status for application ${job.serialNo}`}
                    value={resolvedStatuses[job.id]}
                    onChange={(event) =>
                      setDraftStatuses((current) => ({
                        ...current,
                        [job.id]: event.target.value as JobStatus
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {prettyStatus(status)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={resolvedStatuses[job.id] === job.status}
                    onClick={() => onStatusSave(job.id, resolvedStatuses[job.id])}
                    className="rounded-2xl bg-ink px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Save
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!jobs.length ? <div className="px-4 py-10 text-center text-sm text-slate-500">No applications found for the current filter.</div> : null}
    </div>
  );
}

export function DuplicateJobsTable({ duplicates }: { duplicates: DuplicateJob[] }) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"duplicateDetectedAt" | "originalUploadedAt" | "companyName">("duplicateDetectedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedDuplicates = useMemo(() => {
    const list = [...duplicates];
    return list.sort((left, right) => {
      switch (sortField) {
        case "originalUploadedAt":
          return compareDate(left.originalUploadedAt, right.originalUploadedAt, sortDirection);
        case "companyName":
          return compareText(left.companyName ?? "Unknown", right.companyName ?? "Unknown", sortDirection);
        case "duplicateDetectedAt":
        default:
          return compareDate(left.duplicateDetectedAt, right.duplicateDetectedAt, sortDirection);
      }
    });
  }, [duplicates, sortDirection, sortField]);

  function toggleSort(field: "duplicateDetectedAt" | "originalUploadedAt" | "companyName") {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("asc");
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    window.setTimeout(() => setCopiedValue((current) => (current === value ? null : current)), 1600);
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[#d5d9d9] bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-[linear-gradient(180deg,#f8f9fb,#edf1f4)] text-left text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">S.No</th>
            <th className="px-4 py-3 font-medium">
              <SortHeader
                label="Duplicate Date"
                active={sortField === "duplicateDetectedAt"}
                direction={sortDirection}
                onClick={() => toggleSort("duplicateDetectedAt")}
              />
            </th>
            <th className="px-4 py-3 font-medium">
              <SortHeader
                label="Original Upload"
                active={sortField === "originalUploadedAt"}
                direction={sortDirection}
                onClick={() => toggleSort("originalUploadedAt")}
              />
            </th>
            <th className="px-4 py-3 font-medium">
              <SortHeader label="Company" active={sortField === "companyName"} direction={sortDirection} onClick={() => toggleSort("companyName")} />
            </th>
            <th className="px-4 py-3 font-medium">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {sortedDuplicates.map((duplicate, index) => (
            <tr key={duplicate.id} className="align-top transition hover:bg-[#fffaf2]">
              <td className="px-4 py-4 font-semibold text-slate-900">{index + 1}</td>
              <td className="px-4 py-4 text-slate-600">{formatDateTime(duplicate.duplicateDetectedAt)}</td>
              <td className="px-4 py-4 text-slate-600">{formatDateTime(duplicate.originalUploadedAt)}</td>
              <td className="px-4 py-4">
                <p className="font-medium text-slate-900">{duplicate.companyName ?? "Unknown"}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{duplicate.sourceType.replace("_", " ")}</p>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-start gap-2">
                  <a
                    href={duplicate.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-[24rem] items-center gap-2 break-all text-brand hover:underline"
                  >
                    <Link2 className="h-4 w-4 shrink-0" />
                    {duplicate.jobUrl}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyText(duplicate.jobUrl)}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-brand/40 hover:text-brand"
                    aria-label={`Copy duplicate link ${index + 1}`}
                  >
                    {copiedValue === duplicate.jobUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!duplicates.length ? <div className="px-4 py-10 text-center text-sm text-slate-500">No duplicate links found for the current filter.</div> : null}
    </div>
  );
}

export function RecruiterTable({
  recruiters,
  onDelete
}: {
  recruiters: RecruiterContact[];
  onDelete: (id: number) => void;
}) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"companyName" | "recruiterName" | "recruiterEmail" | "createdAt">("companyName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedRecruiters = useMemo(() => {
    const list = [...recruiters];
    return list.sort((left, right) => {
      switch (sortField) {
        case "recruiterName":
          return compareText(left.recruiterName ?? "Not added", right.recruiterName ?? "Not added", sortDirection);
        case "recruiterEmail":
          return compareText(left.recruiterEmail, right.recruiterEmail, sortDirection);
        case "createdAt":
          return compareDate(left.createdAt, right.createdAt, sortDirection);
        case "companyName":
        default:
          return compareText(left.companyName, right.companyName, sortDirection);
      }
    });
  }, [recruiters, sortDirection, sortField]);

  function toggleSort(field: "companyName" | "recruiterName" | "recruiterEmail" | "createdAt") {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("asc");
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    window.setTimeout(() => setCopiedValue((current) => (current === value ? null : current)), 1600);
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[#d5d9d9] bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-[linear-gradient(180deg,#f8f9fb,#edf1f4)] text-left text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">S.No</th>
            <th className="px-4 py-3 font-medium">
              <SortHeader label="Company" active={sortField === "companyName"} direction={sortDirection} onClick={() => toggleSort("companyName")} />
            </th>
            <th className="px-4 py-3 font-medium">
              <SortHeader
                label="Recruiter"
                active={sortField === "recruiterName"}
                direction={sortDirection}
                onClick={() => toggleSort("recruiterName")}
              />
            </th>
            <th className="px-4 py-3 font-medium">
              <SortHeader label="Email" active={sortField === "recruiterEmail"} direction={sortDirection} onClick={() => toggleSort("recruiterEmail")} />
            </th>
            <th className="px-4 py-3 font-medium">Mobile</th>
            <th className="px-4 py-3 font-medium">
              <SortHeader label="Added" active={sortField === "createdAt"} direction={sortDirection} onClick={() => toggleSort("createdAt")} />
            </th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {sortedRecruiters.map((recruiter, index) => (
            <tr key={recruiter.id} className="align-top transition hover:bg-[#fffaf2]">
              <td className="px-4 py-4 font-semibold text-slate-900">{index + 1}</td>
              <td className="px-4 py-4 font-medium text-slate-900">{recruiter.companyName}</td>
              <td className="px-4 py-4 text-slate-600">{recruiter.recruiterName ?? "Not added"}</td>
              <td className="px-4 py-4">
                <div className="flex items-start gap-2">
                  <a href={`mailto:${recruiter.recruiterEmail}`} className="inline-flex items-center gap-2 break-all text-brand hover:underline">
                    <Mail className="h-4 w-4 shrink-0" />
                    {recruiter.recruiterEmail}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyText(recruiter.recruiterEmail)}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-brand/40 hover:text-brand"
                    aria-label={`Copy recruiter email ${index + 1}`}
                  >
                    {copiedValue === recruiter.recruiterEmail ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </td>
              <td className="px-4 py-4 text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                    {recruiter.mobileNumber ?? "Not provided"}
                  </span>
                  {recruiter.mobileNumber ? (
                    <button
                      type="button"
                      onClick={() => copyText(recruiter.mobileNumber!)}
                      className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-brand/40 hover:text-brand"
                      aria-label={`Copy recruiter mobile ${index + 1}`}
                    >
                      {copiedValue === recruiter.mobileNumber ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-4 text-slate-600">{formatDateTime(recruiter.createdAt)}</td>
              <td className="px-4 py-4">
                <div className="flex gap-2">
                  <Link
                    to={`/recruiters/${recruiter.id}/edit`}
                    className="rounded-2xl bg-ink px-4 py-2 text-xs font-semibold text-white"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(recruiter.id)}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!recruiters.length ? <div className="px-4 py-10 text-center text-sm text-slate-500">No recruiter contacts found.</div> : null}
    </div>
  );
}
