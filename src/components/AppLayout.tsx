import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain, 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  FileText, 
  Settings, 
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "react-router-dom";

interface AppLayoutProps {
  children: ReactNode;
}

const AppSidebar = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const patientItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Tests", url: "/tests", icon: ClipboardList },
    { title: "Reports", url: "/reports", icon: FileText },
  ];

  const clinicianItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Patients", url: "/patients", icon: Users },
    { title: "Tests", url: "/tests", icon: ClipboardList },
  ];

  const adminItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Patients", url: "/patients", icon: Users },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ];

  const menuItems = userRole?.role === "admin" 
    ? adminItems 
    : userRole?.role === "clinician" 
      ? clinicianItems 
      : patientItems;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        <div className="p-4 flex items-center gap-2 border-b">
          <div className="p-2 bg-primary rounded-lg">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg">NeuralCare</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && "Menu"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-muted text-primary font-medium"
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-card flex items-center px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};