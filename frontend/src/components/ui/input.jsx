// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Input({ className, type, icon: Icon, error, ...props }) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="relative group">
      {Icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
          <Icon className="w-5 h-5" />
        </span>
      )}

      <input
        type={type}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "w-full h-[48px] rounded-xl border px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all duration-200",
          "placeholder:text-slate-400",
          Icon && "pl-11", // Override px-4 if icon exists
          error && "border-red-300 focus:ring-red-200 bg-red-50/50 text-red-900 placeholder:text-red-300",
          className
        )}
        {...props}
      />

      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xs text-red-500 mt-1.5 ml-1 font-medium flex items-center gap-1"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
