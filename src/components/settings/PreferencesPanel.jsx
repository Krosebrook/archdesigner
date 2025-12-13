import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Moon, Sun, Bell, Zap } from "lucide-react";

export default function PreferencesPanel() {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    emailNotifications: true,
    aiAssistance: true,
    autoSave: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const user = await base44.auth.me();
      if (user.preferences) {
        setPreferences({ ...preferences, ...user.preferences });
      }
      
      // Load theme from localStorage
      const savedTheme = localStorage.getItem('theme') || 'light';
      setPreferences(prev => ({ ...prev, theme: savedTheme }));
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  };

  const updatePreference = async (key, value) => {
    setIsSaving(true);
    try {
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);
      
      // Handle theme changes immediately
      if (key === 'theme') {
        localStorage.setItem('theme', value);
        if (value === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      // Save to backend
      await base44.auth.updateMe({ preferences: newPreferences });
      toast.success("Preferences updated");
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast.error("Failed to update preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {preferences.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how ArchDesigner looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={preferences.theme}
              onValueChange={(value) => updatePreference('theme', value)}
              disabled={isSaving}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage how you receive updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive emails about project updates and alerts
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            AI & Automation
          </CardTitle>
          <CardDescription>
            Configure AI-powered features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="aiAssistance">AI Assistance</Label>
              <p className="text-sm text-gray-500">
                Enable AI-powered suggestions and analysis
              </p>
            </div>
            <Switch
              id="aiAssistance"
              checked={preferences.aiAssistance}
              onCheckedChange={(checked) => updatePreference('aiAssistance', checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="autoSave">Auto-save</Label>
              <p className="text-sm text-gray-500">
                Automatically save your work as you edit
              </p>
            </div>
            <Switch
              id="autoSave"
              checked={preferences.autoSave}
              onCheckedChange={(checked) => updatePreference('autoSave', checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}