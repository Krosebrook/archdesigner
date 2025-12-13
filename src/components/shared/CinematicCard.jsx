import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Cinema-grade card component with professional lighting and depth
 * Features: glassmorphism, soft shadows, hover states with physics
 */
export default function CinematicCard({ 
  children, 
  className,
  variant = "default", // default | glass | elevated | flat
  hoverEffect = true,
  glowColor,
  ...props 
}) {
  const variants = {
    default: "bg-white border border-gray-100 shadow-lg",
    glass: "bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl",
    elevated: "bg-white border-0 shadow-cinematic",
    flat: "bg-white border border-gray-200"
  };

  const hoverVariants = {
    rest: { 
      y: 0,
      scale: 1,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
    },
    hover: { 
      y: -4,
      scale: 1.01,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  return (
    <motion.div
      initial="rest"
      whileHover={hoverEffect ? "hover" : "rest"}
      variants={hoverVariants}
      style={{
        filter: glowColor ? `drop-shadow(0 0 20px ${glowColor})` : undefined
      }}
    >
      <Card 
        className={cn(
          variants[variant],
          "overflow-hidden transition-colors duration-300",
          className
        )}
        {...props}
      >
        {children}
      </Card>
    </motion.div>
  );
}