// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { servicesService } from "../services/dataService";
import { notificationService } from "../services/notificationService";

/**
 * ServiceExpiryBanner — App-level amber banner for services expiring within 7 days.
 * Runs once per session (sessionStorage). Shows one banner at a time (most urgent first).
 * Props: userId (string)
 */
export default function ServiceExpiryBanner({ userId }) {
  const navigate = useNavigate();
  const [bannerService, setBannerService] = useState(null);
  const [daysLeft, setDaysLeft] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Only run once per session
    const sessionKey = `expiry_checked_${userId}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");

    const check = async () => {
      try {
        const services = await servicesService.getAll();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Dismissed IDs stored per-session
        const dismissedKey = `expiry_dismissed_${userId}`;
        const dismissedIds = JSON.parse(sessionStorage.getItem(dismissedKey) || "[]");

        const candidates = [];

        for (const svc of services) {
          if (!svc.end_date || !svc.active) continue;
          if (dismissedIds.includes(svc.id)) continue;

          const end = new Date(svc.end_date);
          end.setHours(0, 0, 0, 0);
          const diffDays = Math.round((end - today) / (1000 * 60 * 60 * 24));

          // Expiring soon (0–7 days)
          if (diffDays >= 0 && diffDays <= 7) {
            candidates.push({ svc, diffDays, urgent: diffDays <= 2 });

            // Create a DB notification if not yet sent this session
            const notifKey = `expiry_notif_${svc.id}`;
            if (!sessionStorage.getItem(notifKey)) {
              sessionStorage.setItem(notifKey, "1");
              notificationService.create(
                userId,
                "service_expiry",
                `${svc.name} expires ${diffDays === 0 ? "today" : `in ${diffDays} day${diffDays !== 1 ? "s" : ""}`}`,
                `Your service "${svc.name}" expires on ${new Date(svc.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`,
                { path: `/services/${svc.id}/calendar`, service_id: svc.id }
              );
            }
          }
        }

        if (candidates.length === 0) return;

        // Show the most urgent first (lowest diffDays)
        candidates.sort((a, b) => a.diffDays - b.diffDays);
        const top = candidates[0];
        setBannerService(top.svc);
        setDaysLeft(top.diffDays);
      } catch {
        // Fail silently — banner is non-critical
      }
    };

    check();
  }, [userId]);

  const handleDismiss = () => {
    if (bannerService) {
      const dismissedKey = `expiry_dismissed_${userId}`;
      const existing = JSON.parse(sessionStorage.getItem(dismissedKey) || "[]");
      existing.push(bannerService.id);
      sessionStorage.setItem(dismissedKey, JSON.stringify(existing));
    }
    setDismissed(true);
  };

  const show = !dismissed && bannerService !== null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
            daysLeft === 0
              ? "bg-red-500 text-white"
              : daysLeft <= 2
              ? "bg-amber-500 text-white"
              : "bg-amber-50 border-b border-amber-200 text-amber-900"
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1 font-medium">
              <span className="font-bold">{bannerService.name}</span>
              {daysLeft === 0
                ? " expires today!"
                : ` expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`}
            </span>
            <button
              onClick={() => navigate(`/services`)}
              className={`flex items-center gap-1 text-xs font-semibold underline underline-offset-2 shrink-0 ${
                daysLeft <= 2 ? "text-white/90 hover:text-white" : "text-amber-700 hover:text-amber-900"
              }`}
            >
              View Service <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={handleDismiss}
              className={`p-0.5 rounded transition-colors shrink-0 ${
                daysLeft <= 2 ? "hover:bg-white/20" : "hover:bg-amber-100"
              }`}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
