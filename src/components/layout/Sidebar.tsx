import { useState, type ElementType } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertCircle,
  BarChart2,
  Bell,
  ClipboardList,
  FolderOpen,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Moon,
  ScrollText,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { useAuthStore, usePersonaStore } from "@/store";
import { useNotifications } from "@/hooks/api";
import { applyTheme, getInitialTheme, type ThemeMode } from "@/lib/theme";
import { ThemeCustomizer } from "@/components/shared/ThemeCustomizer";
import { cn } from "@/lib/utils";
import { isMyWorkOnlyPersona } from "@/utils/personaAccess";
import logoReal from "@/assets/logo-real.png";

const navMain = [
  { title: "My Work", url: "/", icon: LayoutGrid, badge: true },
  { title: "Dashboard", url: "/dashboard", icon: BarChart2 },
  { title: "Findings", url: "/findings", icon: AlertCircle },
  { title: "All CAPAs", url: "/capa", icon: FolderOpen },
] as const;

const navManagement = [
  { title: "Action Plan", url: "/actions/consolidated", icon: ClipboardList },
  { title: "Similarity", url: "/similarity", icon: Search },
  { title: "Audit Trail", url: "/audit-trail", icon: ScrollText },
] as const;

const navSystem = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
] as const;

function isActive(pathname: string, url: string) {
  if (url === "/") return pathname === "/" || pathname === "/my-work";
  if (url === "/capa") return pathname === "/capa" || pathname.startsWith("/capa/");
  if (url === "/findings") return pathname === "/findings" || pathname.startsWith("/findings/");
  if (url === "/actions/consolidated") return pathname.startsWith("/actions");
  return pathname === url || pathname.startsWith(`${url}/`);
}

function NavItem({
  to,
  icon: Icon,
  title,
  badge,
}: {
  to: string;
  icon: ElementType;
  title: string;
  badge?: number;
}) {
  const location = useLocation();
  const active = isActive(location.pathname, to);

  return (
    <li>
      <Link
        to={to}
        className={cn(
          "sidebar-nav-item flex items-center gap-2.5 rounded-[var(--r-sm)] bg-transparent px-3 py-2 text-sm no-underline",
          active ? "font-semibold text-primary" : "font-normal text-foreground-secondary",
        )}
        data-active={active ? "true" : undefined}
        aria-current={active ? "page" : undefined}
      >
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
        <span className="flex-1">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span
            className="min-w-[18px] rounded-[var(--r-full)] bg-primary px-1.5 py-px text-center font-sans text-[10px] font-bold leading-4 text-primary-on"
            aria-label={`${badge} unread`}
          >
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}

export function CompactNav() {
  const location = useLocation();
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);
  const primaryNav = navMain.filter(
    (item) => item.url !== "/dashboard" || !isMyWorkOnlyPersona(activePersonaId),
  );
  const compactNav = [
    ...primaryNav,
    ...navManagement,
    { title: "Notifications", url: "/notifications", icon: Bell, badge: true },
    { title: "Personas", url: "/settings/personas", icon: Settings },
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
            <li key={item.url} className="compact-nav-list-item">
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

export function Sidebar() {
  const persona = usePersonaStore((state) => state.activePersona());
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);
  const primaryNav = navMain.filter(
    (item) => item.url !== "/dashboard" || !isMyWorkOnlyPersona(activePersonaId),
  );
  const logoHref = isMyWorkOnlyPersona(activePersonaId) ? "/" : "/dashboard";
  const logout = useAuthStore((state) => state.logout);
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const { data: notifications } = useNotifications(activePersonaId);
  const unreadCount = (notifications ?? []).filter(
    (n) => n.recipientPersonaId === activePersonaId && !n.read,
  ).length;
  const themeLabel = theme === "dark" ? "Light mode" : "Dark mode";
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  const toggleTheme = () => {
    setTheme((current) => {
      const nextTheme = current === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      return nextTheme;
    });
  };

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-[var(--line-2)] bg-card font-sans xl:flex"
    >
      {/* Logo */}
      <div
        className="flex shrink-0 items-center border-b border-[var(--line-1)] px-4 pb-4 pt-[18px]"
      >
        <Link to={logoHref}>
          <img src={logoReal} alt="CAPA AI" className="h-[26px] w-auto" />
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto px-2 pt-2.5" aria-label="Main navigation">
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          {primaryNav.map((item) => (
            <NavItem
              key={item.url}
              to={item.url}
              icon={item.icon}
              title={item.title}
              badge={"badge" in item && item.badge ? unreadCount : undefined}
            />
          ))}
        </ul>

        {/* Management section */}
        <div className="mt-5 border-t border-[var(--line-1)] pt-2.5">
          <p
            id="nav-management-heading"
            className="m-0 px-3 pb-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-primary"
          >
            Management
          </p>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0" aria-labelledby="nav-management-heading">
            {navManagement.map((item) => (
              <NavItem key={item.url} to={item.url} icon={item.icon} title={item.title} />
            ))}
          </ul>
        </div>

        {/* System section */}
        <div className="mt-5 border-t border-[var(--line-1)] pt-2.5">
          <p
            id="nav-system-heading"
            className="m-0 px-3 pb-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-primary"
          >
            System
          </p>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0" aria-labelledby="nav-system-heading">
            {navSystem.map((item) => (
              <NavItem key={item.url} to={item.url} icon={item.icon} title={item.title} />
            ))}
          </ul>
        </div>
      </nav>

      {/* Bottom: persona switcher + user block */}
      <div
        className="flex flex-col gap-1.5 border-t border-[var(--line-1)] px-2 pb-3 pt-2.5"
      >
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

        {/* Active user block */}
        <div
          className="flex items-center gap-3 px-3 py-2"
        >
          {/* Avatar */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-full)] bg-[image:var(--grad-brand)] text-[11px] font-bold tracking-[0.02em] text-primary-foreground"
          >
            {persona.avatarInitials}
          </div>

          {/* Name + role */}
          <div className="min-w-0 flex-1">
            <p
              className="m-0 truncate text-sm font-semibold text-foreground"
            >
              {persona.displayName}
            </p>
            <p
              className="m-0 truncate text-[11px] text-foreground-tertiary"
            >
              {persona.role} · {persona.department}
            </p>
          </div>

          {/* Logout button */}
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
    </aside>
  );
}
