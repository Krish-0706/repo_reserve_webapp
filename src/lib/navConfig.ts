// Single source of truth for each role's sidebar nav items.
// Both each role's own dashboard AND the shared /notifications page
// import from here — editing an array in one place keeps both in sync,
// instead of duplicating (and eventually mismatching) the same list.

export type IconName = "grid" | "plus" | "chart" | "bell" | "map" | "truck" | "list" | "users" | "shield" | "star";

export type NavItem = {
    label: string;
    href: string;
    icon: IconName;
    badge?: number;
};

export function getNavItems(role: string, unreadCount: number): NavItem[] {
    switch (role) {
        case "donor":
            return [
                { label: "Dashboard", href: "/donor/dashboard", icon: "grid" },
                { label: "Post Listing", href: "/donor/listings/create", icon: "plus" },
                { label: "Impact", href: "/donor/impact", icon: "chart" },
                { label: "Notifications", href: "/notifications", icon: "bell", badge: unreadCount },
            ];
        case "ngo":
            return [
                { label: "Live Map", href: "/ngo/map", icon: "map" },
                { label: "Active Pickups", href: "/ngo/pickups", icon: "truck" },
                { label: "Impact Report", href: "/ngo/impact", icon: "chart" },
                { label: "Notifications", href: "/notifications", icon: "bell", badge: unreadCount },
            ];
        case "volunteer":
            return [
                { label: "Task Feed", href: "/volunteer/tasks", icon: "list" },
                { label: "My Stats", href: "/volunteer/stats", icon: "star" },
                { label: "Notifications", href: "/notifications", icon: "bell", badge: unreadCount },
            ];
        case "admin":
            return [
                { label: "Approval Queue", href: "/admin/kyc", icon: "shield" },
                { label: "Users", href: "/admin/users", icon: "users" },
                { label: "Audit Log", href: "/admin/audit", icon: "list" },
            ];
        default:
            return [{ label: "Notifications", href: "/notifications", icon: "bell", badge: unreadCount }];
    }
}