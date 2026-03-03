// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI" },
  { id: "cash", label: "Cash" },
  { id: "bank_transfer", label: "Bank Transfer" },
  { id: "credit_card", label: "Credit Card" },
  { id: "debit_card", label: "Debit Card" },
  { id: "net_banking", label: "Net Banking" },
];

export default function PayBillModal({ isOpen, onClose, bill, onConfirm, loading }) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  if (!isOpen || !bill) return null;

  const alreadyPaid = bill.is_paid;
  const currency = bill.currency || "INR";
  const symbol = currency === "INR" ? "₹" : currency;

  const handleConfirm = () => {
    if (!alreadyPaid && !paymentMethod) return;
    onConfirm({
      is_paid: !alreadyPaid,
      payment_method: alreadyPaid ? null : paymentMethod,
      payment_note: alreadyPaid ? null : (paymentNote.trim() || null),
    });
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className={`px-6 py-5 border-b border-gray-200 ${alreadyPaid ? "bg-gradient-to-r from-green-50 to-emerald-50" : "bg-gradient-to-r from-primary/10 via-indigo-500/10 to-purple-600/10"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {alreadyPaid ? "Undo Payment" : "Mark as Paid"}
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {bill.bill_title || "Bill"} · {symbol}{bill.total_amount?.toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl hover:bg-white/80 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {alreadyPaid ? (
              /* Already paid — show summary and undo option */
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-700">Paid on {formatDate(bill.paid_at)}</span>
                  </div>
                  {bill.payment_method && (
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium capitalize">
                      {bill.payment_method.replace("_", " ")}
                    </span>
                  )}
                  {bill.payment_note && (
                    <p className="text-sm text-gray-600 mt-2 italic">"{bill.payment_note}"</p>
                  )}
                </div>
                <p className="text-sm text-gray-500 text-center">
                  This will remove the paid status from this bill.
                </p>
              </div>
            ) : (
              /* Not paid — show payment method selector */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                          paymentMethod === m.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Note <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="e.g. Paid via GPay, ref #12345"
                    maxLength={300}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            {alreadyPaid ? (
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0 gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                {loading ? "Undoing..." : "Undo Payment"}
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                disabled={loading || !paymentMethod}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? "Saving..." : "Confirm Payment"}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
