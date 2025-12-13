import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function KeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K - Quick search (placeholder for future search modal)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toast.info("Quick search coming soon!");
      }

      // Cmd/Ctrl + S - Save (trigger save on current page)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        const saveEvent = new CustomEvent('globalSave');
        window.dispatchEvent(saveEvent);
      }

      // Cmd/Ctrl + , - Settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        navigate(createPageUrl("Settings"));
      }

      // Cmd/Ctrl + H - Home/Dashboard
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        navigate(createPageUrl("Dashboard"));
      }

      // Cmd/Ctrl + P - Projects
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        navigate(createPageUrl("Projects"));
      }

      // Escape - Close modals/dialogs
      if (e.key === 'Escape') {
        const escapeEvent = new CustomEvent('globalEscape');
        window.dispatchEvent(escapeEvent);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return null;
}