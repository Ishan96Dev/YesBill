// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, Mail, MapPin, Calendar, Briefcase, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

/**
 * ClientDetailsModal — shows client info + service period for a Provider service
 * Props: isOpen, onClose, service
 */
export default function ClientDetailsModal({ isOpen, onClose, service }) {
  if (!service) return null;

  // Calculate days remaining or days since expiry
  const getDaysInfo = () => {
    if (!service.end_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(service.end_date);
    end.setHours(0, 0, 0, 0);
    const diffMs = end - today;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { expired: true, days: Math.abs(diffDays) };
    }
    return { expired: false, days: diffDays };
  };

  const daysInfo = getDaysInfo();

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{service.name}</h2>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Provider 💰
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Client Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Client</p>
                  <div className="space-y-2.5">
                    {service.client_name && (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{service.client_name}</span>
                      </div>
                    )}
                    {service.client_phone && (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <a
                          href={`tel:${service.client_phone}`}
                          className="text-sm text-gray-700 hover:text-primary transition-colors"
                        >
                          {service.client_phone}
                        </a>
                      </div>
                    )}
                    {service.client_email && (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <a
                          href={`mailto:${service.client_email}`}
                          className="text-sm text-gray-700 hover:text-primary transition-colors"
                        >
                          {service.client_email}
                        </a>
                      </div>
                    )}
                    {service.client_address && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <span className="text-sm text-gray-700">{service.client_address}</span>
                      </div>
                    )}
                    {!service.client_name && !service.client_phone && !service.client_email && (
                      <p className="text-sm text-gray-400 italic">No client info on file</p>
                    )}
                  </div>
                </div>

                {/* Service Period */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Service Period</p>
                  {service.start_date || service.end_date ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(service.start_date) || "No start date"}</span>
                          <span className="text-gray-300">→</span>
                          <span>{formatDate(service.end_date) || "No end date"}</span>
                        </div>
                      </div>
                      {daysInfo && (
                        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg w-fit ${
                          daysInfo.expired
                            ? "bg-red-50 text-red-600"
                            : daysInfo.days <= 7
                            ? "bg-amber-50 text-amber-700"
                            : "bg-green-50 text-green-700"
                        }`}>
                          {daysInfo.expired ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Expired {daysInfo.days} day{daysInfo.days !== 1 ? "s" : ""} ago
                            </>
                          ) : daysInfo.days === 0 ? (
                            <>Expires today</>
                          ) : (
                            <>{daysInfo.days} day{daysInfo.days !== 1 ? "s" : ""} remaining</>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No date range set</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <Button onClick={onClose} variant="outline" className="w-full rounded-xl">
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
