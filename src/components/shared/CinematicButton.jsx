import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * Professional button with micro-interactions
 * Implements spring physics and anticipation
 */
export default function CinematicButton({ 
  children,
  isLoading,
  loadingText = "Loading...",
  className,
  variant = "default",
  size = "default",
  ...props 
}) {
  const buttonVariants = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 17
      }
    },
    tap: { 
      scale: 0.98,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 17
      }
    }
  };

  return (
    <motion.div
      variants={buttonVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      <Button
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          "shadow-lg hover:shadow-xl",
          className
        )}
        disabled={isLoading}
        variant={variant}
        size={size}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingText}
          </span>
        ) : (
          children
        )}
      </Button>
    </motion.div>
  );
}