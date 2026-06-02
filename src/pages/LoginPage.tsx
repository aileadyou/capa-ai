import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { usePersonaStore } from "@/store/usePersonaStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { PersonaID } from "@/types";

// ── Persona role descriptions (shorter, friendlier) ───────────────────────────

const PERSONA_CONTEXT: Record<PersonaID, { color: string; context: string }> = {
  initiator: {
    color: "var(--accent)",
    context: "Submits findings, fills D1–D3",
  },
  qa_deviation: {
    color: "var(--success)",
    context: "Manages CAPAs end-to-end",
  },
  head_of_dept: {
    color: "var(--warning)",
    context: "Reviews actions, approves D7",
  },
  head_of_qa: {
    color: "var(--danger)",
    context: "Final sign-off, audit readiness",
  },
  sme: {
    color: "var(--fg-3)",
    context: "Technical SME review & input",
  },
};

// ── Login page ────────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate();
  const personas = usePersonaStore((state) => state.personas);
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hoveredId, setHoveredId] = useState<PersonaID | null>(null);

  function handlePersonaLogin(personaId: PersonaID) {
    login(personaId);
    navigate("/", { replace: true });
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Demo: just log in as qa_deviation by default from form submit
    handlePersonaLogin("qa_deviation");
  }

  const inputStyle = (focused?: boolean): React.CSSProperties => ({
    width: "100%",
    background: "var(--bg-3)",
    border: `1px solid ${focused ? "var(--accent)" : "var(--line-2)"}`,
    boxShadow: focused ? "0 0 0 3px var(--accent-soft)" : "none",
    borderRadius: "var(--r-sm)",
    padding: "10px 12px 10px 38px",
    fontSize: "14px",
    color: "var(--fg-1)",
    fontFamily: "var(--font-sans)",
    outline: "none",
    height: "42px",
    boxSizing: "border-box",
    transition: "border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        {/* ── Brand ──────────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "var(--r-md)",
              background: "var(--grad-brand)",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "var(--on-accent)",
                fontFamily: "var(--font-mono)",
              }}
            >
              N
            </span>
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--fg-1)",
              margin: "0 0 6px",
              fontFamily: "var(--font-sans)",
              letterSpacing: "-0.02em",
            }}
          >
            Sign in to Nova
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--fg-4)",
              margin: 0,
              fontFamily: "var(--font-sans)",
            }}
          >
            AI-powered CAPA quality management
          </p>
        </div>

        {/* ── Login card ─────────────────────────────────────────────────── */}
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--shadow-lg)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Email + password form */}
          <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--fg-3)",
                  marginBottom: "6px",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={15}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--fg-4)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@bifarma.co.id"
                  style={inputStyle()}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--line-2)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--fg-3)",
                  marginBottom: "6px",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={15}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--fg-4)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password…"
                  style={inputStyle()}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--line-2)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: "var(--grad-brand)",
                color: "var(--on-accent)",
                border: "none",
                borderRadius: "var(--r-sm)",
                padding: "11px 20px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.01em",
                marginTop: "2px",
              }}
            >
              Sign in
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "var(--line-2)" }} />
            <span
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                letterSpacing: "0.18em",
                color: "var(--fg-4)",
                whiteSpace: "nowrap",
              }}
            >
              Or sign in as demo persona
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--line-2)" }} />
          </div>

          {/* Persona cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {personas.map((persona) => {
              const meta = PERSONA_CONTEXT[persona.id];
              const isHovered = hoveredId === persona.id;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => handlePersonaLogin(persona.id)}
                  onMouseEnter={() => setHoveredId(persona.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: isHovered ? "var(--bg-3)" : "var(--bg-4)",
                    border: isHovered
                      ? `1px solid ${meta.color}`
                      : "1px solid var(--line-2)",
                    borderRadius: "var(--r-md)",
                    padding: "10px 14px",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)",
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--r-full)",
                      background: isHovered ? meta.color : "var(--bg-2)",
                      border: isHovered ? "none" : "1px solid var(--line-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: isHovered ? "var(--on-accent)" : "var(--fg-3)",
                      flexShrink: 0,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.02em",
                      transition: "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)",
                    }}
                  >
                    {persona.avatarInitials}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--fg-1)",
                        margin: "0 0 2px",
                        fontFamily: "var(--font-sans)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {persona.displayName}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "var(--fg-3)",
                        margin: 0,
                        fontFamily: "var(--font-sans)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {persona.role}
                    </p>
                  </div>

                  {/* Context chip */}
                  <span
                    style={{
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      color: isHovered ? meta.color : "var(--fg-4)",
                      background: isHovered ? "transparent" : "transparent",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      display: "none",
                    }}
                  >
                    {meta.context}
                  </span>

                  {/* Arrow */}
                  <ArrowRight
                    size={14}
                    style={{
                      flexShrink: 0,
                      color: isHovered ? meta.color : "var(--fg-4)",
                      transition: "color var(--dur-fast) var(--ease-out)",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Footer note ────────────────────────────────────────────────── */}
        <p
          style={{
            fontSize: "11px",
            color: "var(--fg-4)",
            textAlign: "center",
            margin: 0,
            fontFamily: "var(--font-sans)",
            lineHeight: "1.5",
          }}
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
