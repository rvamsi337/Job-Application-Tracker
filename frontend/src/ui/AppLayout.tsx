import { NavLink, Outlet } from "react-router-dom";

export function AppLayout() {
  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    [
      "rounded-full px-4 py-2 text-sm font-semibold transition",
      isActive
        ? "bg-[linear-gradient(180deg,#1f2f43,#131921)] text-white shadow-sm"
        : "text-slate-600 hover:bg-[#febd69]/20 hover:text-slate-900"
    ].join(" ");

  return (
    <div className="min-h-screen bg-transparent text-ink">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] border border-[#d5d9d9] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,246,248,0.96))] shadow-panel backdrop-blur">
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(135deg,rgba(19,25,33,0.98),rgba(35,47,62,0.96),rgba(55,71,92,0.92),rgba(255,153,0,0.22))]" />
            <div className="absolute -right-10 top-8 h-44 w-44 rounded-full bg-[#ff9900]/20 blur-3xl" />
            <div className="absolute left-20 top-6 h-32 w-32 rounded-full bg-white/6 blur-3xl" />
            <div className="relative flex flex-col gap-6 p-6 md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#ffb84d]">Raghuvamsi Mallampalli's</p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                    Job Tracker Pro
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                    A focused workspace for uploaded job links, daily application tracking, duplicate review, and recruiter outreach.
                  </p>
                </div>
                <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] px-5 py-4 text-sm text-slate-700 shadow-sm">
                  Track, review, and act on every application from one clean workspace.
                </div>
              </div>

              <nav className="flex flex-wrap gap-2 rounded-[1.6rem] border border-[#d5d9d9] bg-[linear-gradient(180deg,#ffffff,#f7f8fa)] p-2 shadow-sm">
                <NavLink to="/" end className={linkClassName}>
                  Dashboard
                </NavLink>
                <NavLink to="/applications" className={linkClassName}>
                  Applications
                </NavLink>
                <NavLink to="/duplicates" className={linkClassName}>
                  Duplicates
                </NavLink>
                <NavLink to="/recruiters" className={linkClassName}>
                  Recruiters
                </NavLink>
              </nav>
            </div>
          </div>
        </header>
        <main className="py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
