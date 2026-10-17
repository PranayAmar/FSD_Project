import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import withAuth from "../utils/withAuth.jsx";
import { AuthContext } from "../contexts/AuthContext.jsx";
import { ClipLoader } from "react-spinners";
import { showAppToast } from "../utils/appToast.jsx";

import {
  VideocamRounded,
  LinkRounded,
  ArrowForwardRounded,
  ContentCopyRounded,
} from "@mui/icons-material";

function Home() {
  const navigate = useNavigate();

  const [meetingCode, setMeetingCode] = useState("");
  const [createdMeetingCode, setCreatedMeetingCode] = useState("");
  const [joining, setJoining] = useState(false);

  const { addToUserHistory } = useContext(AuthContext);

  // Create a meeting on the server.
  const handleNewMeeting = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      showAppToast("error", "Please sign in again before creating a meeting.");
      navigate("/auth");
      return;
    }

    const newMeetingCode = crypto.randomUUID();

    const socket = io("http://localhost:5000", {
      autoConnect: false,
      auth: { token },
    });

    socket.once("connect_error", (error) => {
      console.error("Unable to create meeting:", error.message);
      showAppToast("error", "Could not create the meeting. Please try again.");
      socket.disconnect();
    });

    socket.once("meeting-error", (payload) => {
      showAppToast(
        "error",
        payload?.message || "Could not create the meeting.",
      );
      socket.disconnect();
    });

    socket.once("meeting-created", (payload = {}) => {
      setCreatedMeetingCode(payload.meetingCode || newMeetingCode);
      socket.disconnect();
    });

    socket.once("connect", () => {
      socket.emit("create-meeting", newMeetingCode);
    });

    socket.connect();
  };

  // Accept a meeting code or a complete meeting link.
  const handleJoinVideoCall = async (e) => {
    e.preventDefault();

    if (joining) return;

    const input = meetingCode.trim();

    if (!input) {
      showAppToast("error", "Please enter a meeting code or link.");
      return;
    }

    let code = "";

    try {
      if (/^https?:\/\//i.test(input)) {
        const meetingUrl = new URL(input);

        if (meetingUrl.origin !== window.location.origin) {
          showAppToast("error", "Please enter a valid Meetora meeting link.");
          return;
        }

        const pathParts = meetingUrl.pathname.split("/").filter(Boolean);

        if (pathParts.length !== 1) {
          showAppToast("error", "Invalid meeting link.");
          return;
        }

        code = decodeURIComponent(pathParts[0]);
      } else {
        code = decodeURIComponent(
          input.split(/[?#]/)[0].replace(/^\/+|\/+$/g, ""),
        );
      }
    } catch {
      showAppToast("error", "Please enter a valid meeting code or link.");
      return;
    }

    if (!code || code.includes("/") || code === "." || code === "..") {
      showAppToast("error", "Please enter a valid meeting code or link.");
      return;
    }

    setJoining(true);

    try {
      try {
        await addToUserHistory(code);
      } catch (historyError) {
        console.error("Failed to save meeting history:", historyError);
      }

      navigate(`/${encodeURIComponent(code)}`);
    } catch (error) {
      console.error("Failed to open meeting:", error);
      showAppToast("error", "Could not open the meeting. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  // Copy the newly created meeting link.
  const handleCopyMeetingLink = async () => {
    const link = `${window.location.origin}/${encodeURIComponent(
      createdMeetingCode,
    )}`;

    try {
      await navigator.clipboard.writeText(link);
      showAppToast("success", "Meeting link copied!");
    } catch (error) {
      console.error("Failed to copy meeting link:", error);
      showAppToast("error", "Unable to copy the meeting link.");
    }
  };

  const handleEnterNewMeeting = async () => {
    const code = createdMeetingCode;

    if (!code) return;

    try {
      await addToUserHistory(code);
    } catch (historyError) {
      console.error("Failed to save meeting history:", historyError);
    }

    navigate(`/${encodeURIComponent(code)}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    showAppToast("logout");
    navigate("/");
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-[#111019] bg-cover bg-center text-slate-100"
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

          <div className="flex items-center gap-2 sm:gap-5">
            <button
              type="button"
              onClick={() => navigate("/his")}
              className="rounded-lg border border-slate-300/20 px-3 py-2 text-sm text-slate-300 transition hover:bg-violet-400/10 hover:text-white sm:text-base"
            >
              History
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-red-400/60 hover:bg-red-500/30 hover:text-white sm:px-4 sm:text-base"
            >
              Log out
            </button>
          </div>
        </nav>
      </header>

      {/* Main section */}
      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-5 py-12 sm:px-8 md:grid-cols-2 md:py-16">
        {/* Welcome text */}
        <section className="mx-auto w-full max-w-xl md:mx-0">
          <p className="mb-4 text-sm font-medium text-blue-400">
            Welcome to Meetora
          </p>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Video calls,
            <span className="block text-blue-400">made simple.</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
            Catch up with friends, connect with your team, and bring everyone
            together with a simple video meeting.
          </p>

          {/* Create and join meeting card */}
          <div className="mt-8 max-w-lg rounded-xl border border-white/10 bg-[#171522]/90 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white">
              Start or join a meeting
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Create a meeting or enter a code to join an existing one.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleNewMeeting}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 sm:flex-1"
              >
                <VideocamRounded />
                New Meeting
              </button>

              <form
                onSubmit={handleJoinVideoCall}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/15 bg-black/20 px-3 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20 disabled:opacity-60"
              >
                <LinkRounded className="shrink-0 text-slate-400" />

                <input
                  type="text"
                  value={meetingCode}
                  onChange={(event) => setMeetingCode(event.target.value)}
                  placeholder="Meeting code or link"
                  autoComplete="off"
                  aria-label="Meeting code or link"
                  disabled={joining}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={joining}
                  aria-label="Join meeting"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {joining ? (
                    <ClipLoader size={17} color="#ffffff" />
                  ) : (
                    <ArrowForwardRounded />
                  )}
                </button>
              </form>
            </div>

            {/* Generated meeting link */}
            {createdMeetingCode && (
              <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-green-400">
                  Meeting created successfully
                </p>

                <p className="mt-2 break-all text-sm text-slate-300">
                  {`${window.location.origin}/${encodeURIComponent(
                    createdMeetingCode,
                  )}`}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCopyMeetingLink}
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    <ContentCopyRounded fontSize="small" />
                    Copy link
                  </button>

                  <button
                    type="button"
                    onClick={handleEnterNewMeeting}
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <VideocamRounded fontSize="small" />
                    Enter meeting
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Illustration */}
        <section className="flex items-center justify-center">
          <img
            src="/logo3.jpg"
            alt="Video conferencing illustration"
            className="h-auto w-full max-w-md rounded-2xl object-contain"
          />
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

export default withAuth(Home);
