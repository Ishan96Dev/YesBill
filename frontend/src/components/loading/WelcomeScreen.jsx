// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * WelcomeScreen - Shown after successful login
 * Clean, branded design matching landing page aesthetics
 * 
 * @param {string} userName - User's full name
 * @param {boolean} isNewUser - Whether this is a first-time signup
 * @param {function} onComplete - Callback when animation completes
 * @param {number} duration - How long to show (ms), default 3000
 */
export default function WelcomeScreen({ 
  userName = 'User',
  isNewUser = false,
  onComplete,
  duration = 3000
}) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onComplete) {
        setTimeout(onComplete, 400); // Wait for exit animation
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAFAFA]"
        >
          {/* Gradient mesh background */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                x: [0, 30, 0],
                y: [0, -20, 0],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[120px]"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                x: [0, -25, 0],
                y: [0, 30, 0],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px]"
            />
          </div>

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative text-center px-6 max-w-lg mx-auto"
          >
            {/* Logo — large */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6 flex justify-center"
            >
              <img 
                src="/assets/branding/yesbill_logo_black.png" 
                alt="YesBill" 
                className="w-[200px] h-[200px] object-contain drop-shadow-sm"
              />
            </motion.div>

            {/* Success check */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.15, 1] }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/20 mb-6"
            >
              <CheckCircle2 className="w-8 h-8 text-white" />
            </motion.div>

            {/* Welcome message */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight"
            >
              {isNewUser ? (
                <>Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">YesBill</span>!</>
              ) : (
                <>Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">{userName}</span>!</>
              )}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-gray-500 mb-8"
            >
              {isNewUser ? "Let's get you set up" : "Redirecting to your dashboard..."}
            </motion.p>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="max-w-[240px] mx-auto"
            >
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.7, duration: (duration / 1000) - 0.7, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-primary to-indigo-600 rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
