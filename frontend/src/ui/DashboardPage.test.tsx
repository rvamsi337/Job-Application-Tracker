import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      },
      mutations: {
        retry: false
      }
    }
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url.includes("/api/dashboard/stats")) {
        return Promise.resolve(
          new Response(JSON.stringify({ totalCount: 5, todayCount: 1, recentCount: 3, statusCounts: {} }), { status: 200 })
        );
      }
      if (url.includes("/api/jobs/upload")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              inserted: [],
              duplicates: [
                {
                  id: 1,
                  jobUrl: "https://example.com/jobs/1",
                  companyName: "Example",
                  sourceType: "FILE_UPLOAD",
                  originalUploadedAt: "2026-06-20T08:00:00Z",
                  duplicateDetectedAt: "2026-06-20T09:00:00Z"
                }
              ],
              invalidLines: []
            }),
            { status: 200 }
          )
        );
      }
      if (url.endsWith("/api/jobs") && init?.method === "POST") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              inserted: [
                {
                  id: 2,
                  serialNo: 2,
                  jobUrl: "https://company.com/jobs/123",
                  companyName: "Company",
                  sourceType: "MANUAL_ENTRY",
                  status: "PENDING",
                  uploadedAt: "2026-06-20T08:00:00Z",
                  appliedAt: null,
                  statusUpdatedAt: "2026-06-20T08:00:00Z"
                }
              ],
              duplicates: [],
              invalidLines: []
            }),
            { status: 200 }
          )
        );
      }
      if (url.includes("/api/jobs/") && init?.method === "PATCH") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 1,
              serialNo: 1,
              jobUrl: "https://example.com/jobs/1",
              companyName: "Example",
              sourceType: "FILE_UPLOAD",
              status: "APPLIED",
              uploadedAt: "2026-06-20T08:00:00Z",
              appliedAt: "2026-06-20T09:00:00Z",
              statusUpdatedAt: "2026-06-20T09:00:00Z"
            }),
            { status: 200 }
          )
        );
      }
      if (url.includes("/api/jobs")) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              {
                id: 1,
                serialNo: 1,
                jobUrl: "https://example.com/jobs/1",
                companyName: "Example",
                sourceType: "FILE_UPLOAD",
                status: "PENDING",
                uploadedAt: "2026-06-20T08:00:00Z",
                appliedAt: null,
                statusUpdatedAt: "2026-06-20T08:00:00Z"
              }
            ]),
            { status: 200 }
          )
        );
      }
      if (url.includes("/api/recruiters")) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }
      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders dashboard counts and quick navigation", async () => {
    renderPage();

    expect(await screen.findByText("Total Applications")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /open recruiters/i })).toBeInTheDocument();
  });

  it("shows duplicate upload results", async () => {
    renderPage();
    const user = userEvent.setup();

    const file = new File(["https://example.com/jobs/1"], "jobs.txt", { type: "text/plain" });
    await user.upload(screen.getByLabelText("Upload job links file"), file);
    await user.click(screen.getByRole("button", { name: "Submit File" }));

    expect(await screen.findByText(/uploaded Jun/i)).toBeInTheDocument();
  });
  it("saves manual links", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Job URL"), "https://company.com/jobs/123");
    await user.click(screen.getByRole("button", { name: "Save Manual Link" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/jobs"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
