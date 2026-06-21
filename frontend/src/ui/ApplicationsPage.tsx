import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Filter, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getJobs, updateJobStatus } from "../lib/api";
import type { JobStatus } from "../types";
import { FieldLabel, InlineError, JobTable, Panel, STATUSES, formatDateKey, sanitizeDateParam } from "./job-ui";

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100, "all"] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(searchParams.get("search") ?? "");
  const [selectedJobIds, setSelectedJobIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<JobStatus>("PENDING");
  const [pageSize, setPageSize] = useState<PageSizeOption>(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"serialNo" | "uploadedAt" | "companyName" | "status">("serialNo");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const date = sanitizeDateParam(searchParams.get("date"));
  const status = searchParams.get("status") ?? "";
  const scope = searchParams.get("scope") ?? "";

  const jobsQuery = useQuery({
    queryKey: ["jobs", date, status, searchDraft],
    refetchOnMount: "always",
    queryFn: () =>
      getJobs({
        date: date || undefined,
        status: status || undefined,
        search: searchDraft || undefined
      })
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: JobStatus }) => updateJobStatus(id, nextStatus),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      ]);
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, nextStatus }: { ids: number[]; nextStatus: JobStatus }) =>
      Promise.all(ids.map((id) => updateJobStatus(id, nextStatus))),
    onSuccess: async () => {
      setSelectedJobIds([]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      ]);
    }
  });

  const filteredJobs = useMemo(() => {
    const list = [...(jobsQuery.data ?? [])];
    const today = formatDateKey(new Date());
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - 6);
    recentCutoff.setHours(0, 0, 0, 0);

    const filtered = list.filter((job) => {
      const uploaded = new Date(job.uploadedAt);
      const uploadedDate = formatDateKey(uploaded);

      if (scope === "today") {
        return uploadedDate === (date || today);
      }
      if (scope === "recent") {
        return uploaded >= recentCutoff;
      }
      return true;
    });

    return filtered;
  }, [date, jobsQuery.data, scope]);

  const baseJobs = useMemo(() => {
    return [...filteredJobs].sort((left, right) => left.serialNo - right.serialNo);
  }, [filteredJobs]);

  const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(baseJobs.length / pageSize));
  const paginatedJobs = useMemo(() => {
    if (pageSize === "all") {
      return baseJobs;
    }
    const startIndex = (currentPage - 1) * pageSize;
    return baseJobs.slice(startIndex, startIndex + pageSize);
  }, [baseJobs, currentPage, pageSize]);

  const sortedVisibleJobs = useMemo(() => {
    const list = [...paginatedJobs];
    return list.sort((left, right) => {
      switch (sortField) {
        case "uploadedAt": {
          const leftValue = new Date(left.uploadedAt).getTime();
          const rightValue = new Date(right.uploadedAt).getTime();
          return sortDirection === "asc" ? leftValue - rightValue : rightValue - leftValue;
        }
        case "companyName": {
          const result = (left.companyName ?? "Unknown").localeCompare(right.companyName ?? "Unknown", undefined, {
            sensitivity: "base"
          });
          return sortDirection === "asc" ? result : -result;
        }
        case "status": {
          const result = left.status.localeCompare(right.status, undefined, { sensitivity: "base" });
          return sortDirection === "asc" ? result : -result;
        }
        case "serialNo":
        default:
          return sortDirection === "asc" ? left.serialNo - right.serialNo : right.serialNo - left.serialNo;
      }
    });
  }, [paginatedJobs, sortDirection, sortField]);

  const selectedCount = selectedJobIds.length;
  const pageStart = filteredJobs.length ? (pageSize === "all" ? 1 : (currentPage - 1) * pageSize + 1) : 0;
  const pageEnd = pageSize === "all" ? filteredJobs.length : Math.min(currentPage * pageSize, filteredJobs.length);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedJobIds([]);
  }, [date, scope, searchDraft, status]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setSelectedJobIds((current) => current.filter((id) => filteredJobs.some((job) => job.id === id)));
  }, [filteredJobs]);

  function handleSortChange(field: "serialNo" | "uploadedAt" | "companyName" | "status") {
    if (sortField === field) {
      setCurrentPage(1);
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("asc");
    setCurrentPage(1);
  }

  function escapeCsv(value: string | null | undefined) {
    const resolved = value ?? "";
    return `"${resolved.replaceAll('"', '""')}"`;
  }

  function exportFilteredJobs() {
    const header = ["S.No", "Uploaded At", "Company", "Status", "Source", "Job URL", "Applied At"];
    const rows = filteredJobs.map((job) => [
      String(job.serialNo),
      job.uploadedAt,
      job.companyName ?? "Unknown",
      job.status,
      job.sourceType,
      job.jobUrl,
      job.appliedAt ?? ""
    ]);

    const csv = [header, ...rows].map((row) => row.map((cell) => escapeCsv(cell)).join(",")).join("\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `applications-page-${currentPage}-filtered.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  function updateParams(next: { date?: string; status?: string; search?: string; scope?: string }) {
    const params = new URLSearchParams(searchParams);

    if (next.date !== undefined) {
      next.date ? params.set("date", next.date) : params.delete("date");
    }
    if (next.status !== undefined) {
      next.status ? params.set("status", next.status) : params.delete("status");
    }
    if (next.search !== undefined) {
      next.search ? params.set("search", next.search) : params.delete("search");
    }
    if (next.scope !== undefined) {
      next.scope ? params.set("scope", next.scope) : params.delete("scope");
    }

    setSearchParams(params);
  }

  function toggleJobSelection(jobId: number) {
    setSelectedJobIds((current) => (current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId]));
  }

  function toggleAllJobSelections(jobIds: number[]) {
    setSelectedJobIds((current) => {
      const allSelected = jobIds.every((jobId) => current.includes(jobId));
      if (allSelected) {
        return current.filter((jobId) => !jobIds.includes(jobId));
      }
      return Array.from(new Set([...current, ...jobIds]));
    });
  }

  return (
    <div className="space-y-6">
      <Panel
        title="Applications"
        description="Review every uploaded or manually added application in a dedicated workspace. Links open in the next tab and statuses stay color-coded for fast scanning."
        icon={<Filter className="h-5 w-5" />}
      >
        <div className="rounded-[1.5rem] border border-[#d5d9d9] bg-gradient-to-r from-[#131921] via-[#1b2838] to-[#27384f] p-5 text-white shadow-panel">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ffcc80]">Application Filters</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Find the exact applications you want to work on</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-300">
                Search by company or URL, narrow by upload date and status, then export or review only the matching rows.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchDraft("");
                setSearchParams(new URLSearchParams());
              }}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/16"
            >
              Reset Filters
            </button>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_0.8fr_0.8fr]">
            <FieldLabel label="Search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchDraft}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSearchDraft(value);
                    updateParams({ search: value });
                  }}
                  placeholder="Search by company or URL"
                  className="w-full rounded-2xl border border-white/10 bg-white px-11 py-3 text-slate-900 shadow-sm"
                />
              </div>
            </FieldLabel>

            <FieldLabel label="Upload Date">
              <input
                type="date"
                value={date}
                onChange={(event) => updateParams({ date: event.target.value, scope: event.target.value ? "" : scope })}
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-slate-900 shadow-sm"
              />
            </FieldLabel>

            <FieldLabel label="Status">
              <select
                value={status}
                onChange={(event) => updateParams({ status: event.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-slate-900 shadow-sm"
              >
                <option value="">All statuses</option>
                {STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>
        </div>

        {jobsQuery.isError ? <InlineError message={(jobsQuery.error as Error).message} /> : null}
        {updateStatusMutation.isError ? <InlineError message={(updateStatusMutation.error as Error).message} /> : null}
        {bulkUpdateMutation.isError ? <InlineError message={(bulkUpdateMutation.error as Error).message} /> : null}

        <div className="flex flex-col gap-4 rounded-[1.4rem] border border-slate-200 bg-[#f7f8fa] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">List Controls</p>
              <p className="text-sm text-slate-500">
                Show {pageStart}-{pageEnd} of {filteredJobs.length} filtered applications.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <FieldLabel label="Applications Per Page">
                <select
                  aria-label="Applications per page"
                  value={pageSize}
                  onChange={(event) => {
                    const value = event.target.value === "all" ? "all" : Number(event.target.value);
                    setPageSize(value as PageSizeOption);
                    setCurrentPage(1);
                  }}
                  className="min-w-40 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "All" : option}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <button
                type="button"
                disabled={!filteredJobs.length}
                onClick={exportFilteredJobs}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand/30 hover:text-brand disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <Download className="h-4 w-4" />
                Export Filtered Applications
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Bulk Status Update</p>
              <p className="text-sm text-slate-500">
                {selectedCount ? `${selectedCount} application${selectedCount > 1 ? "s" : ""} selected` : "Select multiple applications to update them together."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <FieldLabel label="New Status">
                <select
                  value={bulkStatus}
                  onChange={(event) => setBulkStatus(event.target.value as JobStatus)}
                  className="min-w-44 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  {STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {option.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <button
                type="button"
                disabled={!selectedCount || bulkUpdateMutation.isPending}
                onClick={() => bulkUpdateMutation.mutate({ ids: selectedJobIds, nextStatus: bulkStatus })}
                className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {bulkUpdateMutation.isPending ? "Saving..." : "Update Selected"}
              </button>
            </div>
          </div>
        </div>

        <JobTable
          jobs={sortedVisibleJobs}
          onStatusSave={(id, nextStatus) => updateStatusMutation.mutate({ id, nextStatus })}
          selectedJobIds={selectedJobIds}
          onToggleJobSelection={toggleJobSelection}
          onToggleAllJobSelections={toggleAllJobSelections}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    currentPage === page
                      ? "bg-ink text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-brand/30 hover:text-brand"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
