// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useMemo } from "react";
import { Check, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Password Strength Indicator
 * 
 * Matches Supabase Auth password requirements:
 * - Minimum 6 characters
 * - Requires: lowercase, uppercase, digits, AND symbols
 * 
 * Strength levels:
 * - 0 (Too short): < 6 characters
 * - 1 (Weak):      6+ chars, only 1 character type
 * - 2 (Fair):      6+ chars, 2 character types
 * - 3 (Good):      6+ chars, 3 character types
 * - 4 (Strong):    8+ chars, all 4 character types
 * - 5 (Very Strong): 12+ chars, all 4 character types
 */

const STRENGTH_CONFIG = [
  { label: "Too short", color: "bg-gray-200", textColor: "text-gray-400" },
  { label: "Weak", color: "bg-red-500", textColor: "text-red-500" },
  { label: "Fair", color: "bg-orange-400", textColor: "text-orange-500" },
  { label: "Good", color: "bg-yellow-400", textColor: "text-yellow-500" },
  { label: "Strong", color: "bg-emerald-400", textColor: "text-emerald-500" },
  { label: "Very strong", color: "bg-emerald-500", textColor: "text-emerald-600" },
];

const REQUIREMENTS = [
  { key: "minLength", label: "At least 6 characters", test: (p) => p.length >= 6 },
  { key: "lowercase", label: "Lowercase letter (a-z)", test: (p) => /[a-z]/.test(p) },
  { key: "uppercase", label: "Uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { key: "digit", label: "Number (0-9)", test: (p) => /[0-9]/.test(p) },
  { key: "symbol", label: "Symbol (!@#$%...)", test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|<>?,./~`]/.test(p) },
];

export function getPasswordStrength(password) {
  if (!password) return { score: 0, level: STRENGTH_CONFIG[0] };

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|<>?,./~`]/.test(password);
  
  const typesCount = [hasLowercase, hasUppercase, hasDigit, hasSymbol].filter(Boolean).length;

  if (password.length < 6) return { score: 0, level: STRENGTH_CONFIG[0], typesCount };
  if (password.length >= 12 && typesCount === 4) return { score: 5, level: STRENGTH_CONFIG[5], typesCount };
  if (password.length >= 8 && typesCount >= 4) return { score: 4, level: STRENGTH_CONFIG[4], typesCount };
  if (typesCount >= 3) return { score: 3, level: STRENGTH_CONFIG[3], typesCount };
  if (typesCount >= 2) return { score: 2, level: STRENGTH_CONFIG[2], typesCount };
  return { score: 1, level: STRENGTH_CONFIG[1], typesCount };
}

export default function PasswordStrengthBar({ password = "", showRequirements = true }) {
  const { score, level } = useMemo(() => getPasswordStrength(password), [password]);

  const requirements = useMemo(
    () => REQUIREMENTS.map((req) => ({ ...req, met: req.test(password) })),
    [password]
  );

  const allRequirementsMet = requirements.every((r) => r.met);

  if (!password) return null;

  // Number of bar segments to fill (out of 5)
  const filledSegments = score;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-2 mt-1.5"
      >
        {/* Strength bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((segment) => (
              <motion.div
                key={segment}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, delay: segment * 0.05 }}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 origin-left ${
                  segment <= filledSegments ? level.color : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <span className={`text-xs font-medium min-w-[80px] text-right ${level.textColor}`}>
            {level.label}
          </span>
        </div>

        {/* Requirements checklist */}
        {showRequirements && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-1.5 pt-1"
          >
            {/* Required badge */}
            {!allRequirementsMet && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium">All requirements must be met</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {requirements.map((req) => (
                <motion.div
                  key={req.key}
                  initial={{ x: -4, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                    req.met ? "text-emerald-600" : "text-gray-400"
                  }`}
                >
                  {req.met ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <Check className="w-3 h-3 flex-shrink-0" />
                    </motion.div>
                  ) : (
                    <X className="w-3 h-3 flex-shrink-0" />
                  )}
                  <span>{req.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
