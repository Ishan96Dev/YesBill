// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import AgentPopup from "./AgentPopup";
import { chatService } from "../../services/chatService";
import { WithTooltip } from "../ui/tooltip";

/**
 * Intercom-style fixed floating AI assistant launcher.
 * Fixed bottom-right corner, outside footer to avoid overlap.
 */
export default function AgentButton() {
  const [open, setOpen] = useState(false);
  const [convId, setConvId] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  useEffect(() => {
    if (open && !initialized) {
      setInitialized(true);
      chatService
        .listConversations("agent")
        .then((data) => {
          const convs = data?.conversations || [];
          if (convs.length > 0) {
            const lastActive = new Date(convs[0].updated_at);
            const isRecent = Date.now() - lastActive.getTime() <= SESSION_TIMEOUT_MS;
            setConvId(isRecent ? convs[0].id : null);
          }
        })
        .catch(() => {});
    }
  }, [open, initialized]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Popup anchored above the button */}
      <AnimatePresence>
        {open && (
          <div className="absolute bottom-full right-0 mb-3 z-[70]">
            <AgentPopup
              onClose={() => setOpen(false)}
              convId={convId}
              setConvId={setConvId}
              onTitleUpdate={() => {}} // title updates handled inside AgentPopup via history state
            />
          </div>
        )}
      </AnimatePresence>

      {/* Intercom-style launcher */}
      <WithTooltip tip={open ? "" : "YesBill AI Assistant"} side="left">
      <span>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full shadow-2xl focus:outline-none focus:ring-4 focus:ring-primary/30 overflow-hidden"
        style={{
          width: 56,
          height: 56,
          background: "linear-gradient(135deg, #4F46E5 0%, #6366f1 50%, #818cf8 100%)",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        aria-label="Open YesBill AI Assistant"
      >
        {/* Animated icon: MessageCircle ↔ X */}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <X className="text-white w-6 h-6" strokeWidth={2.5} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <MessageCircle className="text-white w-6 h-6" strokeWidth={2.5} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsing green online indicator — hidden when open */}
        <AnimatePresence>
          {!open && (
            <motion.div
              className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center"
              style={{ backgroundColor: "#22c55e" }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 500, damping: 15 }}
            >
              {/* Ripple pulse */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: "#22c55e" }}
                animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      </span>
      </WithTooltip>
    </div>
  );
}
