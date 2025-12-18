import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

export function AnimatedHero({ 
  icon: Icon,
  title,
  description = null,
  children = null,
  gradient = "from-slate-900 via-indigo-900 to-purple-900"
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className={`bg-gradient-to-br ${gradient} border-0 shadow-2xl overflow-hidden relative`}>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-3xl" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-3 text-white text-2xl">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Icon className="w-7 h-7 text-white" />
            </motion.div>
            {title}
          </CardTitle>
          {description && (
            <p className="text-indigo-100 mt-2">{description}</p>
          )}
        </CardHeader>
        
        {children && (
          <CardContent className="relative z-10">
            {children}
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

AnimatedHero.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node,
  gradient: PropTypes.string
};