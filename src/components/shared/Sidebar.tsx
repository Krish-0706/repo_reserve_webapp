"use client";
// src/components/shared/Sidebar.tsx
//
// Shared sidebar for all role dashboards (donor, ngo, volunteer, admin).
// Pass `role` and `items` — active item is determined by current pathname.
//
// Usage:
//   <Sidebar
//     role="donor"
//     items={[
//       { label: "Dashboard", href: "/donor/dashboard", icon: "grid" },
//       { label: "Post Listing", href: "/donor/listings/create", icon: "plus" },
//       { label: "Impact", href: "/donor/impact", icon: "chart" },
//     ]}
//   />

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type IconName = "grid" | "plus" | "chart" | "bell" | "map" | "truck" | "list" | "users" | "shield" | "star";

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  badge?: number;
};

type SidebarProps = {
  role: string;        // displayed under logo, e.g. "Donor Account"
  items: NavItem[];
};

// ─── Icon set ─────────────────────────────────────────────────────────────────
function Icon({ name }: { name: IconName }) {
  const props = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "grid": return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
    case "plus": return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>;
    case "chart": return <svg {...props}><path d="M3 3v18h18" /><path d="M7 16l4-6 4 3 5-8" /></svg>;
    case "bell": return <svg {...props}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>;
    case "map": return <svg {...props}><circle cx="12" cy="10" r="3" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>;
    case "truck": return <svg {...props}><rect x="1" y="5" width="14" height="12" rx="1" /><path d="M15 9h4l3 3v5h-7z" /><circle cx="6" cy="19" r="1.5" /><circle cx="17.5" cy="19" r="1.5" /></svg>;
    case "list": return <svg {...props}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;
    case "users": return <svg {...props}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
    case "shield": return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>;
    case "star": return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Sidebar({ role, items }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside style={{
      width: "240px",
      background: "#1A1714",
      display: "flex",
      flexDirection: "column",
      padding: "28px 18px",
      position: "fixed",
      top: 0, left: 0, bottom: 0,
      zIndex: 10,
    }}>

      {/* Logo */}
      <div
        onClick={() => router.push(items[0]?.href ?? "/")}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "0 10px", marginBottom: "16px",
          cursor: "pointer",
        }}
      >
        <div style={{
          width: "32px", height: "32px",
          border: "2px solid #E8450A", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7" stroke="#E8450A" strokeWidth="1.5" />
            <path d="M7 10h6M10 7v6" stroke="#E8450A" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <span style={{
          fontFamily: "Syne, sans-serif",
          fontSize: "20px", fontWeight: 800,
          color: "#E8450A", letterSpacing: "-0.5px",
        }}>
          ReServe
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1 }}>
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "11px 12px",
                borderRadius: "10px",
                border: "none",
                background: active ? "rgba(232,69,10,0.14)" : "transparent",
                color: active ? "#F0EDE8" : "rgba(240,237,232,0.4)",
                fontSize: "13px",
                fontWeight: active ? 500 : 400,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                fontFamily: "DM Sans, sans-serif",
                transition: "all 0.15s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {/* Active indicator bar */}
              {active && (
                <span style={{
                  position: "absolute", left: 0, top: "50%",
                  transform: "translateY(-50%)",
                  width: "3px", height: "16px",
                  background: "#E8450A", borderRadius: "0 3px 3px 0",
                }} />
              )}
              <span style={{ color: active ? "#E8450A" : "currentColor", display: "flex", flexShrink: 0 }}>
                <Icon name={item.icon} />
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span style={{
                  background: "#E8450A", color: "#fff",
                  fontSize: "9px", fontWeight: 700,
                  padding: "2px 7px", borderRadius: "999px",
                  fontFamily: "Syne, sans-serif",
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <button
        onClick={logout}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "11px 12px", borderRadius: "10px",
          fontSize: "12px", color: "rgba(240,237,232,0.3)",
          cursor: "pointer",
          border: "1px solid rgba(240,237,232,0.08)",
          background: "none", width: "100%",
          fontFamily: "DM Sans, sans-serif",
          transition: "all 0.15s",
          marginTop: "12px",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#E8450A";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,69,10,0.3)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(240,237,232,0.3)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(240,237,232,0.08)";
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        Sign out
      </button>
    </aside>
  );
}