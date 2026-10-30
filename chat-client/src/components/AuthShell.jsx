import { MessageCircle } from "lucide-react";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <div className="flex items-center gap-2 font-display text-xl font-bold">
          <MessageCircle className="text-lagoon" /> Chatterbox
        </div>
        <div>
          <p className="font-display text-4xl font-bold leading-tight">
            Rooms for every conversation. Messages land the second they're sent.
          </p>
          <p className="mt-4 max-w-sm text-slate-300">
            Create a room, invite people in, and your history is waiting when
            you come back.
          </p>
        </div>
        <p className="text-sm text-slate-400">
          Secure sign-in with JWT. Your messages are saved.
        </p>
      </aside>
      <main className="grid place-items-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="mb-6 mt-1 text-slate-600">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>
        </div>
      </main>
    </div>
  );
}
