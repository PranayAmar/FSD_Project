import { toast } from "sonner";
import {
  LogIn,
  UserPlus,
  LogOut,
  CircleCheck,
  CircleX,
  AlertTriangle,
} from "lucide-react";

const toastStyles = {
  login: {
    icon: LogIn,
    color: "#60a5fa",
    title: "Welcome back!",
    description: "Start your conversations.",
  },
  signup: {
    icon: UserPlus,
    color: "#a78bfa",
    title: "Account created!",
    description: "Welcome to Meetora.Start commuting.",
  },
  logout: {
    icon: LogOut,
    color: "#fbbf24",
    title: "Logged out",
    description: "Logged out successfully.",
  },
  error: {
    icon: CircleX,
    color: "#f87171",
    title: "Something went wrong",
    description: "Please try again.",
  },
};

export function showAppToast(type, message) {
  const config = toastStyles[type] || toastStyles.error;
  const Icon = config.icon;

  toast.custom(
    (id) => (
      <div
        role="status"
        className="flex w-85 max-w-[calc(100vw-32px)] items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl"
        style={{
          background: "rgba(23, 21, 34, 0.97)",
          borderColor: `${config.color}55`,
          color: "#f8fafc",
          boxShadow: `0 10px 35px ${config.color}15`,
        }}
      >
        <div
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: `${config.color}20`,
            color: config.color,
          }}
        >
          <Icon size={22} strokeWidth={2.2} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-wide">{config.title}</p>
          <p className="mt-1 wrap-break-word text-sm leading-5 text-slate-300">
            {message || config.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.dismiss(id)}
          aria-label="Close notification"
          className="ml-1 text-lg leading-none text-slate-400 transition hover:text-white"
        >
          ×
        </button>
      </div>
    ),
    { duration: 3500 },
  );
}
