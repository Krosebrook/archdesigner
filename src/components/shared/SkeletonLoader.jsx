import React from "react";
import { cn } from "@/lib/utils";

export function SkeletonLoader({ className, variant = "default" }) {
  const baseClasses = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded";
  
  const variants = {
    default: "h-4 w-full",
    text: "h-4 w-3/4",
    title: "h-8 w-1/2",
    avatar: "h-12 w-12 rounded-full",
    card: "h-48 w-full rounded-xl",
    button: "h-10 w-24 rounded-lg",
    line: "h-3 w-full"
  };

  return (
    <div 
      className={cn(baseClasses, variants[variant], className)}
      style={{
        animation: "shimmer 2s infinite",
        backgroundImage: "linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)"
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <SkeletonLoader variant="title" />
      <SkeletonLoader variant="text" />
      <SkeletonLoader variant="line" />
      <SkeletonLoader variant="line" className="w-1/2" />
      <div className="flex gap-2 pt-4">
        <SkeletonLoader variant="button" />
        <SkeletonLoader variant="button" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLoader key={`header-${i}`} variant="text" />
        ))}
        {Array.from({ length: rows * columns }).map((_, i) => (
          <SkeletonLoader key={`cell-${i}`} variant="line" />
        ))}
      </div>
    </div>
  );
}