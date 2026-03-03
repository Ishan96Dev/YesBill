import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function AuthCard({ children, className }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative bg-slate-50/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "w-full max-w-md",
          "bg-white/70 backdrop-blur-xl", // Glass effect
          "rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]", // Strong but soft shadow
          "border border-white/20", // Subtle border
          "p-8 md:p-10",
          "relative overflow-hidden",
          className
        )}
      >
        {/* Top Highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        
        {children}
      </motion.div>

      {/* Footer / Copyright */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center text-xs text-slate-400"
      >
        © 2026 YesBill Inc. All rights reserved.
      </motion.div>
    </div>
  );
}