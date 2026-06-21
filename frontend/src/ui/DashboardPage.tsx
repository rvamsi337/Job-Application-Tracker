import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, CopyX, FileWarning, Plus, UploadCloud, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createJob, getDashboardStats, uploadJobs } from "../lib/api";
import type { JobUploadResponse } from "../types";
import { APP_TIME_ZONE, InlineError, Panel, formatDateKey } from "./job-ui";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: APP_TIME_ZONE
  }).format(new Date(value));
}

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [manualUrl, setManualUrl] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [jobUploadResult, setJobUploadResult] = useState<JobUploadResponse | null>(null);

  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    refetchOnMount: "always"
  });

  const refreshData = async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ["dashboard-stats"], type: "active" }),
      queryClient.refetchQueries({ queryKey: ["jobs"], type: "active" }),
      queryClient.refetchQueries({ queryKey: ["duplicates"], type: "active" }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["jobs"] }),
      queryClient.invalidateQueries({ queryKey: ["duplicates"] })
    ]);
  };

  const uploadJobsMutation = useMutation({
    mutationFn: uploadJobs,
    onSuccess: async (result) => {
      setJobUploadResult(result);
      setSelectedUploadFile(null);
      await refreshData();
    }
  });

  const createJobMutation = useMutation({
    mutationFn: () => createJob({ jobUrl: manualUrl, status: "PENDING" }),
    onSuccess: async (result) => {
      setManualUrl("");
      setJobUploadResult(null);
      if (result.duplicates.length > 0) {
        setManualMessage(`Duplicate link stored separately. Original upload was ${formatDateTime(result.duplicates[0].originalUploadedAt)}.`);
      } else if (result.invalidLines.length > 0) {
        setManualMessage(result.invalidLines[0].reason);
      } else {
        setManualMessage("Manual application link saved.");
      }
      await refreshData();
    },
    onError: (error: Error) => setManualMessage(error.message)
  });

  const cards = useMemo(() => {
    const stats = statsQuery.data;
    return [
      {
        title: "Total Applications",
        value: stats?.totalCount ?? 0,
        note: "See every job link tracked so far.",
        to: "/applications"
      },
      {
        title: "Last 7 Days",
        value: stats?.recentCount ?? 0,
        note: "Open only the most recent uploads.",
        to: "/applications?scope=recent"
      },
      {
        title: "Today",
        value: stats?.todayCount ?? 0,
        note: "Focus on links added today.",
        to: `/applications?scope=today&date=${formatDateKey(new Date())}`
      },
      {
        title: "Recruiter Emails",
        value: "Open",
        note: "Manage recruiter contacts on a dedicated page.",
        to: "/recruiters"
      },
      {
        title: "Duplicate Review",
        value: "Open",
        note: "See skipped duplicate links in a separate list.",
        to: "/duplicates"
      }
    ];
  }, [statsQuery.data]);

  const issueGroups = useMemo(() => {
    if (!jobUploadResult) {
      return [];
    }
    return [
      {
        key: "duplicates",
        title: "Duplicate Links",
        tone: "amber" as const,
        items: jobUploadResult.duplicates.map((duplicate) => `${duplicate.jobUrl} (uploaded ${formatDateTime(duplicate.originalUploadedAt)})`)
      },
      {
        key: "invalid",
        title: "Invalid Lines",
        tone: "rose" as const,
        items: jobUploadResult.invalidLines.map((line) => `${line.line} - ${line.reason}`)
      }
    ].filter((group) => group.items.length > 0);
  }, [jobUploadResult]);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => navigate(card.to)}
            className="rounded-[1.6rem] border border-[#d5d9d9] bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5 text-left shadow-panel transition hover:-translate-y-0.5 hover:border-[#f3a847] hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600">{card.title}</p>
                <p className="mt-3 text-4xl font-semibold text-[#0f1111]">{card.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.note}</p>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 text-[#ff9900]" />
            </div>
          </button>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel
          title="Upload Job Links"
          description="Submit a text file when you are ready. Duplicate and invalid rows stay visible so you can review and dismiss them."
          icon={<UploadCloud className="h-5 w-5" />}
        >
          <div className="rounded-[1.4rem] border border-dashed border-[#d5d9d9] bg-[linear-gradient(180deg,#f9fbfc,#f2f6f8)] p-5">
            <input
              key={selectedUploadFile?.name ?? "empty-upload"}
              aria-label="Upload job links file"
              type="file"
              accept=".txt"
              onChange={(event) => setSelectedUploadFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={!selectedUploadFile || uploadJobsMutation.isPending}
                onClick={() => selectedUploadFile && uploadJobsMutation.mutate(selectedUploadFile)}
                className="rounded-2xl border border-[#007185] bg-[linear-gradient(180deg,#1196a8,#007185)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
              >
                {uploadJobsMutation.isPending ? "Submitting..." : "Submit File"}
              </button>
              {selectedUploadFile ? <p className="text-sm text-slate-500">{selectedUploadFile.name}</p> : null}
            </div>
          </div>

          {uploadJobsMutation.isError ? <InlineError message={(uploadJobsMutation.error as Error).message} /> : null}

          {issueGroups.length ? (
            <div className="space-y-4">
              {issueGroups.map((group) => (
                <IssuePanel
                  key={group.key}
                  title={group.title}
                  items={group.items}
                  tone={group.tone}
                  onClose={() => {
                    if (!jobUploadResult) return;
                    setJobUploadResult({
                      ...jobUploadResult,
                      duplicates: group.key === "duplicates" ? [] : jobUploadResult.duplicates,
                      invalidLines: group.key === "invalid" ? [] : jobUploadResult.invalidLines
                    });
                  }}
                />
              ))}
            </div>
          ) : jobUploadResult ? (
            <div className="rounded-[1.5rem] border border-emerald-200 bg-[linear-gradient(180deg,#f0fdf4,#e7f8ee)] p-4 text-sm text-emerald-700">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Upload completed
              </div>
              <p className="mt-2">{jobUploadResult.inserted.length} new links were added successfully.</p>
            </div>
          ) : null}
        </Panel>

        <Panel
          title="Quick Add"
          description="Drop in a manual link, then jump straight into the applications, duplicates, or recruiters pages for the full view."
          icon={<Plus className="h-5 w-5" />}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!manualUrl.trim()) return;
              createJobMutation.mutate();
            }}
            className="space-y-4"
          >
            <label className="text-sm font-medium text-slate-600">
              Job URL
              <input
                type="url"
                placeholder="https://company.com/jobs/role"
                value={manualUrl}
                onChange={(event) => setManualUrl(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-[#d5d9d9] bg-[linear-gradient(180deg,#ffffff,#fbfdff)] px-4 py-3"
              />
            </label>
            <button
              type="submit"
              className="rounded-2xl border border-[#007185] bg-[linear-gradient(180deg,#1196a8,#007185)] px-4 py-3 text-sm font-semibold text-white"
            >
              Save Manual Link
            </button>
          </form>
          {manualMessage ? <p className="text-sm text-slate-600">{manualMessage}</p> : null}

          <div className="grid gap-3 pt-4 md:grid-cols-3">
            <button
              type="button"
              onClick={() => navigate("/applications")}
              className="rounded-[1.4rem] border border-[#d5d9d9] bg-[linear-gradient(180deg,#f8fafb,#f2f6f8)] px-4 py-4 text-left transition hover:border-[#f3a847]"
            >
              <p className="font-semibold text-slate-900">Open Applications</p>
              <p className="mt-1 text-sm text-slate-500">Review links, filters, and status updates.</p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/duplicates")}
              className="rounded-[1.4rem] border border-[#d5d9d9] bg-[linear-gradient(180deg,#f8fafb,#f2f6f8)] px-4 py-4 text-left transition hover:border-[#f3a847]"
            >
              <div className="flex items-center gap-2">
                <CopyX className="h-4 w-4 text-[#ff9900]" />
                <p className="font-semibold text-slate-900">Open Duplicates</p>
              </div>
              <p className="mt-1 text-sm text-slate-500">Review skipped links and original upload dates.</p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/recruiters")}
              className="rounded-[1.4rem] border border-[#d5d9d9] bg-[linear-gradient(180deg,#f8fafb,#f2f6f8)] px-4 py-4 text-left transition hover:border-[#f3a847]"
            >
              <p className="font-semibold text-slate-900">Open Recruiters</p>
              <p className="mt-1 text-sm text-slate-500">View recruiter cards and manage contact details.</p>
            </button>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function IssuePanel({
  title,
  items,
  tone,
  onClose
}: {
  title: string;
  items: string[];
  tone: "amber" | "rose";
  onClose: () => void;
}) {
  const toneClasses =
    tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div className={`rounded-[1.5rem] border p-4 ${toneClasses}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-semibold">
          <FileWarning className="h-4 w-4" />
          {title}
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-1 transition hover:bg-white/70">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item} className="break-all">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
