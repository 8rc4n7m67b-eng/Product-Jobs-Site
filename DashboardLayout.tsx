import { cn } from "@/lib/utils";
import { BrainCircuit, Filter, LayoutDashboard, Search } from "lucide-react";
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Search, label: "Search Jobs", href: "/search" },
    { icon: Filter, label: "Analytics", href: "/analytics" },
  ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary-foreground">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar transition-transform duration-300 ease-in-out hidden lg:block">
        <div className="flex h-full flex-col">
          {/* Logo Area */}
          <div className="flex h-16 items-center border-b border-border px-6">
            <div className="flex items-center gap-2 font-display font-bold text-xl text-primary">
              <BrainCircuit className="h-6 w-6" />
              <span>MindfulJobs</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer Area */}
          <div className="border-t border-border p-4">
            <div className="rounded-lg bg-secondary/10 p-4">
              <h4 className="mb-1 text-sm font-semibold text-secondary-foreground">
                Mental Health Tech
              </h4>
              <p className="text-xs text-muted-foreground">
                Curated opportunities for product leaders making an impact.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen transition-all duration-300">
        <div className="container py-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
