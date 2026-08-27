import {
  LayoutDashboard,
  Plane,
  Users,
  LayoutTemplate,
  Database,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Trips", href: "/trips", icon: Plane },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
  { label: "Cost Database", href: "/cost-database", icon: Database },
  { label: "Quotations", href: "/quotations", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];
