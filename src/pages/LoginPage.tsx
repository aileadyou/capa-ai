import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { usePersonaStore } from "@/store/usePersonaStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { PersonaID } from "@/types";
import { cn } from "@/lib/utils";

// ── Persona role descriptions (shorter, friendlier) ───────────────────────────

const PERSONA_CONTEXT: Record<PersonaID, { border: string; avatar: string; text: string; context: string }> = {
  initiator: {
    border: "hover:border-primary",
    avatar: "group-hover:bg-primary",
    text: "group-hover:text-primary",
    context: "Submits findings, fills D1–D3",
  },
  qa_deviation: {
    border: "hover:border-success",
    avatar: "group-hover:bg-success",
    text: "group-hover:text-success",
    context: "Manages CAPAs end-to-end",
  },
  head_of_dept: {
    border: "hover:border-warning",
    avatar: "group-hover:bg-warning",
    text: "group-hover:text-warning",
    context: "Reviews actions, approves D7",
  },
  head_of_qa: {
    border: "hover:border-destructive",
    avatar: "group-hover:bg-destructive",
    text: "group-hover:text-destructive",
    context: "Final sign-off, audit readiness",
  },
  sme: {
    border: "hover:border-foreground-tertiary",
    avatar: "group-hover:bg-foreground-tertiary",
    text: "group-hover:text-foreground-tertiary",
    context: "Technical SME review & input",
  },
};

const inputClassName =
  "h-[42px] w-full box-border rounded-[var(--r-sm)] border border-[var(--line-2)] bg-elevated py-2.5 pl-[38px] pr-3 font-sans text-base text-foreground outline-none transition-[border-color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] placeholder:text-foreground-faint focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]";

// ── Login page ────────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate();
  const personas = usePersonaStore((state) => state.personas);
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handlePersonaLogin(personaId: PersonaID) {
    login(personaId);
    navigate("/", { replace: true });
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Demo: just log in as qa_deviation by default from form submit
    handlePersonaLogin("qa_deviation");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-4 py-6">
      <div className="flex w-full max-w-[480px] flex-col gap-7">
        {/* ── Brand ──────────────────────────────────────────────────────── */}
        <div className="text-center">
          <div
            className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[var(--r-md)] bg-[image:var(--grad-brand)]"
          >
            <span
              className="font-sans text-2xl font-extrabold text-primary-foreground"
            >
              N
            </span>
          </div>
          <h1
            className="mb-1.5 mt-0 font-sans text-[22px] font-bold tracking-[-0.02em] text-foreground"
          >
            Sign in to Nova
          </h1>
          <p
            className="m-0 font-sans text-sm text-foreground-faint"
          >
            AI-powered CAPA quality management
          </p>
        </div>

        {/* ── Login card ─────────────────────────────────────────────────── */}
        <div
          className="flex flex-col gap-5 rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-6 shadow-lg"
        >
          {/* Email + password form */}
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-3.5">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block font-sans text-xs font-semibold text-foreground-tertiary"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-faint"
                />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@bifarma.co.id"
                  className={inputClassName}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block font-sans text-xs font-semibold text-foreground-tertiary"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-faint"
                />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password…"
                  className={inputClassName}
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-0.5 flex cursor-pointer items-center justify-center gap-1.5 rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-5 py-[11px] font-sans text-base font-semibold tracking-[0.01em] text-primary-foreground hover:brightness-110 active:scale-[0.99]"
            >
              Sign in
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Divider */}
          <div
            className="flex items-center gap-3"
          >
            <div className="h-px flex-1 bg-[var(--line-2)]" />
            <span
              className="whitespace-nowrap font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary"
            >
              Or sign in as demo persona
            </span>
            <div className="h-px flex-1 bg-[var(--line-2)]" />
          </div>

          {/* Persona cards */}
          <div className="flex flex-col gap-2">
            {personas.map((persona) => {
              const meta = PERSONA_CONTEXT[persona.id];
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => handlePersonaLogin(persona.id)}
                  className={cn(
                    "group flex w-full cursor-pointer items-center gap-3 rounded-[var(--r-md)] border border-[var(--line-2)] bg-field px-3.5 py-2.5 text-left transition-[background,border-color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-elevated",
                    meta.border,
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-full)] border border-[var(--line-2)] bg-card font-sans text-xs font-bold tracking-[0.02em] text-foreground-tertiary transition-[background,color,border-color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] group-hover:border-transparent group-hover:text-primary-foreground",
                      meta.avatar,
                    )}
                  >
                    {persona.avatarInitials}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="mb-0.5 mt-0 truncate font-sans text-sm font-semibold text-foreground"
                    >
                      {persona.displayName}
                    </p>
                    <p
                      className="m-0 truncate font-sans text-[11px] text-foreground-tertiary"
                    >
                      {persona.role}
                    </p>
                  </div>

                  {/* Context chip */}
                  <span
                    className={cn(
                      "hidden shrink-0 whitespace-nowrap bg-transparent font-sans text-[10px] font-semibold tracking-[0.1em] text-primary",
                      meta.text,
                    )}
                  >
                    {meta.context}
                  </span>

                  {/* Arrow */}
                  <ArrowRight
                    size={14}
                    className={cn(
                      "shrink-0 text-foreground-faint transition-[color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
                      meta.text,
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Footer note ────────────────────────────────────────────────── */}
        <p
          className="m-0 text-center font-sans text-[11px] leading-normal text-foreground-faint"
        >
          This is a demo environment. All data is simulated.
          <br />
          Persona selection bypasses authentication for demo purposes.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
