import { useEffect, useState, type ComponentType, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  GitBranch,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import leadAiGraphic from "@/assets/lead-ai-graphic.png";
import leadAiLogo from "@/assets/logo-real.png";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
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

type FeatureVisual = "intake" | "nova" | "approval";

type AuthFeature = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  visual: FeatureVisual;
  proofPoints: string[];
};

const AUTH_FEATURES: AuthFeature[] = [
  {
    eyebrow: "Structured intake",
    title: "Capture every finding into a clear CAPA workflow.",
    description:
      "Nova helps teams move from deviation, audit, or complaint findings into guided D1-D7 work with consistent ownership and quality gates.",
    icon: ClipboardCheck,
    visual: "intake",
    proofPoints: ["Finding triage", "Impact classification", "8D readiness"],
  },
  {
    eyebrow: "AI-assisted investigation",
    title: "Draft RCA, containment, and action plans faster.",
    description:
      "Use reviewer-editable Nova suggestions to explore root causes, compare similar cases, and keep the team aligned on what evidence supports each decision.",
    icon: Bot,
    visual: "nova",
    proofPoints: ["5 Whys support", "Similar CAPAs", "Cited reasoning"],
  },
  {
    eyebrow: "Audit-ready closure",
    title: "Track approvals, verification, and sign-off in one place.",
    description:
      "Follow corrective and preventive actions through owners, due dates, verification evidence, and final QA approval without losing the audit trail.",
    icon: ShieldCheck,
    visual: "approval",
    proofPoints: ["Owner actions", "Verification gates", "Approval trail"],
  },
];

function FeatureIllustration({ visual }: { visual: FeatureVisual }) {
  if (visual === "nova") {
    return (
      <div className="relative flex h-full min-h-[260px] overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card/70 p-5 shadow-lg">
        <img
          src={leadAiGraphic}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 opacity-25"
        />
        <div className="relative z-10 flex w-full flex-col justify-between gap-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="m-0 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Nova RCA assistant
              </p>
              <p className="mt-2 font-sans text-xl font-bold text-foreground">
                Root cause draft
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[image:var(--grad-brand)] text-primary-foreground shadow-glow">
              <Bot size={22} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated/80 p-4">
              <div className="mb-3 flex items-center gap-2 text-foreground-secondary">
                <GitBranch size={15} />
                <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em]">
                  5 Whys
                </span>
              </div>
              {["Late containment", "Unclear owner", "Weak evidence"].map((item) => (
                <div key={item} className="mb-2 flex items-center gap-2 last:mb-0">
                  <span className="h-1.5 w-1.5 rounded-[var(--r-full)] bg-primary" />
                  <span className="font-sans text-sm text-foreground-tertiary">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated/80 p-4">
              <div className="mb-3 flex items-center gap-2 text-foreground-secondary">
                <FileSearch size={15} />
                <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em]">
                  Evidence
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-2.5 w-full rounded-[var(--r-full)] bg-field" />
                <div className="h-2.5 w-4/5 rounded-[var(--r-full)] bg-field" />
                <div className="h-2.5 w-3/5 rounded-[var(--r-full)] bg-primary/70" />
              </div>
              <p className="mb-0 mt-4 font-sans text-xs leading-relaxed text-foreground-tertiary">
                Suggestions stay editable and traceable before QA review.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (visual === "approval") {
    return (
      <div className="relative flex h-full min-h-[260px] overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card/70 p-5 shadow-lg">
        <img
          src={leadAiGraphic}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 opacity-20"
        />
        <div className="relative z-10 flex w-full flex-col justify-between gap-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="m-0 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Closure control
              </p>
              <p className="mt-2 font-sans text-xl font-bold text-foreground">
                Action plan status
              </p>
            </div>
            <div className="rounded-[var(--r-full)] border border-[var(--line-2)] bg-elevated px-3 py-1.5 font-sans text-xs font-semibold text-success">
              Ready
            </div>
          </div>

          <div className="grid gap-3">
            {[
              ["Containment", "QA Deviation", "Done"],
              ["Corrective action", "Head of Dept", "Review"],
              ["Verification", "Head of QA", "Next"],
            ].map(([stage, owner, status], index) => (
              <div
                key={stage}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated/80 p-3"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-[var(--r-full)] border",
                    index === 0
                      ? "border-success bg-success/15 text-success"
                      : "border-[var(--line-2)] bg-card text-primary",
                  )}
                >
                  {index === 0 ? <CheckCircle2 size={17} /> : <ShieldCheck size={17} />}
                </div>
                <div className="min-w-0">
                  <p className="m-0 truncate font-sans text-sm font-semibold text-foreground">
                    {stage}
                  </p>
                  <p className="m-0 truncate font-sans text-xs text-foreground-tertiary">
                    {owner}
                  </p>
                </div>
                <span className="rounded-[var(--r-full)] bg-field px-2.5 py-1 font-sans text-[11px] font-semibold text-foreground-secondary">
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[260px] overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card/70 p-5 shadow-lg">
      <img
        src={leadAiGraphic}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -bottom-16 h-60 w-60 opacity-25"
      />
      <div className="relative z-10 flex w-full flex-col justify-between gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="m-0 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Finding to CAPA
            </p>
            <p className="mt-2 font-sans text-xl font-bold text-foreground">
              Intake command view
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[image:var(--grad-brand)] text-primary-foreground shadow-glow">
            <ClipboardCheck size={22} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["DEV", "Deviation", "Major"],
            ["AUD", "Audit", "Open"],
            ["CMP", "Complaint", "Draft"],
          ].map(([code, label, status]) => (
            <div
              key={code}
              className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated/80 p-4"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="font-sans text-xs font-bold tracking-[0.14em] text-primary">
                  {code}
                </span>
                <span className="rounded-[var(--r-full)] bg-field px-2 py-0.5 font-sans text-[10px] font-semibold text-foreground-tertiary">
                  {status}
                </span>
              </div>
              <p className="m-0 font-sans text-sm font-semibold text-foreground">
                {label}
              </p>
              <div className="mt-3 h-1.5 rounded-[var(--r-full)] bg-field">
                <div className="h-full w-2/3 rounded-[var(--r-full)] bg-primary" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated/80 p-4">
          <div className="mb-3 flex items-center gap-2 text-foreground-secondary">
            <ArrowRight size={15} />
            <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em]">
              Next gate
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {["D1", "D2", "D3", "D4"].map((step, index) => (
              <div
                key={step}
                className={cn(
                  "rounded-[var(--r-sm)] px-3 py-2 text-center font-sans text-xs font-semibold",
                  index < 2 ? "bg-primary text-primary-foreground" : "bg-field text-foreground-tertiary",
                )}
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Login page ────────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate();
  const personas = usePersonaStore((state) => state.personas);
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const syncSelectedFeature = () => {
      setActiveFeature(carouselApi.selectedScrollSnap());
    };

    syncSelectedFeature();
    carouselApi.on("select", syncSelectedFeature);
    carouselApi.on("reInit", syncSelectedFeature);

    return () => {
      carouselApi.off("select", syncSelectedFeature);
      carouselApi.off("reInit", syncSelectedFeature);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const timer = window.setInterval(() => {
      carouselApi.scrollNext();
    }, 7000);

    return () => window.clearInterval(timer);
  }, [carouselApi]);

  function handlePersonaLogin(personaId: PersonaID) {
    login(personaId);
    navigate("/", { replace: true });
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    // Demo: just log in as qa_deviation by default from form submit
    handlePersonaLogin("qa_deviation");
  }

  return (
    <div className="min-h-screen bg-void text-foreground">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* ── Feature carousel ──────────────────────────────────────────── */}
        <section className="relative order-2 flex min-h-[500px] w-full overflow-hidden bg-[image:var(--page-gradient)] px-5 py-6 sm:px-8 lg:order-1 lg:min-h-screen lg:w-3/5 lg:px-10 xl:px-14">
          <div className="relative z-10 flex w-full flex-col justify-between gap-8">
            <div className="flex items-center justify-between gap-4">
              <img
                src={leadAiLogo}
                alt="Lead.AI"
                className="h-8 w-auto max-w-[180px]"
              />
              <span className="hidden rounded-[var(--r-full)] border border-[var(--line-2)] bg-card/70 px-3 py-1.5 font-sans text-xs font-semibold text-foreground-secondary sm:inline-flex">
                AI-powered quality management
              </span>
            </div>

            <Carousel
              opts={{ align: "start", loop: true }}
              setApi={setCarouselApi}
              className="flex min-h-0 flex-1 flex-col justify-center"
            >
              <CarouselContent className="h-full">
                {AUTH_FEATURES.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <CarouselItem key={feature.title} className="h-full">
                      <div className="grid h-full min-h-[380px] content-center gap-7 py-3 lg:min-h-[560px]">
                        <FeatureIllustration visual={feature.visual} />

                        <div className="max-w-[720px]">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-md)] border border-[var(--line-2)] bg-card/75 text-primary">
                              <Icon size={19} />
                            </div>
                            <p className="m-0 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                              {feature.eyebrow}
                            </p>
                          </div>

                          <h1 className="m-0 max-w-[680px] font-sans text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-[42px] lg:leading-[1.08]">
                            {feature.title}
                          </h1>
                          <p className="mb-0 mt-4 max-w-[640px] font-sans text-base leading-7 text-foreground-secondary sm:text-lg">
                            {feature.description}
                          </p>

                          <div className="mt-5 flex flex-wrap gap-2">
                            {feature.proofPoints.map((point) => (
                              <span
                                key={point}
                                className="rounded-[var(--r-full)] border border-[var(--line-2)] bg-card/70 px-3 py-1.5 font-sans text-xs font-semibold text-foreground-secondary"
                              >
                                {point}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>

              <div className="mt-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {AUTH_FEATURES.map((feature, index) => (
                    <button
                      key={feature.title}
                      type="button"
                      aria-label={`Go to ${feature.eyebrow} slide`}
                      onClick={() => carouselApi?.scrollTo(index)}
                      className={cn(
                        "h-2.5 rounded-[var(--r-full)] transition-[width,background-color,opacity] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
                        activeFeature === index
                          ? "w-8 bg-primary opacity-100"
                          : "w-2.5 bg-foreground-faint opacity-45 hover:opacity-80",
                      )}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <CarouselPrevious className="static h-9 w-9 translate-x-0 translate-y-0 cursor-pointer border-[var(--line-2)] bg-card/75 text-foreground hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-45" />
                  <CarouselNext className="static h-9 w-9 translate-x-0 translate-y-0 cursor-pointer border-[var(--line-2)] bg-card/75 text-foreground hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-45" />
                </div>
              </div>
            </Carousel>
          </div>
        </section>

        {/* ── Auth panel ─────────────────────────────────────────────────── */}
        <section className="order-1 flex w-full items-center justify-center bg-background px-4 py-6 sm:px-8 lg:order-2 lg:min-h-screen lg:w-2/5 lg:px-8 xl:px-10">
          <div className="flex w-full max-w-[520px] flex-col gap-5">
            <div className="flex flex-col gap-5 rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-6 shadow-lg">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[image:var(--grad-brand)]"
                >
                  <span
                    className="font-sans text-2xl font-extrabold text-primary-foreground"
                  >
                    N
                  </span>
                </div>
                <div className="min-w-0">
                  <h1
                    className="m-0 font-sans text-[22px] font-bold text-foreground"
                  >
                    Sign in to Nova
                  </h1>
                  <p
                    className="m-0 font-sans text-sm text-foreground-faint"
                  >
                    AI-powered CAPA quality management
                  </p>
                </div>
              </div>

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
                      placeholder="Enter password..."
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
                          "hidden shrink-0 whitespace-nowrap bg-transparent font-sans text-[10px] font-semibold tracking-[0.1em] text-primary 2xl:block",
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

            {/* ── Footer note ────────────────────────────────────────────── */}
            <p
              className="m-0 text-center font-sans text-[11px] leading-normal text-foreground-faint"
            >
              This is a demo environment. All data is simulated.
              <br />
              Persona selection bypasses authentication for demo purposes.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
