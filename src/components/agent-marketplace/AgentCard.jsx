import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Download, Shield, Zap } from "lucide-react";
import PropTypes from "prop-types";

export default function AgentCard({ agent, onInstall, isInstalled }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="h-full border-2 hover:border-purple-300 hover:shadow-xl transition-all duration-300 overflow-hidden group">
        <div 
          className="h-2"
          style={{ background: `linear-gradient(90deg, ${agent.color || '#667eea'}, ${agent.color ? agent.color + '88' : '#764ba2'})` }}
        />
        
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <motion.div
              className="text-4xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              {agent.icon || "🤖"}
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                  {agent.name}
                </h3>
                {agent.is_official && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 shrink-0">
                    <Shield className="w-3 h-3 mr-1" />
                    Official
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                {agent.specialization}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700 line-clamp-3">
            {agent.description}
          </p>

          <div className="flex flex-wrap gap-1">
            {agent.tags?.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span>{agent.rating?.toFixed(1) || "5.0"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>{agent.installs_count || 0}</span>
              </div>
            </div>
            {agent.capabilities?.length > 0 && (
              <div className="flex items-center gap-1 text-purple-600">
                <Zap className="w-3 h-3" />
                <span>{agent.capabilities.length} powers</span>
              </div>
            )}
          </div>

          <Button
            onClick={() => onInstall(agent)}
            disabled={isInstalled}
            className={`w-full ${
              isInstalled 
                ? "bg-gray-300 text-gray-600" 
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            }`}
          >
            {isInstalled ? "Installed" : "Install Agent"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

AgentCard.propTypes = {
  agent: PropTypes.object.isRequired,
  onInstall: PropTypes.func.isRequired,
  isInstalled: PropTypes.bool
};