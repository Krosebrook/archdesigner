import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X } from "lucide-react";
import PropTypes from "prop-types";

export default function AICoPilotToggle({ isOpen, onToggle, suggestionCount = 0, isAnalyzing = false }) {
  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={onToggle}
              size="lg"
              className="relative h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl"
            >
              <motion.div
                animate={{ rotate: isAnalyzing ? 360 : 0 }}
                transition={{ duration: 2, repeat: isAnalyzing ? Infinity : 0, ease: "linear" }}
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
              {suggestionCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1"
                >
                  <Badge className="h-6 min-w-6 bg-red-500 text-white border-2 border-white shadow-lg flex items-center justify-center">
                    {suggestionCount > 9 ? "9+" : suggestionCount}
                  </Badge>
                </motion.div>
              )}
            </Button>
          </motion.div>

          {/* Pulsing ring effect when analyzing */}
          {isAnalyzing && (
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

AICoPilotToggle.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  suggestionCount: PropTypes.number,
  isAnalyzing: PropTypes.bool
};