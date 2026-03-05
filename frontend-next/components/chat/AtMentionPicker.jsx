'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, FileText, Calendar, ChevronRight, X } from "lucide-react";
import { chatService } from "../../services/chatService";
import { servicesService } from "../../services/dataService";

const TOP_CATEGORIES = [
  { key: "service:all", label: "All Services", icon: Package, description: "Inject all your services as context" },
  { key: "bills", label: "Bills", icon: FileText, description: "Your recent generated bills" },
  { key: "calendar", label: "Calendar", icon: Calendar, description: "This month's calendar data" },
];

export default function AtMentionPicker({ open, onSelect, onClose, query = "" }) {
  const [level, setLevel] = useState("categories"); // 'categories' | 'services'
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Load services when drilling into service level
  const openServiceLevel = async () => {
    setLevel("services");
    if (services.length === 0) {
      setLoadingServices(true);
      try {
        const data = await servicesService.getActive();
        setServices(data || []);
      } catch {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    }
  };

  // Filter by query
  const filteredCategories = TOP_CATEGORIES.filter(
    (c) => !query || c.label.toLowerCase().includes(query.toLowerCase())
  );
  const filteredServices = services.filter(
    (s) => !query || s.name.toLowerCase().includes(query.toLowerCase())
  );

  // Reset level when closed
  useEffect(() => {
    if (!open) setLevel("categories");
  }, [open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full left-0 mb-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-200 w-80 max-h-64 overflow-y-auto overflow-x-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-1.5">
            {level === "services" && (
              <button
                onClick={() => setLevel("categories")}
                className="p-1 rounded-md hover:bg-gray-200 text-gray-500"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            )}
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {level === "services" ? "Select Service" : "Add Context"}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-200 text-gray-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-64 overflow-y-auto py-1">
          {level === "categories" ? (
            <>
              {filteredCategories.map(({ key, label, icon: Icon, description }) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "service:all") {
                      onSelect({ tag: "service:all", label: "All Services" });
                    } else {
                      onSelect({ tag: key, label });
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400 truncate">{description}</p>
                  </div>
                </button>
              ))}
              {/* Drill into specific service */}
              <button
                onClick={openServiceLevel}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors border-t border-gray-100"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">Specific Service…</p>
                  <p className="text-xs text-gray-400">Pick one service</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            </>
          ) : (
            <>
              {loadingServices ? (
                <div className="py-6 text-center text-sm text-gray-400">Loading services…</div>
              ) : filteredServices.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">No services found</div>
              ) : (
                filteredServices.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => onSelect({ tag: `service:${svc.id}`, label: svc.name })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm">
                      {svc.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{svc.name}</p>
                      <p className="text-xs text-gray-400">₹{svc.price} · {svc.delivery_type}</p>
                    </div>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
