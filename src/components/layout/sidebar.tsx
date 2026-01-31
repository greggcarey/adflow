"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Lightbulb,
  FileText,
  Video,
  Library,
  ChevronDown,
  Package,
  Users,
  Sparkles,
  ClipboardList,
  Settings,
  Image,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Ideation",
    href: "/ideation",
    icon: Lightbulb,
    children: [
      { title: "Overview", href: "/ideation", icon: Lightbulb },
      { title: "Products", href: "/ideation/products", icon: Package },
      { title: "ICPs", href: "/ideation/icps", icon: Users },
      { title: "Generate", href: "/ideation/generate", icon: Sparkles },
      { title: "Concepts", href: "/ideation/concepts", icon: ClipboardList },
    ],
  },
  {
    title: "Scripting",
    href: "/scripting",
    icon: FileText,
    children: [
      { title: "Overview", href: "/scripting", icon: FileText },
      { title: "Scripts", href: "/scripting/scripts", icon: ClipboardList },
    ],
  },
  {
    title: "Production",
    href: "/production",
    icon: Video,
    children: [
      { title: "Overview", href: "/production", icon: Video },
      { title: "Tasks", href: "/production/tasks", icon: ClipboardList },
      { title: "Team", href: "/production/team", icon: Users },
    ],
  },
  {
    title: "Library",
    href: "/library",
    icon: Library,
    children: [
      { title: "Overview", href: "/library", icon: Library },
      { title: "Ad Templates", href: "/library/templates", icon: Image },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(["Ideation"]);

  const toggleExpand = (title: string) => {
    setExpanded((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">AdFlow</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.children?.some((child) => pathname === child.href) &&
                  pathname !== "/");
              const isExpanded = expanded.includes(item.title);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <li key={item.title}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleExpand(item.title)}
                        disabled={item.disabled}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          item.disabled && "cursor-not-allowed opacity-50"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <item.icon className="h-5 w-5" />
                          {item.title}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                      {isExpanded && !item.disabled && (
                        <ul className="ml-4 mt-1 space-y-1 border-l pl-4">
                          {item.children.map((child) => {
                            const isChildActive = pathname === child.href;
                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                    isChildActive
                                      ? "bg-accent text-accent-foreground font-medium"
                                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                  )}
                                >
                                  <child.icon className="h-4 w-4" />
                                  {child.title}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.disabled ? "#" : item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        item.disabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                      {item.disabled && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          Soon
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              AdFlow MVP
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
