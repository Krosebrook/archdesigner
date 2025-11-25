import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PWA Installation Prompt Component
 * 
 * Displays a cinematic install prompt for adding the app to home screen.
 * Uses beforeinstallprompt event for native install experience.
 */
export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-50"
      >
        <Card className="bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 border-0 shadow-2xl overflow-hidden">
          {/* Cinematic glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl" />
          
          <CardContent className="relative p-6">
            <button
              onClick={() => setShowPrompt(false)}
              className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <motion.div 
                className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(139, 92, 246, 0.3)",
                    "0 0 40px rgba(139, 92, 246, 0.5)",
                    "0 0 20px rgba(139, 92, 246, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Smartphone className="w-7 h-7 text-white" />
              </motion.div>

              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">
                  Install ArchDesigner
                </h3>
                <p className="text-white/70 text-sm mb-4">
                  Add to home screen for instant access and offline support
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={handleInstall}
                    className="bg-white text-purple-900 hover:bg-white/90 font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Install App
                  </Button>
                  <Button
                    onClick={() => setShowPrompt(false)}
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>

            {/* Animated border glow */}
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-transparent"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), transparent) border-box",
                WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude"
              }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}