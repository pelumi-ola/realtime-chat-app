import { Loader2, X } from "lucide-react";
import { displayName } from "../lib/helpers.js";

export function Spinner({ full }) {
  return (
    <div className={`grid place-items-center ${full ? "h-dvh" : "py-10"}`}>
      <Loader2 className="animate-spin text-lagoon" size={26} />
    </div>
  );
}

const tints = ["#0e7c86", "#7a4fd0", "#c4572d", "#2d6cc4", "#8a6d12", "#b0396b"];

export function Avatar({ user, size = 36, online }) {
  const name = displayName(user);
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const tint = tints[(name.charCodeAt(0) || 0) % tints.length];
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span
          className="grid h-full w-full place-items-center rounded-full font-semibold text-white"
          style={{ background: tint, fontSize: size * 0.38 }}
        >
          {initials}
        </span>
      )}
      {online !== undefined && (
        <span
          title={online ? "Online" : "Offline"}
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${online ? "bg-emerald-500" : "bg-slate-300"}`}
        />
      )}
    </span>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-label={title}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-500 hover:bg-chalk">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-mist bg-white px-3 py-2.5 text-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
      />
    </label>
  );
}

export function Button({ loading, children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-lagoon text-white hover:bg-lagoon-dark",
    ghost: "bg-chalk text-ink hover:bg-mist",
    danger: "bg-coral text-white hover:opacity-90",
  };
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${styles[variant]} ${className}`}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export const ErrorText = ({ children }) =>
  children ? <p role="alert" className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">{children}</p> : null;
