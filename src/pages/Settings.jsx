import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings as SettingsIcon, Bell } from "lucide-react";
import ProfileEditor from "../components/settings/ProfileEditor";
import PreferencesPanel from "../components/settings/PreferencesPanel";
import { AnimatedHero } from "../components/shared/AnimatedHero";

export default function Settings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <AnimatedHero
          icon={SettingsIcon}
          title="Settings"
          description="Manage your profile and preferences"
          gradient="from-blue-900 via-indigo-900 to-purple-900"
        />

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfileEditor />
          </TabsContent>

          <TabsContent value="preferences" className="mt-6">
            <PreferencesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}