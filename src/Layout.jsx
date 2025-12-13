import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, BarChart3, Layers3, Zap, Bot } from "lucide-react";
import PWAInstaller from "./components/shared/PWAInstaller";
import UserMenu from "./components/shared/UserMenu";
import KeyboardShortcuts from "./components/shared/KeyboardShortcuts";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Layers3,
  },
  {
    title: "My Dashboard",
    url: createPageUrl("CustomDashboard"),
    icon: BarChart3,
  },
  {
    title: "Projects",
    url: createPageUrl("Projects"),
    icon: Building2,
  },
  {
    title: "Analytics",
    url: createPageUrl("Analytics"),
    icon: BarChart3,
  },
  {
    title: "AI Agents",
    url: createPageUrl("Agents"),
    icon: Bot,
  },
];

export default function Layout({ children }) {
    const location = useLocation();

    // Register PWA meta tags dynamically
    React.useEffect(() => {
      // Theme color for mobile browsers
      let themeColor = document.querySelector('meta[name="theme-color"]');
      if (!themeColor) {
        themeColor = document.createElement('meta');
        themeColor.name = 'theme-color';
        document.head.appendChild(themeColor);
      }
      themeColor.content = '#1e1b4b';

      // Apple mobile web app capable
      let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
      if (!appleMeta) {
        appleMeta = document.createElement('meta');
        appleMeta.name = 'apple-mobile-web-app-capable';
        appleMeta.content = 'yes';
        document.head.appendChild(appleMeta);
      }

      // Apple status bar style
      let appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!appleStatus) {
        appleStatus = document.createElement('meta');
        appleStatus.name = 'apple-mobile-web-app-status-bar-style';
        appleStatus.content = 'black-translucent';
        document.head.appendChild(appleStatus);
      }
    }, []);

    return (
    <SidebarProvider>
      <KeyboardShortcuts />
      <div className="min-h-screen flex w-full">
        <style jsx>{`
          :root {
            --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --gradient-secondary: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            --gradient-accent: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          }
        `}</style>

        <Sidebar className="border-r border-gray-100 bg-white">
          <SidebarHeader className="border-b border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-gray-900">ArchDesigner</h2>
                <p className="text-sm text-gray-500 font-medium">Microservices Platform</p>
              </div>
            </div>
            <UserMenu />
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-3 mb-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transition-all duration-300 rounded-xl px-4 py-3 ${
                          location.pathname === item.url ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-6 py-4 md:hidden sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ArchDesigner
              </h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
          </main>

          {/* PWA Install Prompt */}
          <PWAInstaller />
          </div>
          </SidebarProvider>
          );
          }