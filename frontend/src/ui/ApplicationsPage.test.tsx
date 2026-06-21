import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ApplicationsPage } from "./ApplicationsPage";

function renderPage(initialPath = "/applications") {
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
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/applications" element={<ApplicationsPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("ApplicationsPage", () => {
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn(() => "blob:applications-export");
    window.URL.revokeObjectURL = vi.fn();

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url.includes("/api/jobs/") && init?.method === "PATCH") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 2,
              serialNo: 2,
              jobUrl: "https://example.com/jobs/2",
              companyName: "Second",
              sourceType: "FILE_UPLOAD",
              status: "APPLIED",
              uploadedAt: "2026-06-20T10:00:00Z",
              appliedAt: "2026-06-20T10:30:00Z",
              statusUpdatedAt: "2026-06-20T10:30:00Z"
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
                id: 2,
                serialNo: 2,
                jobUrl: "https://example.com/jobs/2",
                companyName: "Second",
                sourceType: "FILE_UPLOAD",
                status: "PENDING",
                uploadedAt: "2026-06-20T10:00:00Z",
                appliedAt: null,
                statusUpdatedAt: "2026-06-20T10:00:00Z"
              },
              {
                id: 1,
                serialNo: 1,
                jobUrl: "https://example.com/jobs/1",
                companyName: "First",
                sourceType: "MANUAL_ENTRY",
                status: "SAVED",
                uploadedAt: "2026-06-19T10:00:00Z",
                appliedAt: null,
                statusUpdatedAt: "2026-06-19T10:00:00Z"
              }
            ]),
            { status: 200 }
          )
        );
      }
      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders applications sorted by serial number and opens links in new tab", async () => {
    renderPage();

    expect(await screen.findByText("Applications")).toBeInTheDocument();
    const links = await screen.findAllByRole("link");
    const jobLink = links.find((link) => link.getAttribute("href") === "https://example.com/jobs/1");
    expect(jobLink).toHaveAttribute("target", "_blank");

    const companyCells = await screen.findAllByText(/First|Second/);
    expect(companyCells[0]).toHaveTextContent("First");
    expect(companyCells[1]).toHaveTextContent("Second");
  });

  it("sorts applications by column heading in ascending and descending order", async () => {
    renderPage();
    const user = userEvent.setup();

    expect(await screen.findByText("Applications")).toBeInTheDocument();

    const companyHeader = screen.getByRole("button", { name: /sort by company ascending/i });
    await user.click(companyHeader);

    let companyCells = await screen.findAllByText(/First|Second/);
    expect(companyCells[0]).toHaveTextContent("First");
    expect(companyCells[1]).toHaveTextContent("Second");

    const companyDescHeader = screen.getByRole("button", { name: /sort by company descending/i });
    await user.click(companyDescHeader);

    companyCells = await screen.findAllByText(/First|Second/);
    expect(companyCells[0]).toHaveTextContent("Second");
    expect(companyCells[1]).toHaveTextContent("First");
  });

  it("updates a status from the dedicated applications page", async () => {
    renderPage();
    const user = userEvent.setup();

    const select = await screen.findByLabelText("Status for application 1");
    await user.selectOptions(select, "APPLIED");
    const saveButtons = screen.getAllByRole("button", { name: "Save" });
    await user.click(saveButtons[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/jobs/1/status"),
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });

  it("updates multiple selected applications at once", async () => {
    renderPage();
    const user = userEvent.setup();

    expect(await screen.findByText("Applications")).toBeInTheDocument();
    expect(await screen.findByText("First")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Select application 1"));
    await user.click(screen.getByLabelText("Select application 2"));
    await user.selectOptions(screen.getByLabelText("New Status"), "APPLIED");
    await user.click(screen.getByRole("button", { name: "Update Selected" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/jobs/1/status"),
        expect.objectContaining({ method: "PATCH" })
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/jobs/2/status"),
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });

  it("exports filtered applications in serial number order", async () => {
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild");
    const createdLink = document.createElement("a");
    const clickSpy = vi.spyOn(createdLink, "click").mockImplementation(() => {});
    const OriginalBlob = Blob;
    let capturedCsv = "";

    vi.stubGlobal(
      "Blob",
      class extends OriginalBlob {
        constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
          super(parts ?? [], options);
          capturedCsv = (parts ?? []).map((part) => (typeof part === "string" ? part : String(part))).join("");
        }
      }
    );

    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === "a") {
        return createdLink;
      }
      return document.createElementNS("http://www.w3.org/1999/xhtml", tagName);
    });

    renderPage();
    const user = userEvent.setup();

    expect(await screen.findByText("Applications")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Export Filtered Applications" }));

    const appendedLink = appendSpy.mock.calls.at(-1)?.[0] as HTMLAnchorElement;
    expect(appendedLink).toBe(createdLink);
    expect(createdLink.download).toBe("applications-list-2026-06-21.csv");
    expect(clickSpy).toHaveBeenCalled();
    expect(capturedCsv).toContain('"1","2026-06-19T10:00:00Z","First","SAVED","MANUAL_ENTRY","https://example.com/jobs/1",""');
    expect(capturedCsv).toContain('"2","2026-06-20T10:00:00Z","Second","PENDING","FILE_UPLOAD","https://example.com/jobs/2",""');
    expect(capturedCsv.indexOf('"1","2026-06-19T10:00:00Z"')).toBeLessThan(
      capturedCsv.indexOf('"2","2026-06-20T10:00:00Z"')
    );

    appendSpy.mockRestore();
    removeSpy.mockRestore();
    createElementSpy.mockRestore();
    clickSpy.mockRestore();
  });
});
