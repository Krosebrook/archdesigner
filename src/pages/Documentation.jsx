import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Sparkles, Rocket, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

import ChangelogViewer from "../components/documentation/ChangelogViewer";
import BestPracticesGuide from "../components/documentation/BestPracticesGuide";

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState("changelog");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="relative">
        {/* Cinematic ambient lighting */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto mb-8"
          >
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4"
                >
                  <BookOpen className="w-8 h-8" />
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3">
                  Documentation
                </h1>
                <p className="text-lg text-white/90 max-w-2xl">
                  Comprehensive guides, changelogs, roadmaps, and best practices for BuildBuddy platform
                </p>
              </div>
            </div>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full max-w-2xl grid-cols-2 mx-auto">
                <TabsTrigger value="changelog" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Changelog & Roadmap
                </TabsTrigger>
                <TabsTrigger value="best-practices" className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Best Practices
                </TabsTrigger>
              </TabsList>

              <TabsContent value="changelog">
                <ChangelogViewer />
              </TabsContent>

              <TabsContent value="best-practices">
                <BestPracticesGuide />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}