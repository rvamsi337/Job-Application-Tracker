import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createRecruiter, getRecruiters, updateRecruiter } from "../lib/api";
import { FieldLabel, InlineError, Panel } from "./job-ui";

export function RecruiterFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const editingId = id ? Number(id) : null;
  const isEditing = editingId !== null && !Number.isNaN(editingId);

  const recruitersQuery = useQuery({
    queryKey: ["recruiters", "editor"],
    queryFn: () => getRecruiters(),
    enabled: isEditing
  });

  const existingRecruiter = useMemo(
    () => recruitersQuery.data?.find((contact) => contact.id === editingId) ?? null,
    [editingId, recruitersQuery.data]
  );

  const [companyName, setCompanyName] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  useEffect(() => {
    if (!existingRecruiter) {
      return;
    }
    setCompanyName(existingRecruiter.companyName);
    setRecruiterName(existingRecruiter.recruiterName ?? "");
    setRecruiterEmail(existingRecruiter.recruiterEmail);
    setMobileNumber(existingRecruiter.mobileNumber ?? "");
  }, [existingRecruiter]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        companyName,
        recruiterName: recruiterName || undefined,
        recruiterEmail,
        mobileNumber: mobileNumber || undefined
      };

      if (isEditing && editingId !== null) {
        return updateRecruiter(editingId, payload);
      }
      return createRecruiter(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recruiters"] });
      navigate("/recruiters");
    }
  });

  return (
    <div className="space-y-6">
      <Link to="/recruiters" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand">
        <ArrowLeft className="h-4 w-4" />
        Back to recruiters
      </Link>

      <Panel
        title={isEditing ? "Edit Recruiter" : "Add Recruiter"}
        description="Use this dedicated page to manage one recruiter record at a time, keeping the list page clean and easy to browse."
        icon={<UserRound className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FieldLabel label="Company Name">
            <input
              type="text"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
            />
          </FieldLabel>

          <FieldLabel label="Recruiter Name">
            <input
              type="text"
              value={recruiterName}
              onChange={(event) => setRecruiterName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
            />
          </FieldLabel>

          <FieldLabel label="Recruiter Email">
            <input
              type="email"
              value={recruiterEmail}
              onChange={(event) => setRecruiterEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
            />
          </FieldLabel>

          <FieldLabel label="Mobile Number">
            <input
              type="text"
              value={mobileNumber}
              onChange={(event) => setMobileNumber(event.target.value)}
              placeholder="Optional"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
            />
          </FieldLabel>
        </div>

        {recruitersQuery.isError ? <InlineError message={(recruitersQuery.error as Error).message} /> : null}
        {mutation.isError ? <InlineError message={(mutation.error as Error).message} /> : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => mutation.mutate()}
            className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white"
          >
            {mutation.isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Recruiter"}
          </button>
          <Link
            to="/recruiters"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Cancel
          </Link>
        </div>
      </Panel>
    </div>
  );
}
