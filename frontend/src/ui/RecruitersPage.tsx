import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Search, UploadCloud, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deleteRecruiter, getRecruiters, uploadRecruiters } from "../lib/api";
import { formatDateKey, InlineError, Panel, RecruiterTable } from "./job-ui";

export function RecruitersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const recruitersQuery = useQuery({
    queryKey: ["recruiters", search],
    refetchOnMount: "always",
    queryFn: () => getRecruiters(search || undefined)
  });

  const uploadMutation = useMutation({
    mutationFn: uploadRecruiters,
    onSuccess: async (result) => {
      setUploadFeedback(
        `${result.inserted.length} contacts imported` +
          (result.duplicates.length ? `, ${result.duplicates.length} duplicates skipped` : "") +
          (result.invalidLines.length ? `, ${result.invalidLines.length} invalid rows` : "")
      );
      setSelectedFile(null);
      await queryClient.invalidateQueries({ queryKey: ["recruiters"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecruiter,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recruiters"] });
    }
  });

  const recruiters = useMemo(
    () => [...(recruitersQuery.data ?? [])],
    [recruitersQuery.data]
  );

  function escapeCsv(value: string | null | undefined) {
    const resolved = value ?? "";
    return `"${resolved.replaceAll('"', '""')}"`;
  }

  function exportRecruiters() {
    const header = ["Company", "Recruiter Name", "Recruiter Email", "Mobile Number", "Created At"];
    const exportDate = formatDateKey(new Date());
    const rows = recruiters.map((recruiter) => [
      recruiter.companyName,
      recruiter.recruiterName ?? "",
      recruiter.recruiterEmail,
      recruiter.mobileNumber ?? "",
      recruiter.createdAt
    ]);

    const csv = [header, ...rows].map((row) => row.map((cell) => escapeCsv(cell)).join(",")).join("\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `recruiters-list-${exportDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Panel
        title="Recruiters"
        description="Keep recruiter contacts in their own workspace. Browse the list here, then open a dedicated page to add or edit details."
        icon={<UserRound className="h-5 w-5" />}
      >
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/80 p-5">
            <label className="text-sm font-medium text-slate-600">
              Search Contacts
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by company, recruiter, or email"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3"
                />
              </div>
            </label>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/recruiters/new")}
                className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Add Recruiter
              </button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                <UploadCloud className="h-4 w-4" />
                Upload CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
              <button
                type="button"
                disabled={!selectedFile || uploadMutation.isPending}
                onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
                className="rounded-2xl border border-brand/20 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                {uploadMutation.isPending ? "Importing..." : "Submit CSV"}
              </button>
              <button
                type="button"
                disabled={!recruiters.length || recruitersQuery.isLoading}
                onClick={exportRecruiters}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand/30 hover:text-brand disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              {selectedFile ? <p className="text-sm text-slate-500">{selectedFile.name}</p> : null}
            </div>
            <p className="mt-3 text-sm text-slate-500">
              CSV supports `company,email` and `company,name,email,mobile`. Export downloads the current recruiter list, including search-filtered results.
            </p>
          </div>
        </div>

        {recruitersQuery.isError ? <InlineError message={(recruitersQuery.error as Error).message} /> : null}
        {uploadMutation.isError ? <InlineError message={(uploadMutation.error as Error).message} /> : null}
        {deleteMutation.isError ? <InlineError message={(deleteMutation.error as Error).message} /> : null}
        {uploadFeedback ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{uploadFeedback}</p> : null}

        <RecruiterTable recruiters={recruiters} onDelete={(id) => deleteMutation.mutate(id)} />
      </Panel>
    </div>
  );
}
