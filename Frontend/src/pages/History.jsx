import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(Array.isArray(history) ? history : []);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [getHistoryOfUser]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-[#111019] bg-cover bg-center bg-fixed text-slate-100"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {/* Navbar */}
      <header className="border-b border-white/10 bg-[#171522]/90">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="flex items-center gap-2"
            aria-label="Meetora home"
          >
            <img src="/logo.svg" alt="" className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold tracking-tight sm:text-2xl">
              Meet<span className="text-blue-400">ora</span>
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white sm:text-base"
            >
              Home
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-blue-400/60 hover:text-white sm:px-4 sm:text-base"
            >
              Log out
            </button>
          </div>
        </nav>
      </header>

      {/* Page content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-medium text-blue-400">
              Your activity
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Meeting history
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
              Find the meetings you've joined and revisit a meeting whenever you
              need to.
            </p>
          </div>

          {!loading && meetings.length > 0 && (
            <span className="w-fit rounded-full border border-white/10 bg-[#171522]/80 px-4 py-2 text-sm text-slate-300">
              {meetings.length} {meetings.length === 1 ? "meeting" : "meetings"}
            </span>
          )}
        </div>

        {/* Meeting list */}
        <section className="rounded-2xl border border-white/10 bg-[#171522]/85 p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Recent meetings
            </h2>
          </div>

          {loading ? (
            <div className="py-14 text-center">
              <p className="text-slate-300">Loading your meeting history...</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 px-5 py-14 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-400/10 text-blue-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="m10 9 5 3-5 3z" />
                </svg>
              </div>

              <h3 className="text-base font-semibold text-white">
                No meetings yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                Meetings you join will appear here, so you can find them again
                easily.
              </p>

              <button
                type="button"
                onClick={() => navigate("/home")}
                className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Join a meeting
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting, idx) => (
                <article
                  key={
                    meeting._id ||
                    `${meeting.meeting_code}-${meeting.date || idx}`
                  }
                  className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/10 p-4 transition hover:border-blue-400/30 hover:bg-white/3 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <rect x="3" y="5" width="18" height="14" rx="3" />
                        <path d="m10 9 5 3-5 3z" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Meeting
                      </p>

                      <h3 className="mt-1 break-all text-base font-semibold text-white">
                        {meeting.meeting_code || "Unknown meeting"}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {meeting.date
                          ? new Date(meeting.date).toLocaleString()
                          : "Date unavailable"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!meeting.meeting_code}
                    onClick={() => navigate(`/${meeting.meeting_code}`)}
                    className="shrink-0 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-blue-400/60 hover:bg-blue-400/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Rejoin meeting <span aria-hidden="true">→</span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#171522]/90">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 px-5 py-3 text-center text-xs text-slate-400 sm:flex-row sm:px-8 sm:text-sm">
          <p>© {new Date().getFullYear()} Meetora</p>
          <p>Bringing people closer, one call at a time.</p>
        </div>
      </footer>
    </div>
  );
}
