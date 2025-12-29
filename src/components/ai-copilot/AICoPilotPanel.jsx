import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Code2,
  Network,
  Shield,
  Package,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Zap,
  ChevronRight,
  Loader2
} from "lucide-react";
import PropTypes from "prop-types";

const categoryConfig = {
  code: { icon: Code2, label: "Code Optimization", color: "text-blue-600 bg-blue-50 border-blue-200" },
  architecture: { icon: Network, label: "Architecture", color: "text-purple-600 bg-purple-50 border-purple-200" },
  security: { icon: Shield, label: "Security", color: "text-red-600 bg-red-50 border-red-200" },
  dependencies: { icon: Package, label: "Dependencies", color: "text-green-600 bg-green-50 border-green-200" }
};

const severityConfig = {
  critical: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
  high: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-100" },
  medium: { icon: Info, color: "text-yellow-600", bg: "bg-yellow-100" },
  low: { icon: Info, color: "text-blue-600", bg: "bg-blue-100" },
  info: { icon: Info, color: "text-gray-600", bg: "bg-gray-100" }
};

function SuggestionCard({ suggestion, onDismiss, onApply }) {
  const [expanded, setExpanded] = useState(false);
  const category = categoryConfig[suggestion.category] || categoryConfig.code;
  const severity = severityConfig[suggestion.severity] || severityConfig.info;
  const CategoryIcon = category.icon;
  const SeverityIcon = severity.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="group"
    >
      <Card className={`border-l-4 hover:shadow-lg transition-all duration-300 ${category.color.split(' ')[2].replace('border-', 'border-l-')}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <motion.div 
                className={`p-2 rounded-lg ${category.color}`}
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <CategoryIcon className="w-4 h-4" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                    {suggestion.title}
                  </h4>
                  <Badge className={`${severity.bg} ${severity.color} text-xs`}>
                    <SeverityIcon className="w-3 h-3 mr-1" />
                    {suggestion.severity}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {suggestion.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDismiss(suggestion.id)}
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent className="pt-0 space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-700 font-medium mb-1">Action Required:</p>
                  <p className="text-xs text-gray-600">{suggestion.action}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium mb-1">Expected Impact:</p>
                  <p className="text-xs text-blue-600">{suggestion.impact}</p>
                </div>
                <div className="flex gap-2">
                  {suggestion.automated && (
                    <Button
                      size="sm"
                      onClick={() => onApply(suggestion)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Apply Fix
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDismiss(suggestion.id)}
                    className="text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 pb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full justify-between text-xs h-7"
          >
            {expanded ? "Show Less" : "Show Details"}
            <motion.div
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <ChevronRight className="w-3 h-3" />
            </motion.div>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

SuggestionCard.propTypes = {
  suggestion: PropTypes.object.isRequired,
  onDismiss: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired
};

export default function AICoPilotPanel({ suggestions = [], isAnalyzing, onDismiss, onApply }) {
  const [filter, setFilter] = useState("all");

  const filteredSuggestions = suggestions.filter(s => 
    filter === "all" || s.category === filter
  );

  const categoryCount = (category) => 
    suggestions.filter(s => s.category === category).length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col"
    >
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
            animate={{ rotate: isAnalyzing ? 360 : 0 }}
            transition={{ duration: 2, repeat: isAnalyzing ? Infinity : 0, ease: "linear" }}
          >
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </motion.div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">AI Co-Pilot</h3>
            <p className="text-xs text-gray-600">
              {isAnalyzing ? "Analyzing context..." : `${suggestions.length} active suggestions`}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="text-xs h-7"
          >
            All ({suggestions.length})
          </Button>
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon;
            const count = categoryCount(key);
            if (count === 0) return null;
            return (
              <Button
                key={key}
                size="sm"
                variant={filter === key ? "default" : "outline"}
                onClick={() => setFilter(key)}
                className="text-xs h-7"
              >
                <Icon className="w-3 h-3 mr-1" />
                {count}
              </Button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <AnimatePresence mode="popLayout">
          {filteredSuggestions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">All Clear!</h4>
              <p className="text-sm text-gray-600 max-w-xs">
                {isAnalyzing 
                  ? "Analyzing your architecture..." 
                  : "No suggestions at the moment. Keep coding!"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onDismiss={onDismiss}
                  onApply={onApply}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </motion.div>
  );
}

AICoPilotPanel.propTypes = {
  suggestions: PropTypes.array,
  isAnalyzing: PropTypes.bool,
  onDismiss: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired
};