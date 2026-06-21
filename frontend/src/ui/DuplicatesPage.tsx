import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CopyX, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getDuplicateJobs } from "../lib/api";
import { DuplicateJobsTable, FieldLabel, InlineError, Panel, sanitizeDateParam } from "./job-ui";

export function DuplicatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(searchParams.get("search") ?? "");
  const date = sanitizeDateParam(searchParams.get("date"));

  const duplicatesQuery = useQuery({
    queryKey: ["duplicates", date, searchDraft],
    refetchOnMount: "always",
    queryFn: () =>
      getDuplicateJobs({
        date: date || undefined,
        search: searchDraft || undefined
      })
  });

  function updateParams(next: { date?: string; search?: string }) {
    const params = new URLSearchParams(searchParams);
    if (next.date !== undefined) {
      next.date ? params.set("date", next.date) : params.delete("date");
    }
    if (next.search !== undefined) {
      next.search ? params.set("search", next.search) : params.delete("search");
    }
    setSearchParams(params);
  }

  return (
    <div className="space-y-6">
      <Panel
        title="Duplicate Links"
        description="Every duplicate upload or manual duplicate entry is stored separately here, so the main applications list stays clean."
        icon={<CopyX className="h-5 w-5" />}
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.8fr_auto]">
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
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3"
              />
            </div>
          </FieldLabel>
          <FieldLabel label="Duplicate Date">
            <input
              type="date"
              value={date}
              onChange={(event) => updateParams({ date: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
            />
          </FieldLabel>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearchDraft("");
                setSearchParams(new URLSearchParams());
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand/40 hover:bg-white"
            >
              Reset
            </button>
          </div>
        </div>

        {duplicatesQuery.isError ? <InlineError message={(duplicatesQuery.error as Error).message} /> : null}
        <DuplicateJobsTable duplicates={duplicatesQuery.data ?? []} />
      </Panel>
    </div>
  );
}
