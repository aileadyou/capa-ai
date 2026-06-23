import { createContext, useContext, useEffect, useRef, useState, type ElementType } from "react";
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BarChart2,
  Bell,
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  Dna,
  Factory,
  FlaskConical,
  FolderOpen,
  GitPullRequestArrow,
  HeartHandshake,
  HeartPulse,
  LayoutGrid,
  Layers3,
  LogOut,
  Microscope,
  Moon,
  Pill,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  ShieldPlus,
  Stethoscope,
  Sun,
  TriangleAlert,
} from "lucide-react";
import { useAuthStore, usePersonaStore } from "@/store";
import { useNotifications } from "@/hooks/api";
import { applyTheme, getInitialTheme, type ThemeMode } from "@/lib/theme";
import { ThemeCustomizer } from "@/components/shared/ThemeCustomizer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { isMyWorkOnlyPersona } from "@/utils/personaAccess";
import logoReal from "@/assets/logo-real.png";

// ─── Collapsed context ────────────────────────────────────────────────────────

const CollapsedCtx = createContext(false);

const SIDEBAR_EXPANDED_W = 280;
const SIDEBAR_COLLAPSED_W = 64;

function setSidebarCssVar(collapsed: boolean) {
  document.documentElement.style.setProperty(
    "--sidebar-w",
    `${collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W}px`,
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SuiteId = "manufacture" | "rnd";

type NavItemConfig = {
  title: string;
  url: string;
  icon: ElementType;
  badge?: true;
};

type ModuleConfig = {
  title: string;
  description: string;
  icon: ElementType;
  url?: string;
  enabled?: boolean;
  children?: NavItemConfig[];
};

type SuiteConfig = {
  id: SuiteId;
  productName: string;
  tag: string;
  modules: ModuleConfig[];
};

type OpenState = Record<string, boolean>;

// ─── Nav data ─────────────────────────────────────────────────────────────────

const globalNav = [
  { title: "My Work", url: "/", icon: LayoutGrid, badge: true },
  { title: "Dashboard", url: "/dashboard", icon: BarChart2 },
  { title: "Notifications", url: "/notifications", icon: Bell, badge: true },
  { title: "Settings", url: "/settings/personas", icon: Settings },
] as const satisfies readonly NavItemConfig[];

const capaChildren = [
  { title: "Findings", url: "/findings", icon: AlertCircle },
  { title: "All CAPAs", url: "/capa/list", icon: FolderOpen },
  { title: "Action Plan", url: "/actions/consolidated", icon: ClipboardList },
  { title: "Similarity", url: "/similarity", icon: Search },
  { title: "Topics", url: "/topics", icon: Layers3 },
  { title: "Audit Trail", url: "/audit-trail", icon: ScrollText },
] as const satisfies readonly NavItemConfig[];

const diagnosticChildren = [
  { title: "AI Screening", url: "/diagnostics/screening", icon: Bot },
  { title: "Screening Runs", url: "/diagnostics/runs", icon: FlaskConical },
  { title: "Candidate Library", url: "/diagnostics/candidates", icon: Dna },
  { title: "Target Structures", url: "/diagnostics/targets", icon: Database },
] as const satisfies readonly NavItemConfig[];

const suites: SuiteConfig[] = [
  {
    id: "manufacture",
    productName: "Lead AI Manufacture",
    tag: "Manufacture Quality",
    modules: [
      {
        title: "CAPA",
        description: "Corrective & preventive action workspace",
        icon: ShieldCheck,
        url: "/capa",
        enabled: true,
        children: capaChildren,
      },
      { title: "OOS / OOT", description: "Out-of-spec / out-of-trend handling", icon: FlaskConical },
      { title: "Change Control", description: "Controlled quality changes", icon: GitPullRequestArrow },
      { title: "Risk Assessment", description: "Quality risk scoring", icon: TriangleAlert },
      { title: "Process Validation", description: "Manufacturing validation lifecycle", icon: Factory },
      {
        title: "Analytical Method Development & Validation",
        description: "Methods, protocols, and validation",
        icon: Microscope,
      },
      { title: "Pharmacovigilance", description: "Safety signal monitoring", icon: HeartPulse },
    ],
  },
  {
    id: "rnd",
    productName: "Lead AI RnD Lab",
    tag: "RnD Lab",
    modules: [
      {
        title: "Diagnostics",
        description: "AI peptide screening for viral targets",
        icon: Stethoscope,
        url: "/diagnostics",
        enabled: true,
        children: diagnosticChildren,
      },
      { title: "Therapeutic", description: "Therapy development programs", icon: Pill },
      { title: "Preventive", description: "Prevention and vaccine programs", icon: ShieldPlus },
      { title: "Palliative", description: "Supportive care programs", icon: HeartHandshake },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(pathname: string, url: string) {
  if (url === "/") return pathname === "/" || pathname === "/my-work";
  if (url === "/capa") return pathname === "/capa";
  if (url === "/capa/list") return pathname === "/capa/list";
  if (url === "/diagnostics") return pathname === "/diagnostics";
  if (url === "/diagnostics/screening") return pathname === "/diagnostics/screening";
  if (url === "/findings") return pathname === "/findings" || pathname.startsWith("/findings/");
  if (url === "/actions/consolidated") return pathname.startsWith("/actions");
  return pathname === url || pathname.startsWith(`${url}/`);
}

function isModuleActive(pathname: string, module: ModuleConfig) {
  if (module.url && isActive(pathname, module.url)) return true;
  return module.children?.some((child) => isActive(pathname, child.url)) ?? false;
}

function isGlobalPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/my-work" ||
    pathname === "/dashboard" ||
    pathname === "/notifications" ||
    pathname.startsWith("/settings")
  );
}

function getSuiteForPath(pathname: string): SuiteId | undefined {
  if (pathname.startsWith("/diagnostics")) return "rnd";
  if (
    pathname.startsWith("/capa") ||
    pathname.startsWith("/findings") ||
    pathname.startsWith("/actions") ||
    pathname.startsWith("/similarity") ||
    pathname.startsWith("/topics") ||
    pathname.startsWith("/audit-trail")
  ) {
    return "manufacture";
  }
  return undefined;
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({
  to,
  icon: Icon,
  title,
  badge,
  inset = false,
}: {
  to: string;
  icon: ElementType;
  title: string;
  badge?: number;
  inset?: boolean;
}) {
  const collapsed = useContext(CollapsedCtx);
  const location = useLocation();
  const active = isActive(location.pathname, to);

  return (
    <li>
      <Link
        to={to}
        title={collapsed ? title : undefined}
        className={cn(
          "sidebar-nav-item flex items-center rounded-[var(--r-sm)] bg-transparent py-2 text-sm no-underline",
          collapsed ? "justify-center px-2" : inset ? "gap-2.5 px-3 pl-8" : "gap-2.5 px-3",
          active ? "font-semibold text-primary" : "font-normal text-foreground-secondary",
        )}
        data-active={active ? "true" : undefined}
        aria-current={active ? "page" : undefined}
      >
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate">{title}</span>
            {badge !== undefined && badge > 0 && (
              <span
                className="min-w-[18px] rounded-[var(--r-full)] bg-primary px-1.5 py-px text-center font-sans text-[10px] font-bold leading-4 text-primary-on"
                aria-label={`${badge} unread`}
              >
                {badge}
              </span>
            )}
          </>
        )}
      </Link>
    </li>
  );
}

// ─── CompactNav (mobile) ──────────────────────────────────────────────────────

export function CompactNav() {
  const location = useLocation();
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);
  const compactNav = [
    ...globalNav.filter((item) => item.url !== "/dashboard" || !isMyWorkOnlyPersona(activePersonaId)),
    { title: "CAPA", url: "/capa", icon: ShieldCheck },
    ...capaChildren,
    { title: "Diagnostics", url: "/diagnostics", icon: Stethoscope },
  ];
  const { data: notifications } = useNotifications(activePersonaId);
  const unreadCount = (notifications ?? []).filter(
    (n) => n.recipientPersonaId === activePersonaId && !n.read,
  ).length;

  return (
    <nav className="compact-nav xl:hidden" aria-label="Primary navigation">
      <ul className="compact-nav-list">
        {compactNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(location.pathname, item.url);
          const badge = "badge" in item && item.badge ? unreadCount : undefined;

          return (
            <li key={`${item.title}-${item.url}`} className="compact-nav-list-item">
              <Link
                to={item.url}
                className="compact-nav-item"
                data-active={active ? "true" : undefined}
                aria-current={active ? "page" : undefined}
              >
                <span className="compact-nav-icon-wrap">
                  <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                  {badge !== undefined && badge > 0 && (
                    <span className="compact-nav-badge" aria-label={`${badge} unread`}>
                      {badge}
                    </span>
                  )}
                </span>
                <span className="compact-nav-label">{item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ─── SuiteSwitcher ────────────────────────────────────────────────────────────

function SuiteSwitcher({
  activeSuite,
  onSuiteChange,
}: {
  activeSuite: SuiteConfig;
  onSuiteChange: (suiteId: SuiteId) => void;
}) {
  const collapsed = useContext(CollapsedCtx);

  if (collapsed) {
    return (
      <div className="flex items-center justify-center py-0.5">
        <img src={logoReal} alt="Lead.AI" className="h-[22px] w-auto" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-[var(--r-md)] border border-transparent p-2 text-left transition-[background,border-color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:border-[var(--line-2)] hover:bg-elevated"
          aria-label="Switch Lead AI suite"
        >
          <span className="min-w-0">
            <img src={logoReal} alt="Lead.AI" className="h-[26px] w-auto" />
            <span className="mt-2 inline-flex max-w-full rounded-[var(--r-full)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2.5 py-1 font-sans text-[11px] font-semibold text-primary">
              <span className="truncate">{activeSuite.productName}</span>
            </span>
          </span>
          <ChevronDown size={16} strokeWidth={1.8} className="mt-1 shrink-0 text-foreground-faint" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px]">
        {suites.map((suite) => (
          <DropdownMenuItem
            key={suite.id}
            onSelect={() => onSuiteChange(suite.id)}
            className="cursor-pointer gap-2 rounded-[var(--r-sm)] px-2.5 py-2"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-sm)] bg-[var(--accent-soft)] text-primary">
              {suite.id === "manufacture" ? <Factory size={16} /> : <Microscope size={16} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{suite.productName}</span>
              <span className="block truncate text-[11px] text-foreground-tertiary">{suite.tag}</span>
            </span>
            {suite.id === activeSuite.id && <Check size={15} className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── ModuleNavItem ────────────────────────────────────────────────────────────

function ModuleNavItem({
  module,
  open,
  onOpenChange,
}: {
  module: ModuleConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const collapsed = useContext(CollapsedCtx);
  const location = useLocation();
  const active = isModuleActive(location.pathname, module);
  const Icon = module.icon;
  const hasChildren = Boolean(module.children?.length);

  if (!module.enabled || !module.url) {
    return (
      <button
        type="button"
        disabled
        title={`${module.title} is coming soon`}
        className={cn(
          "flex w-full cursor-not-allowed items-start gap-2.5 rounded-[var(--r-sm)] border border-transparent py-2 text-left text-foreground-faint opacity-70",
          collapsed ? "justify-center px-2" : "px-3",
        )}
      >
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" className={cn("shrink-0", !collapsed && "mt-0.5")} />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{module.title}</span>
              <span className="mt-0.5 block truncate text-[11px] font-normal">{module.description}</span>
            </span>
            <span className="mt-0.5 rounded-[var(--r-full)] border border-[var(--line-2)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-foreground-faint">
              Soon
            </span>
          </>
        )}
      </button>
    );
  }

  if (collapsed) {
    return (
      <Link
        to={module.url}
        title={module.title}
        className={cn(
          "flex items-center justify-center rounded-[var(--r-md)] border border-transparent py-3 transition-[background,border-color,color] [transition-duration:var(--dur-fast)]",
          active
            ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary"
            : "text-foreground-secondary hover:border-[var(--line-2)] hover:bg-elevated hover:text-foreground",
        )}
        aria-current={isActive(location.pathname, module.url) ? "page" : undefined}
      >
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div
        className={cn(
          "rounded-[var(--r-md)] border transition-[background,border-color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
          active ? "border-[var(--accent-line)] bg-[var(--accent-soft)]" : "border-transparent",
        )}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch">
          <Link
            to={module.url}
            className={cn(
              "flex min-w-0 items-start gap-2.5 rounded-l-[var(--r-md)] px-3 py-2 text-left no-underline transition-[color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
              active ? "text-primary" : "text-foreground-secondary hover:text-foreground",
            )}
            aria-current={isActive(location.pathname, module.url) ? "page" : undefined}
          >
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{module.title}</span>
              <span className="mt-0.5 block truncate text-[11px] font-normal text-foreground-tertiary">
                {module.description}
              </span>
            </span>
          </Link>
          {hasChildren && (
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-9 cursor-pointer items-center justify-center rounded-r-[var(--r-md)] text-foreground-faint transition-[background,color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-elevated hover:text-foreground"
                aria-label={`${open ? "Collapse" : "Expand"} ${module.title} menu`}
              >
                <ChevronDown
                  size={15}
                  strokeWidth={1.9}
                  aria-hidden="true"
                  className={cn(
                    "transition-transform [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
                    open ? "rotate-0" : "-rotate-90",
                  )}
                />
              </button>
            </CollapsibleTrigger>
          )}
        </div>
        {hasChildren && (
          <CollapsibleContent className="overflow-hidden">
            <ul className="m-0 flex list-none flex-col gap-0.5 border-t border-[var(--line-1)] p-1">
              {module.children?.map((child) => (
                <NavItem key={child.url} to={child.url} icon={child.icon} title={child.title} inset />
              ))}
            </ul>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

// ─── NavSection ───────────────────────────────────────────────────────────────

function NavSection({ title, children }: { title: string; children: ReactNode }) {
  const collapsed = useContext(CollapsedCtx);
  return (
    <section className="mt-5 first:mt-0">
      {!collapsed && (
        <p className="m-0 px-3 pb-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
          {title}
        </p>
      )}
      {children}
    </section>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const persona = usePersonaStore((state) => state.activePersona());
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);
  const logout = useAuthStore((state) => state.logout);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [activeSuiteId, setActiveSuiteId] = useState<SuiteId>(
    () => getSuiteForPath(location.pathname) ?? "manufacture",
  );
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [openModules, setOpenModules] = useState<OpenState>({ CAPA: true, Diagnostics: true });
  const activeSuite = suites.find((suite) => suite.id === activeSuiteId) ?? suites[0];
  const globalItems = globalNav.filter(
    (item) => item.url !== "/dashboard" || !isMyWorkOnlyPersona(activePersonaId),
  );
  const { data: notifications } = useNotifications(activePersonaId);
  const unreadCount = (notifications ?? []).filter(
    (n) => n.recipientPersonaId === activePersonaId && !n.read,
  ).length;
  const themeLabel = theme === "dark" ? "Light mode" : "Dark mode";
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  // Sync CSS variable on mount and on every toggle
  const isFirstRender = useRef(true);
  useEffect(() => {
    setSidebarCssVar(collapsed);
    isFirstRender.current = false;
  }, [collapsed]);

  useEffect(() => {
    const routeSuite = getSuiteForPath(location.pathname);
    if (routeSuite) setActiveSuiteId(routeSuite);
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const toggleTheme = () => {
    setTheme((current) => {
      const nextTheme = current === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      return nextTheme;
    });
  };

  const setModuleOpen = (title: string, open: boolean) => {
    setOpenModules((current) => ({ ...current, [title]: open }));
  };

  const handleSuiteChange = (suiteId: SuiteId) => {
    setActiveSuiteId(suiteId);
    if (!isGlobalPath(location.pathname)) navigate("/");
  };

  return (
    <CollapsedCtx.Provider value={collapsed}>
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-[var(--line-2)] bg-card font-sans xl:flex"
        style={{
          width: collapsed ? `${SIDEBAR_COLLAPSED_W}px` : `${SIDEBAR_EXPANDED_W}px`,
          transition: "width 200ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Header */}
        <div
          className={cn(
            "relative shrink-0 border-b border-[var(--line-1)] pb-4 pt-[14px]",
            collapsed ? "px-2" : "px-3",
          )}
        >
          <SuiteSwitcher activeSuite={activeSuite} onSuiteChange={handleSuiteChange} />

          {/* Toggle button — floating on right edge */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--line-2)] bg-card text-foreground-faint shadow-sm transition-[background,color] [transition-duration:var(--dur-fast)] hover:bg-elevated hover:text-foreground"
          >
            {collapsed ? (
              <ChevronRight size={11} strokeWidth={2.2} />
            ) : (
              <ChevronLeft size={11} strokeWidth={2.2} />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav
          className={cn("flex-1 overflow-y-auto py-3", collapsed ? "px-1.5" : "px-2.5")}
          aria-label="Primary navigation"
        >
          <NavSection title="Global">
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              {globalItems.map((item) => (
                <NavItem
                  key={item.url}
                  to={item.url}
                  icon={item.icon}
                  title={item.title}
                  badge={item.badge ? unreadCount : undefined}
                />
              ))}
            </ul>
          </NavSection>

          <NavSection title={activeSuite.tag}>
            <div className="flex flex-col gap-1">
              {activeSuite.modules.map((module) => (
                <ModuleNavItem
                  key={module.title}
                  module={module}
                  open={openModules[module.title] ?? (module.title === "CAPA" || module.title === "Diagnostics")}
                  onOpenChange={(open) => setModuleOpen(module.title, open)}
                />
              ))}
            </div>
          </NavSection>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-[var(--line-1)] px-2 pb-3 pt-2.5">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                title={themeLabel}
                aria-label={themeLabel}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--r-sm)] border border-transparent text-foreground-tertiary transition-[background,color] [transition-duration:var(--dur-fast)] hover:bg-elevated hover:text-foreground"
              >
                <ThemeIcon size={15} strokeWidth={1.8} />
              </button>
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-full)] bg-[image:var(--grad-brand)] text-[11px] font-bold tracking-[0.02em] text-primary-foreground"
                title={`${persona.displayName} · ${persona.role}`}
              >
                {persona.avatarInitials}
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--r-sm)] border border-transparent bg-transparent text-foreground-faint transition-[color,background] [transition-duration:var(--dur-fast)] hover:bg-[var(--danger-soft)] hover:text-destructive"
              >
                <LogOut size={14} strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-col gap-1 px-1">
                <button
                  type="button"
                  className="theme-toggle-button"
                  aria-label={`Switch to ${themeLabel}`}
                  title={`Switch to ${themeLabel}`}
                  onClick={toggleTheme}
                >
                  <ThemeIcon size={16} strokeWidth={1.8} />
                  <span>{themeLabel}</span>
                </button>
                <ThemeCustomizer />
              </div>

              <div className="flex items-center gap-3 px-3 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-full)] bg-[image:var(--grad-brand)] text-[11px] font-bold tracking-[0.02em] text-primary-foreground">
                  {persona.avatarInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-sm font-semibold text-foreground">{persona.displayName}</p>
                  <p className="m-0 truncate text-[11px] text-foreground-tertiary">
                    {persona.role} · {persona.department}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--r-sm)] border border-transparent bg-transparent text-foreground-faint transition-[color,background,border-color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-[var(--danger-soft)] hover:text-destructive"
                >
                  <LogOut size={14} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </CollapsedCtx.Provider>
  );
}
