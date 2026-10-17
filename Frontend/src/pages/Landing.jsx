import { Link, useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-screen flex-col overflow-hidden bg-cover bg-center bg-fixed text-slate-300"
      style={{
        backgroundImage: "url('/background.png')",
      }}
    >
      {/* Navbar */}
      <nav className="relative z-20 border-b border-violet-300/20 bg-[#171522]/80 shadow-md backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="text-xl font-bold tracking-tight sm:text-2xl">
            <span className="text-blue-500">Meet</span>ora
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => navigate("/fwif23")}
              className="text-sm font-medium text-slate-300 transition hover:text-blue-500 sm:text-base"
            >
              Join as Guest
            </button>

            <button
              onClick={() => navigate("/auth")}
              className="hidden text-sm font-medium text-slate-300 transition hover:text-blue-500 sm:block sm:text-base"
            >
              Register
            </button>

            <button
              onClick={() => navigate("/auth")}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 sm:px-5 sm:py-2.5 sm:text-base"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-8 px-5 py-10 sm:px-8 sm:py-14 md:grid-cols-2 md:gap-12 lg:py-16">
        {/* Left Content */}
        <section className="relative z-10 text-center md:text-left">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Bringing people closer
          </p>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-300 sm:text-5xl lg:text-6xl">
            Connect with your <span className="text-blue-500">loved ones</span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-400 sm:text-lg md:mx-0">
            Cover a distance by Apna Video Call. Stay close to the people who
            matter, wherever life takes you.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
            <Link
              to="#"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 font-semibold text-white shadow-md transition hover:bg-blue-700"
            >
              Get Started <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        {/* Video Illustration */}
        <section className="relative flex min-h-70 items-center justify-center sm:min-h-90 md:min-h-110">
          <div className="absolute h-64 w-64 rounded-full bg-blue-100/70 blur-3xl sm:h-80 sm:w-80 md:h-96 md:w-96" />

          <img
            src="/video.png"
            alt="Video conferencing illustration"
            className="relative z-10 h-auto max-h-110 w-full max-w-130 object-contain sm:max-h-120"
          />
        </section>
      </main>

      {/* Compact Footer */}
      <footer className="border-t border-violet-300/20 bg-[#171522]/80 shadow-[0_-3px_12px_rgba(0,0,0,0.15)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 px-5 py-3 text-center text-xs text-slate-300 sm:flex-row sm:px-8 sm:text-sm">
          <p>© {new Date().getFullYear()} Meetora</p>
          <p>Bringing people closer, one call at a time.</p>
        </div>
      </footer>
    </div>
  );
}
