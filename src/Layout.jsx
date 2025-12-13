import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, BarChart3, Layers3, Zap, Bot } from "lucide-react";
import { motion } from "framer-motion";
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
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;900&family=Inter:wght@400;500;600;700&display=swap');

          :root {
            --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --gradient-secondary: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            --gradient-accent: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);

            /* Cinema-grade colors */
            --cinematic-teal: #14b8a6;
            --cinematic-orange: #f97316;
            --cinematic-slate: #0f172a;

            /* Studio lighting */
            --shadow-key: 0 20px 40px rgba(0, 0, 0, 0.25);
            --shadow-fill: 0 8px 16px rgba(0, 0, 0, 0.15);
            --shadow-cinematic: 0 30px 60px -12px rgba(0, 0, 0, 0.35), 0 18px 36px -18px rgba(0, 0, 0, 0.3);

            /* Typography */
            --font-heading: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
            --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }

          * {
            font-family: var(--font-body);
          }

          h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-heading);
            font-weight: 700;
            letter-spacing: -0.02em;
          }
        `}</style>

        <Sidebar className="border-r border-gray-100 bg-white/80 backdrop-blur-xl">
          <SidebarHeader className="border-b border-gray-100/50 p-4">
            <motion.div 
              className="flex items-center gap-3 mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <motion.div 
                className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Zap className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className="font-bold text-xl text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                  ArchDesigner
                </h2>
                <p className="text-sm text-gray-500 font-medium">Microservices Platform</p>
              </div>
            </motion.div>
            <UserMenu />
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-3 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 300,
                        damping: 24
                      }}
                    >
                      <SidebarMenuItem>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transition-all duration-300 rounded-xl px-4 py-3 ${
                            location.pathname === item.url ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm' : ''
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              whileTap={{ scale: 0.95 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                              <item.icon className="w-5 h-5" />
                            </motion.div>
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </motion.div>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
          {/* Cinematic ambient lighting effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          </div>

          <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100/50 px-6 py-4 md:hidden sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
              </motion.div>
              <h1 
                className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                ArchDesigner
              </h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto relative z-10">
            {children}
          </div>
          </main>

          {/* PWA Install Prompt */}
          <PWAInstaller />
          </div>
          </SidebarProvider>
          );
          }