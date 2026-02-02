import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useAnalyses } from "@/hooks/use-analyses";
import { Home, BarChart3, FolderOpen, Layers, ChevronRight, LogOut, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { data: analyses } = useAnalyses();

  if (!user) {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/", label: "Overview", icon: Home },
    { href: "/analyses", label: "Analyses", icon: BarChart3 },
    { href: "/projects", label: "Projects", icon: Layers },
    { href: "/files", label: "Files", icon: FolderOpen },
  ];

  const recentAnalyses = (analyses || []).slice(0, 5);

  // Helper to generate breadcrumb text based on current path
  const getBreadcrumb = () => {
    if (location === "/" || location === "/dashboard") return "Overview";
    if (location.startsWith("/analyses")) return "Analyses";
    if (location.startsWith("/projects")) return "Projects";
    if (location.startsWith("/files")) return "Files";
    return "Dashboard";
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <Sidebar className="border-r border-sidebar-border/60">
          <SidebarHeader className="h-14 border-b border-sidebar-border/40 px-4 flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 font-semibold tracking-tight text-sidebar-foreground">
                <div className="w-5 h-5 bg-primary rounded-sm flex items-center justify-center">
                   <div className="w-2.5 h-2.5 bg-primary-foreground rounded-full" />
                </div>
                <span>Noema</span>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-2 py-4">
            <SidebarGroup>
              <SidebarGroupLabel className="px-2 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">
                Platform
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive =
                      location === item.href ||
                      (item.href !== "/" && location.startsWith(item.href));
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          className={`
                            h-9 text-[13px] font-medium transition-all duration-200
                            ${isActive 
                              ? "bg-sidebar-accent text-sidebar-primary-foreground font-semibold shadow-sm" 
                              : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                            }
                          `}
                        >
                          <Link href={item.href}>
                            <item.icon className="w-4 h-4 mr-2 opacity-80" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {recentAnalyses.length > 0 && (
              <SidebarGroup className="mt-6">
                <SidebarGroupLabel className="px-2 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">
                  Recent Work
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {recentAnalyses.map((analysis: any) => {
                      const isActive = location === `/analyses/${analysis.id}`;
                      const title = analysis.title.replace("Analysis: ", "");
                      return (
                        <SidebarMenuItem key={analysis.id}>
                          <SidebarMenuButton 
                            asChild 
                            isActive={isActive}
                            className="h-8 text-[13px] text-muted-foreground hover:text-foreground"
                          >
                            <Link href={`/analyses/${analysis.id}`} className="truncate">
                              <span className="truncate w-full">{title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border/40">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-sidebar-accent transition-colors group">
                  <Avatar className="w-8 h-8 rounded-md border border-sidebar-border">
                    <AvatarFallback className="text-xs font-medium bg-sidebar-accent text-sidebar-foreground">
                      {user.firstName?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm">
                    <span className="font-medium text-sidebar-foreground group-hover:text-foreground transition-colors">
                      {user.firstName || "User"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Pro Plan</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg pointer-events-auto">
                <DropdownMenuItem onClick={() => logout()} className="text-red-500 focus:text-red-500 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background h-screen overflow-hidden">
          {/* Top Header */}
          <header className="h-14 flex-none border-b border-border/40 bg-background/50 backdrop-blur-sm px-6 flex items-center justify-between z-10 sticky top-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-2 h-8 w-8 text-muted-foreground hover:text-foreground lg:hidden" />
              <div className="flex items-center text-sm">
                <span className="text-muted-foreground/60 font-medium">Noema</span>
                <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground/40" />
                <span className="text-foreground font-medium">{getBreadcrumb()}</span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6 scroll-smooth">
            <div className="mx-auto max-w-6xl w-full animate-fade-in space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
