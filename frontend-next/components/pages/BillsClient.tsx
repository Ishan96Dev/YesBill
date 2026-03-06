// @ts-nocheck
'use client'
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Download,
  FileText,
  Calendar,
  Eye,
  Trash2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart2,
  Lightbulb,
  AlertCircle,
  UtensilsCrossed,
  Wifi,
  Newspaper,
  Droplets,
  Dumbbell,
  Package,
  WashingMachine,
  ChevronRight,
  Wallet,
  Briefcase,
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { Button } from "@/components/ui/button";
import { WithTooltip } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import AppLoadingScreen from "@/components/loading/AppLoadingScreen";
import { BillsHistorySkeleton } from "@/components/skeletons/BillsSkeleton";
import { useToast } from "@/components/ui/toaster-custom";
import { usePageReady } from "@/hooks/usePageReady";
import { useUser } from "@/hooks/useUser";
import { servicesService } from "@/services/dataService";
import { aiSettingsService } from "@/services/aiSettingsService";
import { generatedBillsAPI } from "@/services/api";
import { MonthPicker } from "@/components/ui/MonthPicker";
import EnhancedCheckbox from "@/components/ui/enhanced-checkbox";
import ServiceDateTable from "@/components/ServiceDateTable";
import DeleteBillModal from "@/components/DeleteBillModal";
import PayBillModal from "@/components/PayBillModal";

// Map service name to lucide-react icon component (for UI)
const getServiceIcon = (serviceName) => {
  const n = (serviceName || "").toLowerCase();
  if (n.includes("tiffin") || n.includes("food") || n.includes("meal")) return UtensilsCrossed;
  if (n.includes("wifi") || n.includes("internet") || n.includes("broadband")) return Wifi;
  if (n.includes("newspaper") || n.includes("paper")) return Newspaper;
  if (n.includes("milk") || n.includes("dairy")) return Droplets;
  if (n.includes("gym") || n.includes("fitness")) return Dumbbell;
  if (n.includes("laundry") || n.includes("dhobi")) return WashingMachine;
  return Package;
};

// Emoji for PDF export only
const getServiceEmoji = (serviceName) => {
  const n = (serviceName || "").toLowerCase();
  if (n.includes("tiffin") || n.includes("food") || n.includes("meal")) return "🍱";
  if (n.includes("wifi") || n.includes("internet") || n.includes("broadband")) return "📶";
  if (n.includes("newspaper") || n.includes("paper")) return "📰";
  if (n.includes("milk") || n.includes("dairy")) return "🥛";
  if (n.includes("gym") || n.includes("fitness")) return "💪";
  if (n.includes("laundry") || n.includes("dhobi")) return "👔";
  return "📦";
};

// Format year_month as "Feb 1 – 28, 2026"
const getMonthRange = (yearMonth) => {
  try {
    const [y, m] = yearMonth.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const monthName = new Date(y, m - 1).toLocaleString("en-IN", { month: "short" });
    return `${monthName} 1 – ${daysInMonth}, ${y}`;
  } catch {
    return yearMonth;
  }
};

export default function Bills() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useUser();
  const pageReady = usePageReady(500, !authLoading);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [activeServices, setActiveServices] = useState([]);
  const [generatedBills, setGeneratedBills] = useState([]);

  const [billHistory, setBillHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [selectedModelName, setSelectedModelName] = useState(null);
  const [aiInsightsEnabled, setAiInsightsEnabled] = useState(true);

  // Delete confirmation modal state
  const [deleteBillModalOpen, setDeleteBillModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);

  // Pay bill modal state
  const [payBillModal, setPayBillModal] = useState({ open: false, bill: null });
  const [markingPaid, setMarkingPaid] = useState(false);

  // Custom note for bill generation
  const [customNote, setCustomNote] = useState("");

  // History role filter
  const [billRoleFilter, setBillRoleFilter] = useState("all");

  const loadBillHistory = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await generatedBillsAPI.list();
      setBillHistory(data || []);
    } catch (err) {
      console.error("Failed to load bill history:", err);
      setBillHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    Promise.all([
      aiSettingsService.getSelectedModelDisplayName(user.id),
      aiSettingsService.getInsightsEnabled(user.id),
    ]).then(([name, insightsOn]) => {
      if (!cancelled) {
        setSelectedModelName(name);
        setAiInsightsEnabled(insightsOn);
      }
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    servicesService.getActive().then((list) => {
      if (!cancelled) setActiveServices(list || []);
    });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setHistoryLoading(true);
    loadBillHistory();
  }, [user, loadBillHistory]);

  const filteredBillHistory = billRoleFilter === "all"
    ? billHistory
    : billHistory.filter(bill => (bill.payload?.service_role || "consumer") === billRoleFilter);

  const canGenerate = selectedMonth && selectedServiceIds.length > 0;
  const monthSelected = !!selectedMonth;
  const servicesSelected = selectedServiceIds.length > 0;

  const getNotePlaceholder = () => {
    if (!selectedServiceIds.length && !selectedMonth) {
      return "e.g., Service details or recipient information";
    }

    const selectedServices = activeServices.filter(s => selectedServiceIds.includes(s.id));
    const serviceNames = selectedServices.map(s => s.name);

    let monthDisplay = "";
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      monthDisplay = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (serviceNames.length === 0) {
      return monthDisplay ? `e.g., Service details for ${monthDisplay}` : "e.g., Service details or recipient information";
    } else if (serviceNames.length === 1) {
      return monthDisplay
        ? `e.g., ${serviceNames[0]} delivery service for ${monthDisplay}`
        : `e.g., ${serviceNames[0]} delivery service details`;
    } else if (serviceNames.length === 2) {
      return monthDisplay
        ? `e.g., ${serviceNames[0]} and ${serviceNames[1]} services for ${monthDisplay}`
        : `e.g., ${serviceNames[0]} and ${serviceNames[1]} services`;
    } else {
      return monthDisplay
        ? `e.g., ${serviceNames[0]}, ${serviceNames[1]}, and ${serviceNames.length - 2} other service(s) for ${monthDisplay}`
        : `e.g., Services for multiple providers`;
    }
  };

  const toggleService = (serviceId) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const generateBill = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const results = [];
      for (const serviceId of selectedServiceIds) {
        const { data } = await generatedBillsAPI.generate(
          selectedMonth,
          [serviceId],
          customNote.trim() || null
        );
        results.push(data);
      }
      setGeneratedBills(results);
      await loadBillHistory();
      setCustomNote("");
      toast({
        title: selectedServiceIds.length > 1 ? "Bills Generated!" : "Bill Generated!",
        description: selectedServiceIds.length > 1
          ? `${selectedServiceIds.length} separate bills saved to Previous Bills.`
          : "Your bill has been saved and appears in Previous Bills.",
        type: "success",
      });
    } catch (err) {
      console.error("Bill generation error:", err);
      const msg = err.response?.data?.detail || err.message || "Could not generate bill";
      toast({
        title: "Generation Failed",
        description: typeof msg === "string" ? msg : JSON.stringify(msg),
        type: "error",
      });
    } finally {
      setGenerating(false);
    }
  };

  const regenerateBill = async (bill) => {
    const yearMonth = bill.year_month;
    const serviceIds = bill.service_ids || [];
    if (!yearMonth || serviceIds.length === 0) {
      toast({ title: "Cannot regenerate", description: "Missing month or services.", type: "error" });
      return;
    }
    setGenerating(true);
    try {
      const { data } = await generatedBillsAPI.generate(yearMonth, serviceIds);
      setGeneratedBills([data]);
      await loadBillHistory();
      toast({ title: "Bill Regenerated", type: "success" });
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Regenerate failed";
      toast({ title: "Regenerate Failed", description: typeof msg === "string" ? msg : String(msg), type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const openDeleteModal = (bill) => {
    setBillToDelete(bill);
    setDeleteBillModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!billToDelete) return;
    try {
      await generatedBillsAPI.delete(billToDelete.id);
      setGeneratedBills((prev) => prev.filter((b) => b.id !== billToDelete.id));
      await loadBillHistory();
      toast({ title: "Bill deleted", type: "success" });
    } catch (err) {
      toast({ title: "Delete failed", description: err.message, type: "error" });
    } finally {
      setBillToDelete(null);
    }
  };

  const handleMarkPaid = async ({ is_paid, payment_method, payment_note }) => {
    if (!payBillModal.bill) return;
    setMarkingPaid(true);
    try {
      await generatedBillsAPI.markPaid(payBillModal.bill.id, { is_paid, payment_method, payment_note });
      setBillHistory((prev) =>
        prev.map((b) =>
          b.id === payBillModal.bill.id
            ? { ...b, is_paid, payment_method: payment_method || null, payment_note: payment_note || null, paid_at: is_paid ? new Date().toISOString() : null }
            : b
        )
      );
      setPayBillModal({ open: false, bill: null });
      toast({ title: is_paid ? "Bill marked as paid!" : "Payment removed", type: "success" });
    } catch (err) {
      toast({ title: "Failed to update payment", description: err.message, type: "error" });
    } finally {
      setMarkingPaid(false);
    }
  };

  const viewBill = (bill) => {
    if (bill.payload) {
      setGeneratedBills([{ ...bill.payload, id: bill.id }]);
    } else {
      generatedBillsAPI.get(bill.id).then(({ data }) => setGeneratedBills([data]));
    }
    // Scroll to generated bills section
    setTimeout(() => {
      document.getElementById("generated-bills-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const downloadPDF = (billData, index) => {
    if (!billData) return;

    const billElement = document.getElementById(`bill-content-${index}`);
    if (!billElement) {
      toast({ title: "Error", description: "Bill content not found", type: "error" });
      return;
    }

    const safeName = (billData.billTitle || billData.year_month || "bill").replace(/[^a-zA-Z0-9\s\-+]/g, "").trim();

    toast({ title: "Generating PDF", description: "Please wait...", type: "default" });

    const opt = {
      margin: [8, 8, 8, 8],
      filename: `YesBill-${safeName}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        // Fix un-renderable styles in the clone before html2canvas captures
        onclone: (_doc, clonedEl) => {
          clonedEl.querySelectorAll("[class]").forEach(el => {
            const cls = el.getAttribute("class") || "";
            if (cls.includes("backdrop-blur") || cls.includes("blur")) {
              el.style.backdropFilter = "none";
              el.style.webkitBackdropFilter = "none";
            }
            if (cls.includes("bg-clip-text") || cls.includes("text-transparent")) {
              el.style.webkitTextFillColor = "#4f46e5";
              el.style.color = "#4f46e5";
              el.style.backgroundImage = "none";
            }
          });
          const totalRow = clonedEl.querySelector(".bill-total-section");
          if (totalRow) {
            totalRow.style.pageBreakInside = "avoid";
            totalRow.style.breakInside = "avoid";
            totalRow.style.pageBreakBefore = "avoid";
          }
          // Ensure there is always clearance below the last element so the
          // page slicer never cuts through the total row.
          clonedEl.style.paddingBottom = "100px";
        },
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"], avoid: [".bill-total-section", "table", "tr"] },
    };

    html2pdf()
      .from(billElement)
      .set(opt)
      .save()
      .then(() => {
        toast({ title: "PDF Downloaded", description: "Your bill has been saved as PDF", type: "success" });
      })
      .catch((err) => {
        console.error("PDF generation error:", err);
        toast({ title: "PDF Error", description: "Could not generate PDF", type: "error" });
      });
  };

  const downloadCSV = (billData) => {
    if (!billData?.items) return;
    const headers = ["Service", "Rate/day", "Days delivered", "Days skipped", "Total", "Notes"];
    const rows = billData.items.map((i) => [
      i.service,
      i.ratePerDay,
      i.daysDelivered,
      i.daysSkipped,
      i.total,
      i.notes,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (billData.billTitle || billData.year_month || "bill").replace(/[^a-zA-Z0-9\s\-+]/g, "").trim();
    a.download = `YesBill-${safeName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV downloaded", type: "success" });
  };

  return (
    <AppLayout>
      <AnimatePresence>
        {!pageReady && <AppLoadingScreen key="loading" pageName="Bills" pageType="bills" />}
      </AnimatePresence>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Monthly{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
              Bills
            </span>
          </h1>
          <p className="text-gray-500 text-lg">
            Generate AI-powered bills from your calendar data
          </p>
        </motion.div>

        {/* Generate Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-primary/10 via-indigo-500/10 to-purple-600/10 rounded-3xl p-8 mb-8 border border-primary/20"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Generate Bill with AI
              </h2>
              <p className="text-gray-600 mb-4">
                Our {selectedModelName ? `${selectedModelName}-powered` : "AI"} engine analyzes your calendar
                confirmations, calculates itemized totals, and delivers insights on your spending patterns.
                {selectedServiceIds.length > 1 && (
                  <span className="ml-1 text-primary font-medium">
                    Each service will get its own separate bill.
                  </span>
                )}
              </p>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Month
                    </label>
                    <MonthPicker
                      value={
                        selectedMonth
                          ? new Date(
                            parseInt(selectedMonth.slice(0, 4), 10),
                            parseInt(selectedMonth.slice(5, 7), 10) - 1,
                            1
                          )
                          : undefined
                      }
                      onChange={(date) =>
                        setSelectedMonth(
                          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
                        )
                      }
                      placeholder="Pick a month for bill"
                    />
                    {!monthSelected && (
                      <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Select a month
                      </p>
                    )}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Service(s)
                    </label>
                    {activeServices.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">No active services. Add one in Services.</p>
                    ) : (
                      <div className="flex flex-wrap gap-4 py-2 border border-gray-200 rounded-xl px-3 bg-white/80">
                        {activeServices.map((svc) => (
                          <EnhancedCheckbox
                            key={svc.id}
                            label={`${svc.name} (₹${Number(svc.price).toFixed(0)}/day)`}
                            checked={selectedServiceIds.includes(svc.id)}
                            onChange={() => toggleService(svc.id)}
                          />
                        ))}
                      </div>
                    )}
                    {activeServices.length > 0 && !servicesSelected && (
                      <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Select at least one service
                      </p>
                    )}
                    {selectedServiceIds.length > 1 && (
                      <p className="mt-1.5 text-xs text-indigo-600 flex items-center gap-1">
                        <ChevronRight className="w-3.5 h-3.5" />
                        {selectedServiceIds.length} services selected — {selectedServiceIds.length} separate bills will be generated
                      </p>
                    )}
                  </div>
                </div>

                {/* Bill Notes Field */}
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bill Notes <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder={getNotePlaceholder()}
                    className="w-full p-3 border border-gray-300 rounded-xl bg-white/80 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-1.5">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      AI will refine this note for your bill
                    </p>
                    <p className="text-xs text-gray-400">
                      {customNote.length}/500
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={generateBill}
                    disabled={!canGenerate || generating}
                    size="lg"
                    className="h-[50px] px-8 rounded-xl shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600 disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {generating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <Sparkles className="w-5 h-5" />
                        </motion.div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate {selectedServiceIds.length > 1 ? `${selectedServiceIds.length} Bills` : "Bill"}
                      </>
                    )}
                  </Button>
                  {!canGenerate && (
                    <span className="text-sm text-gray-500">
                      {!monthSelected ? "Select month" : !servicesSelected ? "Select at least one service" : ""} to unlock
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/50">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                className="flex justify-center mb-2"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ scale: 1.15, transition: { duration: 0.2 } }}
              >
                <BarChart2 className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="text-sm font-semibold text-gray-700">Itemized Breakdown</p>
            </motion.div>
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="flex justify-center mb-2"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                whileHover={{ scale: 1.15, transition: { duration: 0.2 } }}
              >
                <Lightbulb className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="text-sm font-semibold text-gray-700">AI Insights</p>
            </motion.div>
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="flex justify-center mb-2"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                whileHover={{ scale: 1.15, transition: { duration: 0.2 } }}
              >
                <FileText className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="text-sm font-semibold text-gray-700">Export PDF/CSV</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Generated Bills Display */}
        <AnimatePresence>
          {generatedBills.length > 0 && (
            <motion.div
              id="generated-bills-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              {generatedBills.length > 1 && (
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Generated Bills
                  <span className="ml-3 text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {generatedBills.length} bills
                  </span>
                </h2>
              )}
              <div className={generatedBills.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-6" : ""}>
                {generatedBills.map((billData, index) => (
                  <BillCard
                    key={billData.id || index}
                    billData={billData}
                    index={index}
                    onDownloadPDF={() => downloadPDF(billData, index)}
                    onDownloadCSV={() => downloadCSV(billData)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Previous Bills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Header + role filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Previous Bills</h2>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
              {[
                { key: "all", label: "All", Icon: null },
                { key: "consumer", label: "My Bills", Icon: Wallet },
                { key: "provider", label: "Invoices", Icon: Briefcase },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setBillRoleFilter(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    billRoleFilter === key
                      ? key === "provider"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-primary text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {historyLoading && <BillsHistorySkeleton />}
          {!historyLoading && billHistory.length === 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg shadow-black/5 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No previous bills yet</p>
              <p className="text-gray-400 text-sm mt-1">Generate a bill above to see it here</p>
            </div>
          )}
          {!historyLoading && billHistory.length > 0 && filteredBillHistory.length === 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg shadow-black/5 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {billRoleFilter === "provider" ? "No invoices found" : "No consumer bills found"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {billRoleFilter === "provider"
                  ? "Generate a bill for a Provider service to see invoices here"
                  : "Switch to All to see all bills"}
              </p>
            </div>
          )}
          {!historyLoading && filteredBillHistory.length > 0 && (
            <div className="space-y-3">
              {filteredBillHistory.map((bill) => {
                const firstServiceName = bill.payload?.items?.[0]?.service || "";
                const billName = bill.bill_title
                  || bill.payload?.billTitle
                  || `${firstServiceName || "Bill"} (${bill.payload?.month || bill.year_month})`;
                const ServiceIconComp = getServiceIcon(firstServiceName);
                const dateRange = getMonthRange(bill.year_month);
                const totalDelivered = bill.payload?.items?.reduce((s, i) => s + (i.daysDelivered || 0), 0) ?? 0;
                const totalSkipped = bill.payload?.items?.reduce((s, i) => s + (i.daysSkipped || 0), 0) ?? 0;
                const serviceCount = bill.payload?.items?.length ?? 0;
                const serviceType = bill.payload?.items?.[0] ? "daily" : null;

                return (
                  <motion.div
                    key={bill.id}
                    whileHover={{ x: 4 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg shadow-black/5 hover:shadow-xl transition-all overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {/* Left: icon + info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-indigo-500/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                            <ServiceIconComp className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <h3 className="font-bold text-gray-900 text-base truncate">{billName}</h3>
                              {bill.payload?.service_role === "provider" && (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                                  Invoice 💰
                                </span>
                              )}
                              {bill.is_paid && (
                                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex-shrink-0 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Paid
                                </span>
                              )}
                              {bill.auto_generated && (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex-shrink-0 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                  Auto-generated
                                </span>
                              )}
                              {serviceType && (
                                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 flex-shrink-0">
                                  {serviceType}
                                </span>
                              )}
                              {bill.ai_model_used && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                  AI: {bill.ai_model_used.split("/").pop()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mb-1">
                              {dateRange} · Created {new Date(bill.created_at).toLocaleDateString("en-IN")}
                            </p>
                            <div className="flex items-center gap-3 text-xs flex-wrap">
                              {totalDelivered > 0 && (
                                <span className="flex items-center gap-1 text-green-600 font-medium">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {totalDelivered} delivered
                                </span>
                              )}
                              {totalSkipped > 0 && (
                                <span className="flex items-center gap-1 text-red-500 font-medium">
                                  <Clock className="w-3.5 h-3.5" />
                                  {totalSkipped} skipped
                                </span>
                              )}
                              {serviceCount > 0 && (
                                <span className="flex items-center gap-1 text-gray-400">
                                  <BarChart2 className="w-3.5 h-3.5" />
                                  {serviceCount} {serviceCount === 1 ? "service" : "services"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: amount + actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className={`text-2xl font-bold text-transparent bg-clip-text ${
                              bill.payload?.service_role === "provider"
                                ? "bg-gradient-to-r from-emerald-600 to-teal-500"
                                : "bg-gradient-to-r from-primary to-indigo-600"
                            }`}>
                              ₹{Number(bill.total_amount || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end">
                            <WithTooltip tip={bill.is_paid ? "Undo payment" : "Mark as paid"} side="top">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`rounded-xl h-9 px-3 text-xs font-semibold gap-1 ${bill.is_paid ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-gray-500 hover:text-green-600 hover:bg-green-50"}`}
                                onClick={() => setPayBillModal({ open: true, bill })}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                {bill.is_paid ? "Paid" : "Mark Paid"}
                              </Button>
                            </WithTooltip>
                            <WithTooltip tip="View bill" side="top">
                              <Button variant="ghost" size="icon" className="rounded-xl w-9 h-9" onClick={() => viewBill(bill)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </WithTooltip>
                            <WithTooltip tip="Regenerate bill" side="top">
                              <Button variant="ghost" size="icon" className="rounded-xl w-9 h-9" onClick={() => regenerateBill(bill)} disabled={generating}>
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            </WithTooltip>
                            <WithTooltip tip="Delete bill" side="top">
                              <Button variant="ghost" size="icon" className="rounded-xl w-9 h-9 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => openDeleteModal(bill)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </WithTooltip>
                          </div>
                        </div>
                      </div>

                      {/* Paid info or Bill note preview */}
                      {(bill.is_paid || bill.custom_note || bill.payload?.customNote) && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 items-center">
                          {bill.is_paid && (
                            <div className="flex items-center gap-1.5 text-xs text-green-700">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Paid {bill.paid_at ? `on ${new Date(bill.paid_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}</span>
                              {bill.payment_method && (
                                <span className="px-1.5 py-0.5 bg-green-100 rounded-full capitalize">{bill.payment_method.replace("_", " ")}</span>
                              )}
                            </div>
                          )}
                          {(bill.custom_note || bill.payload?.customNote) && (
                            <p className="text-xs text-gray-500 italic truncate">
                              📝 {bill.custom_note || bill.payload?.customNote}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteBillModal
        isOpen={deleteBillModalOpen}
        onClose={() => setDeleteBillModalOpen(false)}
        onConfirm={handleConfirmDelete}
        bill={billToDelete}
      />

      {/* Pay Bill Modal */}
      <PayBillModal
        isOpen={payBillModal.open}
        onClose={() => setPayBillModal({ open: false, bill: null })}
        bill={payBillModal.bill}
        onConfirm={handleMarkPaid}
        loading={markingPaid}
      />
    </AppLayout>
  );
}

// --- BillCard component ------------------------------------------

function BillCard({ billData, index, onDownloadPDF, onDownloadCSV }) {
  const emoji = getServiceEmoji(billData.items?.[0]?.service || "");
  const title = billData.billTitle || billData.month || "Bill";

  // Derive dominant delivery type for per-type label context
  const dominantType = billData.items?.[0]?.deliveryType || 'home_delivery';
  const isBillingFixed = ['utility', 'subscription', 'payment'].includes(dominantType);
  const isVisitBased = dominantType === 'visit_based';
  const rateLabel = isBillingFixed ? 'Billing Rate' : isVisitBased ? 'Visit Rate' : 'Delivery Rate';
  const daysLabel = isBillingFixed ? 'Months Billed' : isVisitBased ? 'Days Visited' : 'Days Delivered';

  // Provider invoice flavor
  const isProvider = billData.service_role === 'provider';
  const client = billData.client;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/5 border p-8 ${
        isProvider ? "border-emerald-200/60" : "border-gray-200/50"
      }`}
    >
      {/* Bill Content (for PDF export) */}
      <div id={`bill-content-${index}`}>
        {/* Bill Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{emoji}</span>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              {isProvider && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Invoice 💰
                </span>
              )}
            </div>
            <p className="text-gray-500">Generated by YesBill AI</p>
            <p className="text-sm text-gray-400">
              {new Date(billData.generatedAt).toLocaleString()}
            </p>
          </div>

          <div className="text-right mt-4 md:mt-0">
            <p className="text-sm text-gray-500 mb-1">
              {isProvider ? "Invoice Amount" : "Total Amount"}
            </p>
            <p className={`text-4xl font-bold ${
              isProvider ? "text-emerald-600" : "text-primary"
            }`}>
              ₹{billData.total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Invoice To — shown for provider bills with client info */}
        {isProvider && client?.name && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Invoice To</p>
            <p className="font-bold text-gray-900 text-lg">{client.name}</p>
            {client.phone && <p className="text-sm text-gray-600">📞 {client.phone}</p>}
            {client.email && <p className="text-sm text-gray-600">✉️ {client.email}</p>}
            {client.address && <p className="text-sm text-gray-600">📍 {client.address}</p>}
          </div>
        )}

        {/* AI Summary */}
        {billData.aiSummary ? (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6 border border-indigo-200/50">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Summary</h3>
                <p className="text-gray-700 leading-relaxed">{billData.aiSummary}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
            <Sparkles className="w-5 h-5 text-gray-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-500">AI Insights are disabled</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Enable AI Insights in{" "}
                <a href="/settings/ai" className="text-primary hover:underline">Settings ? AI Configuration</a>
                {" "}to see spending summaries and recommendations.
              </p>
            </div>
          </div>
        )}

        {/* Bill Notes (if provided) */}
        {billData.customNote && (
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">Bill Notes</p>
                <p className="text-sm text-blue-800 italic">"{billData.customNote}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Insights Cards */}
        {billData.aiSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-700">
                {billData.insights.deliveryRate}%
              </p>
              <p className="text-xs text-green-600 font-medium">{rateLabel}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <Calendar className="w-5 h-5 text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-blue-700">
                {billData.insights.totalDays}
              </p>
              <p className="text-xs text-blue-600 font-medium">{isBillingFixed ? 'Billing Day' : 'Days Tracked'}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <Clock className="w-5 h-5 text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-purple-700">
                {billData.insights.servicesTracked}
              </p>
              <p className="text-xs text-purple-600 font-medium">Services</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <TrendingDown className="w-5 h-5 text-orange-600 mb-2" />
              <p className="text-2xl font-bold text-orange-700">
                ₹{billData.insights.savings}
              </p>
              <p className="text-xs text-orange-600 font-medium">Saved</p>
            </div>
          </div>
        )}

        {/* Itemized Breakdown */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Itemized Breakdown</h3>
          <div className="space-y-6">
            {billData.items.map((item, itemIndex) => (
              <motion.div
                key={itemIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: itemIndex * 0.1 }}
                className="bg-gray-50 rounded-xl p-5 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">{item.service}</h4>
                    <p className="text-sm text-gray-500">{item.notes}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">₹{item.total}</p>
                    <p className="text-xs text-gray-500">₹{item.ratePerDay}/day</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 text-sm mb-3">
                  {['utility', 'subscription', 'payment'].includes(item.deliveryType) ? (
                    <span className="text-blue-600 font-medium">Fixed monthly charge · ₹{item.total}</span>
                  ) : item.deliveryType === 'visit_based' ? (
                    <>
                      <span className="text-green-600 font-medium">✓ {item.daysDelivered} visited</span>
                      <span className="text-red-600 font-medium">✗ {item.daysSkipped} missed</span>
                    </>
                  ) : (
                    <>
                      <span className="text-green-600 font-medium">✓ {item.daysDelivered} delivered</span>
                      <span className="text-red-600 font-medium">✗ {item.daysSkipped} skipped</span>
                    </>
                  )}
                </div>

                {/* Date Breakdown Table */}
                {((item.datesDelivered?.length || 0) + (item.datesSkipped?.length || 0) > 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Date Breakdown</h5>
                    <ServiceDateTable item={item} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        {billData.aiSummary && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-yellow-600 mt-1" />
              <div>
                <p className="font-semibold text-yellow-900 mb-1">💡 Recommendation</p>
                <p className="text-sm text-yellow-800">{billData.insights.recommendation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="bill-total-section flex justify-between items-center pt-6 mt-4 border-t-2 border-gray-300" style={{pageBreakInside: 'avoid', breakInside: 'avoid'}}>
          <span className="text-xl font-bold text-gray-900">Total Amount</span>
          <span className="text-3xl font-bold text-primary">
            ₹{billData.total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Button
          onClick={onDownloadPDF}
          size="lg"
          className="flex-1 bg-gradient-to-r from-primary to-indigo-600 rounded-xl"
        >
          <Download className="w-5 h-5 mr-2" />
          Download PDF
        </Button>
        <Button
          onClick={onDownloadCSV}
          variant="outline"
          size="lg"
          className="flex-1 rounded-xl"
        >
          <FileText className="w-5 h-5 mr-2" />
          Export CSV
        </Button>
      </div>
    </motion.div>
  );
}
