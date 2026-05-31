import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertCircle,
  BarChart2,
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
import { useAuthStore, useNotificationStore, usePersonaStore } from "@/store";
import { PersonaSwitcher } from "@/components/shared/PersonaSwitcher";
import { applyTheme, getInitialTheme, type ThemeMode } from "@/lib/theme";
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
  icon: React.ElementType;
  title: string;
  badge?: number;
}) {
  const location = useLocation();
  const active = isActive(location.pathname, to);

  return (
    <li>
      <Link
        to={to}
        className="sidebar-nav-item"
        data-active={active ? "true" : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 12px",
          borderRadius: "var(--r-sm)",
          fontSize: "14px",
          fontWeight: active ? 600 : 400,
          color: active ? "var(--accent)" : "var(--fg-2)",
          background: "transparent",
          textDecoration: "none",
        }}
      >
        <Icon size={18} strokeWidth={1.75} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{title}</span>
        {badge !== undefined && badge > 0 && (
          <span
            style={{
              background: "var(--accent)",
              color: "var(--on-accent)",
              fontSize: "10px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              padding: "1px 6px",
              borderRadius: "var(--r-full)",
              minWidth: "18px",
              textAlign: "center",
              lineHeight: "16px",
            }}
          >
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}

export function Sidebar() {
  const persona = usePersonaStore((state) => state.activePersona());
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);
  const logout = useAuthStore((state) => state.logout);
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const unreadCount = useNotificationStore((state) =>
    state.notifications.filter(
      (n) => n.recipientPersonaId === activePersonaId && !n.read,
    ).length,
  );
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
      className="fixed inset-y-0 left-0 z-30 hidden xl:flex xl:flex-col"
      style={{
        width: "240px",
        background: "var(--bg-1)",
        borderRight: "1px solid var(--line-1)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center shrink-0"
        style={{ padding: "18px 16px 16px", borderBottom: "1px solid var(--line-1)" }}
      >
        <Link to="/dashboard">
          <img src={logoReal} alt="CAPA AI" style={{ height: "26px", width: "auto" }} />
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "10px 8px 0" }}>
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {navMain.map((item) => (
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
        <div
          style={{
            marginTop: "20px",
            paddingTop: "10px",
            borderTop: "1px solid var(--line-1)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              padding: "0 12px 6px",
              margin: 0,
            }}
          >
            Management
          </p>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {navManagement.map((item) => (
              <NavItem key={item.url} to={item.url} icon={item.icon} title={item.title} />
            ))}
          </ul>
        </div>

        {/* System section */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "10px",
            borderTop: "1px solid var(--line-1)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              padding: "0 12px 6px",
              margin: 0,
            }}
          >
            System
          </p>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {navSystem.map((item) => (
              <NavItem key={item.url} to={item.url} icon={item.icon} title={item.title} />
            ))}
          </ul>
        </div>
      </nav>

      {/* Bottom: persona switcher + user block */}
      <div
        style={{
          padding: "10px 8px 12px",
          borderTop: "1px solid var(--line-1)",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div style={{ padding: "0 4px" }}>
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
        </div>

        {/* Persona switcher */}
        <div style={{ padding: "0 4px" }}>
          <PersonaSwitcher />
        </div>

        {/* Active user block */}
        <div
          className="flex items-center gap-3"
          style={{ padding: "8px 12px" }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--r-full)",
              background: "var(--grad-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--on-accent)",
              flexShrink: 0,
              letterSpacing: "0.02em",
            }}
          >
            {persona.avatarInitials}
          </div>

          {/* Name + role */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--fg-1)",
                margin: 0,
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
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
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
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "var(--r-sm)",
              background: "transparent",
              border: "1px solid transparent",
              color: "var(--fg-4)",
              cursor: "pointer",
              transition: "color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--danger)";
              e.currentTarget.style.background = "var(--danger-soft)";
              e.currentTarget.style.borderColor = "transparent";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--fg-4)";
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            <LogOut size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
