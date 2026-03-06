// @ts-nocheck
'use client'
import { useRouter, useParams } from 'next/navigation';
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  PieChart,
  BarChart3,
  Activity,
  Layers,
  Zap,
  Award,
  PiggyBank,
  Target,
  Flame,
  GitCompare,
  Receipt,
  Package,
  Wallet,
  Briefcase,
  Brain,
  Cpu,
  Clock,
  Hash,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import AppLayout from "@/components/layout/AppLayout";
import { WithTooltip } from "@/components/ui/tooltip";
import TimeRangeDropdown from "@/components/ui/time-range-dropdown";
import AppLoadingScreen from "@/components/loading/AppLoadingScreen";
import AnalyticsSkeleton from "@/components/skeletons/AnalyticsSkeleton";
import { usePageReady } from "@/hooks/usePageReady";
import { useUser } from "@/hooks/useUser";
import { analyticsService } from "@/services/dataService";
import { aiAnalyticsAPI } from "@/services/api";

const USD_TO_INR = 85;

// --- Helpers ----------------------------------------------
const CARD = "bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/5 border border-gray-200/50 p-6 md:p-8";
const MINI_CARD = "bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg shadow-black/5";

function SectionHeader({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </h2>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>
      {right}
    </div>
  );
}

function AnimatedBar({ pct, className, delay = 0, height = "h-7" }) {
  return (
    <div className={`relative ${height} bg-gray-100 rounded-lg overflow-hidden`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.9, delay, ease: "easeOut" }}
        className={`absolute inset-y-0 left-0 rounded-lg ${className}`}
      />
    </div>
  );
}

// --- AI Usage Tab -----------------------------------------
function AIUsageTab() {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [latencyRange, setLatencyRange] = useState("3m");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    aiAnalyticsAPI
      .getSummary({ year_month: yearMonth })
      .then((data) => {
        if (!cancelled) {
          setSummaryData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("AI analytics fetch error:", err);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [yearMonth]);

  const changeMonth = (dir) => {
    const [y, m] = yearMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + dir);
    setYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const totalTokensIn = summaryData?.total_tokens_in || 0;
  const totalTokensOut = summaryData?.total_tokens_out || 0;
  const totalTokensThinking = summaryData?.total_tokens_thinking || 0;
  const totalTokens = totalTokensIn + totalTokensOut + totalTokensThinking;
  const totalCostUsd = summaryData?.total_cost_usd || 0;
  const totalCostInr = totalCostUsd * USD_TO_INR;
  const messageCount = summaryData?.message_count || 0;
  const avgLatencyMs = summaryData?.avg_latency_ms || 0;

  const formatK = (n) =>
    n >= 1000000
      ? `${(n / 1000000).toFixed(1)}M`
      : n >= 1000
        ? `${(n / 1000).toFixed(1)}K`
        : String(Math.round(n || 0));

  const dailyData = (summaryData?.daily_breakdown || []).map((d) => ({
    date: d.date.slice(5),
    Input: d.tokens_in || 0,
    Output: d.tokens_out || 0,
    Thinking: d.tokens_thinking || 0,
  }));

  const modelData = (summaryData?.model_breakdown || [])
    .filter((m) => m.model && m.model !== "unknown")
    .map((m) => ({
      model: m.model?.split("/").pop() || m.model,
      cost_inr: parseFloat(((m.total_cost_usd || 0) * USD_TO_INR).toFixed(2)),
      messages: m.message_count || 0,
    }));
  const maxModelCost = Math.max(...modelData.map((m) => m.cost_inr), 1);

  const monthsBack = latencyRange === "3m" ? 3 : latencyRange === "6m" ? 6 : 12;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);
  const latencyData = (summaryData?.daily_breakdown || [])
    .filter((d) => new Date(d.date) >= cutoff && d.avg_latency_ms > 0)
    .map((d) => ({
      date: d.date.slice(5),
      "Avg (s)": parseFloat((d.avg_latency_ms / 1000).toFixed(2)),
    }));

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${CARD} animate-pulse`}>
            <div className="h-6 bg-gray-200 rounded-lg w-48 mb-4" />
            <div className="h-48 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -4 }} className={MINI_CARD}>
          <Cpu className="w-10 h-10 text-violet-600 p-2 bg-violet-100 rounded-xl mb-3" />
          <p className="text-sm text-gray-500 mb-1">Total Tokens</p>
          <p className="text-2xl font-bold text-gray-900">{formatK(totalTokens)}</p>
          <p className="text-xs text-gray-400 mt-1">this month</p>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} className={MINI_CARD}>
          <DollarSign className="w-10 h-10 text-green-600 p-2 bg-green-100 rounded-xl mb-3" />
          <p className="text-sm text-gray-500 mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-gray-900">₹{totalCostInr.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">${totalCostUsd.toFixed(4)}</p>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} className={MINI_CARD}>
          <Hash className="w-10 h-10 text-blue-600 p-2 bg-blue-100 rounded-xl mb-3" />
          <p className="text-sm text-gray-500 mb-1">AI Messages</p>
          <p className="text-2xl font-bold text-gray-900">{messageCount.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">this month</p>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} className={MINI_CARD}>
          <Clock className="w-10 h-10 text-orange-600 p-2 bg-orange-100 rounded-xl mb-3" />
          <p className="text-sm text-gray-500 mb-1">Avg Latency</p>
          <p className="text-2xl font-bold text-gray-900">
            {avgLatencyMs > 0 ? (avgLatencyMs / 1000).toFixed(1) : "—"}s
          </p>
          <p className="text-xs text-gray-400 mt-1">per response</p>
        </motion.div>
      </div>

      {/* Daily Token Usage Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={CARD}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Daily Token Usage
            </h2>
            <p className="text-gray-500 text-sm">Input / output / thinking tokens per day</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-sm font-semibold text-gray-700 w-[76px] text-center">
              {yearMonth}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        {dailyData.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No token data for {yearMonth}.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatK}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: 12,
                }}
                formatter={(v, n) => [formatK(v), n]}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
              <Bar dataKey="Input" stackId="a" fill="#818cf8" />
              <Bar dataKey="Output" stackId="a" fill="#6366f1" />
              <Bar dataKey="Thinking" stackId="a" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Cost by Model */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={CARD}
      >
        <SectionHeader
          icon={Brain}
          title="Cost by Model"
          subtitle="Total cost breakdown per AI model this month"
        />
        {modelData.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No model data for this month.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {modelData.map((m, i) => (
              <motion.div
                key={m.model}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-semibold text-gray-700 truncate max-w-[180px]">{m.model}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400">{m.messages} msgs</span>
                    <span className="font-bold text-gray-900">₹{m.cost_inr.toFixed(2)}</span>
                  </div>
                </div>
                <AnimatedBar
                  pct={(m.cost_inr / maxModelCost) * 100}
                  className="bg-gradient-to-r from-violet-500 to-indigo-600"
                  delay={i * 0.07}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Latency Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={CARD}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Latency Trend
            </h2>
            <p className="text-gray-500 text-sm">Average response time per day</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-sm shrink-0">
            {["3m", "6m", "1y"].map((r) => (
              <button
                key={r}
                onClick={() => setLatencyRange(r)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${latencyRange === r
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        {latencyData.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No latency data available.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={latencyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                unit="s"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: 12,
                }}
                formatter={(v, n) => [`${v}s`, n]}
              />
              <Line
                type="monotone"
                dataKey="Avg (s)"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </div>
  );
}

// --- Main Analytics Page -----------------------------------
export default function Analytics() {
  const { loading: authLoading } = useUser();
  const pageReady = usePageReady(0, !authLoading);
  const { tab: urlTab } = useParams();
  const router = useRouter();

  const validTabs = ["overview", "ai-usage"];
  const [activeTab, setActiveTab] = useState(() => {
    if (urlTab && validTabs.includes(urlTab)) return urlTab;
    return "overview";
  });

  useEffect(() => {
    if (urlTab && validTabs.includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    } else if (!urlTab && activeTab !== "overview") {
      setActiveTab("overview");
    }
  }, [urlTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    router.replace(`/analytics/${tabId}`);
  };

  const tabs = [
    { id: "overview", label: "YesBill Analytics", icon: BarChart3 },
    { id: "ai-usage", label: "AI Usage", icon: Brain },
  ];

  // -- Overview Tab State ----------------------------------
  const [timeRange, setTimeRange] = useState("6months");
  const [roleFilter, setRoleFilter] = useState("all");
  const [chartMode, setChartMode] = useState("stacked");
  const [monthlyBudget, setMonthlyBudget] = useState(
    () => Number(localStorage.getItem("analytics_budget") || 0)
  );
  const [budgetInput, setBudgetInput] = useState(
    () => localStorage.getItem("analytics_budget") || ""
  );

  const [stats, setStats] = useState({
    avgMonthlySpend: 0,
    change: 0,
    totalServices: 0,
    deliveryRate: 0,
    totalSpentThisYear: 0,
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [deliveryStats, setDeliveryStats] = useState({ delivered: 0, skipped: 0, rate: 0 });
  const [forecast, setForecast] = useState({ best: 0, expected: 0, worst: 0 });
  const [perServiceData, setPerServiceData] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [yearlyComparison, setYearlyComparison] = useState({ months: [], years: {} });
  const [savingsData, setSavingsData] = useState([]);
  const [streakData, setStreakData] = useState([]);
  const [serviceBreakdownYTD, setServiceBreakdownYTD] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const monthsMap = { "3months": 3, "6months": 6, "1year": 12 };
      const numMonths = monthsMap[timeRange] || 6;

      const [
        trend,
        breakdown,
        dashStats,
        perSvc,
        categories,
        billHist,
        yearly,
        savings,
        streaks,
        ytd,
      ] = await Promise.all([
        analyticsService.getMonthlyTrend(numMonths, roleFilter),
        analyticsService.getServiceBreakdown(undefined, roleFilter),
        analyticsService.getDashboardStats(),
        analyticsService.getPerServiceMonthlyData(numMonths, roleFilter),
        analyticsService.getCategoryBreakdown(numMonths, roleFilter),
        analyticsService.getBillHistory(),
        analyticsService.getYearlyComparison([2025, 2026]),
        analyticsService.getSavingsData(numMonths, roleFilter),
        analyticsService.getStreakData(roleFilter),
        analyticsService.getServiceBreakdownYTD(roleFilter),
      ]);

      const formattedTrend = trend.map((t) => ({
        month: t.month,
        amount: t.amount,
        delivered: t.delivered,
        skipped: t.skipped,
      }));
      setMonthlyData(formattedTrend);
      setServiceBreakdown(breakdown);
      setPerServiceData(perSvc);
      setCategoryBreakdown(categories);
      setBillHistory(billHist);
      setYearlyComparison(yearly);
      setSavingsData(savings);
      setStreakData(streaks);
      setServiceBreakdownYTD(ytd);

      const avgSpend =
        formattedTrend.length > 0
          ? Math.round(
            formattedTrend.reduce((s, t) => s + t.amount, 0) / formattedTrend.length
          )
          : 0;
      const yearTotal = formattedTrend.reduce((s, t) => s + t.amount, 0);
      const prevMonth =
        formattedTrend.length >= 2
          ? formattedTrend[formattedTrend.length - 2].amount
          : 0;
      const currMonth =
        formattedTrend.length >= 1
          ? formattedTrend[formattedTrend.length - 1].amount
          : 0;
      const change =
        prevMonth > 0 ? Math.round(((currMonth - prevMonth) / prevMonth) * 1000) / 10 : 0;
      setStats({
        avgMonthlySpend: avgSpend,
        change,
        totalServices: dashStats.activeServicesCount || 0,
        deliveryRate: dashStats.deliveryRate || 0,
        totalSpentThisYear: yearTotal,
      });

      const totalDelivered = trend.reduce((s, t) => s + t.deliveredCount, 0);
      const totalSkipped = trend.reduce((s, t) => s + t.skippedCount, 0);
      const totalAll = totalDelivered + totalSkipped;
      const rate = totalAll > 0 ? Math.round((totalDelivered / totalAll) * 1000) / 10 : 0;
      setDeliveryStats({ delivered: totalDelivered, skipped: totalSkipped, rate });

      if (formattedTrend.length >= 2) {
        const last3 = formattedTrend.slice(-3);
        const avg3 = Math.round(last3.reduce((s, t) => s + t.amount, 0) / last3.length);
        setForecast({
          best: Math.round(avg3 * 0.85),
          expected: avg3,
          worst: Math.round(avg3 * 1.15),
        });
      } else {
        setForecast({ best: currMonth, expected: currMonth, worst: currMonth });
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, roleFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleSetBudget = () => {
    const val = parseFloat(budgetInput) || 0;
    setMonthlyBudget(val);
    localStorage.setItem("analytics_budget", String(val));
  };

  // -- Computed values for overview --
  const maxAmount = Math.max(...monthlyData.map((d) => d.amount), 1);
  const maxBillAmount = Math.max(...billHistory.map((b) => b.amount), 1);
  const maxYearAmount = Math.max(
    ...Object.values(yearlyComparison.years).flatMap((arr) => arr),
    1
  );
  const maxSavingsAmount = Math.max(...savingsData.map((d) => d.potential), 1);
  const totalSavings = savingsData.reduce((s, d) => s + d.savings, 0);
  const totalActual = savingsData.reduce((s, d) => s + d.actual, 0);
  const totalPotential = savingsData.reduce((s, d) => s + d.potential, 0);
  const currentMonthSpend =
    monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].amount : 0;
  const budgetPct =
    monthlyBudget > 0 ? Math.min((currentMonthSpend / monthlyBudget) * 100, 150) : 0;
  const budgetBarColor =
    budgetPct >= 100
      ? "from-red-500 to-rose-600"
      : budgetPct >= 70
        ? "from-amber-500 to-orange-500"
        : "from-green-500 to-emerald-600";

  const allServiceEntries = {};
  for (const row of perServiceData) {
    for (const [sid, svcData] of Object.entries(row.services)) {
      if (!allServiceEntries[sid]) allServiceEntries[sid] = svcData;
    }
  }
  const allServices = Object.entries(allServiceEntries).map(([id, s]) => ({ id, ...s }));
  const maxPerSvcMonthTotal = Math.max(...perServiceData.map((r) => r.total), 1);

  const yrKeys = Object.keys(yearlyComparison.years).map(Number);
  const yearColors = {
    2025: "from-blue-500 to-blue-600",
    2026: "from-purple-500 to-violet-600",
  };

  const topServices = [...serviceBreakdownYTD].slice(0, 5);
  const maxTopAmount = topServices.length > 0 ? topServices[0].amount : 1;

  const rankBadge = (i) => {
    if (i === 0) return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    if (i === 1) return "bg-gray-100 text-gray-600 border border-gray-200";
    if (i === 2) return "bg-orange-100 text-orange-700 border border-orange-200";
    return "bg-gray-50 text-gray-400 border border-gray-100";
  };

  return (
    <AppLayout>
      <AnimatePresence>
        {(!pageReady || loading) && <AppLoadingScreen key="loading" pageName="Analytics" pageType="analytics" />}
      </AnimatePresence>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">

        {/* -- Header -- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
              Analytics
            </span>
          </h1>
          <p className="text-gray-500 text-lg">
            Insights and trends from your services and AI usage
          </p>
        </motion.div>

        {/* -- Tab Layout -- */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 flex-shrink-0"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-black/5 border border-gray-200/50 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${activeTab === tab.id
                        ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/20"
                        : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </motion.aside>

          {/* Content */}
          <motion.main
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-w-0"
          >
            {/* -- Overview Tab -- */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Overview sub-header: filters + key stats */}
                <div>
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
                    <p className="text-gray-500 lg:flex-1 lg:pr-6">
                      {roleFilter === "provider"
                        ? "Income trends from your provider services"
                        : roleFilter === "consumer"
                          ? "Spending trends from your consumer services"
                          : "Track your service expenses and delivery performance"}
                    </p>
                    <div className="flex items-center gap-2 self-start lg:self-auto lg:shrink-0">
                      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
                        {[
                          { key: "all", label: "All", Icon: null },
                          { key: "consumer", label: "Consumer", Icon: Wallet },
                          { key: "provider", label: "Provider", Icon: Briefcase },
                        ].map(({ key, label, Icon }) => (
                          <button
                            key={key}
                            onClick={() => setRoleFilter(key)}
                            className={`flex items-center gap-1.5 !h-9 !min-h-9 !px-3 !py-0 !rounded-lg text-sm font-medium transition-all whitespace-nowrap ${roleFilter === key
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
                      <TimeRangeDropdown
                        value={timeRange}
                        onChange={setTimeRange}
                        className="shrink-0"
                      />
                    </div>
                  </div>

                  {/* Key Stats */}
                  {loading ? (
                    <AnalyticsSkeleton compact />
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <motion.div whileHover={{ y: -4 }} className={MINI_CARD}>
                        <div className="flex items-center justify-between mb-3">
                          <DollarSign className="w-10 h-10 text-primary p-2 bg-primary/10 rounded-xl" />
                          {stats.change > 0 ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                              <TrendingUp className="w-4 h-4" />+{stats.change}%
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500 text-sm font-semibold">
                              <TrendingDown className="w-4 h-4" />{stats.change}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-1">
                          {roleFilter === "provider" ? "Avg Monthly Income" : "Avg Monthly Spend"}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{stats.avgMonthlySpend.toLocaleString()}
                        </p>
                      </motion.div>
                      <motion.div whileHover={{ y: -4 }} className={MINI_CARD}>
                        <Activity className="w-10 h-10 text-green-600 p-2 bg-green-100 rounded-xl mb-3" />
                        <p className="text-sm text-gray-500 mb-1">Delivery Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.deliveryRate}%</p>
                      </motion.div>
                      <motion.div whileHover={{ y: -4 }} className={MINI_CARD}>
                        <PieChart className="w-10 h-10 text-purple-600 p-2 bg-purple-100 rounded-xl mb-3" />
                        <p className="text-sm text-gray-500 mb-1">Active Services</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalServices}</p>
                      </motion.div>
                      <motion.div whileHover={{ y: -4 }} className={MINI_CARD}>
                        <Calendar className="w-10 h-10 text-orange-600 p-2 bg-orange-100 rounded-xl mb-3" />
                        <p className="text-sm text-gray-500 mb-1">
                          {roleFilter === "provider" ? "Total Earned" : "Total This Period"}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{stats.totalSpentThisYear.toLocaleString()}
                        </p>
                      </motion.div>
                    </div>
                  )}
                </div>

                {!loading && (<>
                  {/* -- Section A: Monthly Spending Trend -- */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={CARD}
                  >
                    <SectionHeader
                      icon={BarChart3}
                      title={
                        roleFilter === "provider" ? "Monthly Income Trend" : "Monthly Spending Trend"
                      }
                      subtitle={
                        roleFilter === "provider"
                          ? "Track your income from provider services over time"
                          : "Track your service expenses over time"
                      }
                    />
                    <div className="space-y-3">
                      {monthlyData.map((data, index) => (
                        <motion.div
                          key={data.month}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.07 }}
                        >
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-gray-700 w-10 shrink-0">
                                {data.month}
                              </span>
                              {data.amount > 0 && (
                                <span className="text-xs text-gray-400">
                                  {data.delivered}% delivered
                                  {data.skipped > 0 && (
                                    <>
                                      {" "}
                                      ·{" "}
                                      <span className="text-red-400">{data.skipped}% skipped</span>
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-gray-900">
                              ₹{data.amount.toLocaleString()}
                            </span>
                          </div>
                          <AnimatedBar
                            pct={(data.amount / maxAmount) * 100}
                            className="bg-gradient-to-r from-primary to-indigo-600"
                            delay={index * 0.07}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* -- Section B: Per-Service Monthly Chart -- */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className={CARD}
                  >
                    <SectionHeader
                      icon={Layers}
                      title="Per-Service Monthly Spend"
                      subtitle="See how each service contributes each month"
                      right={
                        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
                          {[
                            {
                              key: "stacked",
                              label: "Stacked",
                              tip: "Show all services stacked in one bar per month",
                            },
                            {
                              key: "sideBySide",
                              label: "Per Service",
                              tip: "Show each service as a separate bar side by side",
                            },
                          ].map(({ key: m, label, tip }) => (
                            <WithTooltip key={m} tip={tip} side="top">
                              <button
                                onClick={() => setChartMode(m)}
                                className={`px-3 py-1.5 transition-colors font-medium ${chartMode === m
                                    ? "bg-primary text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-50"
                                  }`}
                              >
                                {label}
                              </button>
                            </WithTooltip>
                          ))}
                        </div>
                      }
                    />

                    {allServices.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-5">
                        {allServices.map((svc) => (
                          <div key={svc.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                            <div className={`w-2.5 h-2.5 rounded-full ${svc.color}`} />
                            {svc.name}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-4">
                      {perServiceData.map((row, index) => (
                        <motion.div
                          key={row.month}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.07 }}
                        >
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="font-semibold text-gray-700 w-10 shrink-0">
                              {row.month}
                            </span>
                            <span className="font-bold text-gray-900">
                              ₹{row.total.toLocaleString()}
                            </span>
                          </div>
                          {chartMode === "stacked" ? (
                            <div className="relative h-7 bg-gray-100 rounded-lg overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${(row.total / maxPerSvcMonthTotal) * 100}%`,
                                }}
                                transition={{
                                  duration: 0.9,
                                  delay: index * 0.07,
                                  ease: "easeOut",
                                }}
                                className="absolute inset-y-0 left-0 flex overflow-hidden rounded-lg"
                              >
                                {allServices.map((svc) => {
                                  const pct =
                                    row.total > 0
                                      ? ((row.services[svc.id]?.amount || 0) / row.total) * 100
                                      : 0;
                                  return (
                                    <div
                                      key={svc.id}
                                      style={{ width: `${pct}%` }}
                                      className={`h-full ${svc.color}`}
                                      title={`${svc.name}: ₹${row.services[svc.id]?.amount || 0}`}
                                    />
                                  );
                                })}
                              </motion.div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {allServices.map((svc) => {
                                const amt = row.services[svc.id]?.amount || 0;
                                const maxForSvc = Math.max(
                                  ...perServiceData.map((r) => r.services[svc.id]?.amount || 0),
                                  1
                                );
                                return amt > 0 ? (
                                  <div key={svc.id} className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${svc.color}`} />
                                    <span className="text-xs text-gray-500 w-20 truncate">
                                      {svc.name}
                                    </span>
                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(amt / maxForSvc) * 100}%` }}
                                        transition={{ duration: 0.8, delay: index * 0.05 }}
                                        className={`h-full ${svc.color} rounded-full`}
                                      />
                                    </div>
                                    <span className="text-xs font-medium text-gray-700 w-16 text-right">
                                      ₹{amt.toLocaleString()}
                                    </span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* -- Row: Category Breakdown + Bill History -- */}
                  <div className="grid lg:grid-cols-2 gap-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className={CARD}
                    >
                      <SectionHeader
                        icon={Zap}
                        title="Spending by Category"
                        subtitle="Grouped by service type"
                      />
                      {categoryBreakdown.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">
                          No category data yet. Start tracking services.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {categoryBreakdown.map((cat, i) => (
                            <motion.div
                              key={cat.category}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 + i * 0.08 }}
                              className="space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-gray-700">{cat.label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">{cat.percentage}%</span>
                                  <span className="font-bold text-gray-900">
                                    ₹{cat.amount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <AnimatedBar
                                pct={cat.percentage}
                                className={`bg-gradient-to-r ${cat.gradient}`}
                                delay={0.2 + i * 0.08}
                                height="h-5"
                              />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className={CARD}
                    >
                      <SectionHeader
                        icon={Receipt}
                        title="Bill History"
                        subtitle="Generated bills over time"
                      />
                      {billHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm">No bills generated yet.</p>
                          <p className="text-gray-300 text-xs mt-1">
                            Generate your first bill from the Bills page.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 pr-1 max-h-[320px] overflow-y-auto">
                          {billHistory.map((bill, i) => (
                            <motion.div
                              key={bill.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.07 }}
                            >
                              <div className="flex items-center justify-between text-sm mb-1">
                                <div>
                                  <span className="font-semibold text-gray-700">
                                    {bill.title || bill.month}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-400">{bill.month}</span>
                                </div>
                                <span className="font-bold text-gray-900">
                                  ₹{bill.amount.toLocaleString()}
                                </span>
                              </div>
                              <AnimatedBar
                                pct={(bill.amount / maxBillAmount) * 100}
                                className="bg-gradient-to-r from-indigo-400 to-purple-500"
                                delay={i * 0.07}
                                height="h-4"
                              />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* -- Section E: Yearly Comparison -- */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={CARD}
                  >
                    <SectionHeader
                      icon={GitCompare}
                      title="Yearly Comparison"
                      subtitle="Jan–Dec spending across years"
                    />
                    {yearlyComparison.months.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-8">
                        No multi-year data yet.
                      </p>
                    ) : (
                      <>
                        <div className="flex gap-4 mb-6">
                          {yrKeys.map((yr) => (
                            <div key={yr} className="flex items-center gap-2 text-sm font-medium text-gray-600">
                              <div
                                className={`w-3 h-3 rounded-full bg-gradient-to-r ${yearColors[yr] || "from-gray-400 to-gray-500"
                                  }`}
                              />
                              {yr}
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3">
                          {yearlyComparison.months.map((monthLabel, idx) => {
                            const hasData = yrKeys.some(
                              (yr) => (yearlyComparison.years[yr]?.[idx] || 0) > 0
                            );
                            if (!hasData) return null;
                            return (
                              <div key={monthLabel}>
                                <span className="text-xs font-semibold text-gray-400 uppercase mb-1.5 block">
                                  {monthLabel}
                                </span>
                                {yrKeys.map((yr, yi) => {
                                  const amt = yearlyComparison.years[yr]?.[idx] || 0;
                                  return (
                                    <div key={yr} className="flex items-center gap-3 mb-1">
                                      <span className="text-xs text-gray-400 w-10 shrink-0">
                                        {yr}
                                      </span>
                                      <div className="flex-1 relative h-5 bg-gray-100 rounded-lg overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{
                                            width: `${(amt / maxYearAmount) * 100}%`,
                                          }}
                                          transition={{
                                            duration: 0.9,
                                            delay: 0.3 + yi * 0.05,
                                            ease: "easeOut",
                                          }}
                                          className={`absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r ${yearColors[yr] || "from-gray-400 to-gray-500"
                                            }`}
                                        />
                                      </div>
                                      <span className="text-xs font-bold text-gray-700 w-16 text-right">
                                        ₹{amt.toLocaleString()}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex gap-6 mt-6 pt-4 border-t border-gray-100">
                          {yrKeys.map((yr) => (
                            <div key={yr}>
                              <p className="text-xs text-gray-400">{yr} Total</p>
                              <p className="text-lg font-bold text-gray-900">
                                ₹{(yearlyComparison.years[yr] || [])
                                  .reduce((s, v) => s + v, 0)
                                  .toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>

                  {/* -- Row: Top Services + Savings -- */}
                  <div className="grid lg:grid-cols-2 gap-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className={CARD}
                    >
                      <SectionHeader
                        icon={Award}
                        title="Top Expensive Services"
                        subtitle="Ranked by year-to-date spend"
                      />
                      {topServices.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">
                          No spend data yet.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {topServices.map((svc, i) => (
                            <motion.div
                              key={svc.name}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.35 + i * 0.08 }}
                              className="space-y-1.5"
                            >
                              <div className="flex items-center gap-3 text-sm">
                                <span
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${rankBadge(i)}`}
                                >
                                  #{i + 1}
                                </span>
                                <span className="font-semibold text-gray-700 flex-1">
                                  {svc.name}
                                </span>
                                <span className="font-bold text-gray-900">
                                  ₹{svc.amount.toLocaleString()}
                                </span>
                              </div>
                              <div className="ml-10">
                                <AnimatedBar
                                  pct={(svc.amount / maxTopAmount) * 100}
                                  className={`${svc.color}`}
                                  delay={0.35 + i * 0.08}
                                  height="h-4"
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className={CARD}
                    >
                      <SectionHeader
                        icon={PiggyBank}
                        title="Savings Tracker"
                        subtitle="Money saved from skipped deliveries"
                      />
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-gray-50 rounded-2xl p-3 text-center">
                          <p className="text-xs text-gray-400 mb-1">Potential</p>
                          <p className="text-lg font-bold text-gray-700">
                            ₹{totalPotential.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-2xl p-3 text-center">
                          <p className="text-xs text-blue-400 mb-1">Actual Paid</p>
                          <p className="text-lg font-bold text-blue-700">
                            ₹{totalActual.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-2xl p-3 text-center">
                          <p className="text-xs text-green-500 mb-1">Saved</p>
                          <p className="text-lg font-bold text-green-700">
                            ₹{totalSavings.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {savingsData.map((d, i) => (
                          <motion.div
                            key={d.month}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.07 }}
                          >
                            <div className="flex items-center justify-between text-xs mb-1 text-gray-500">
                              <span className="font-semibold text-gray-600">{d.month}</span>
                              {d.savings > 0 && (
                                <span className="text-green-600 font-medium">
                                  Saved ₹{d.savings}
                                </span>
                              )}
                            </div>
                            <div className="relative h-5 bg-gray-100 rounded-lg overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${(d.potential / maxSavingsAmount) * 100}%`,
                                }}
                                transition={{
                                  duration: 0.9,
                                  delay: 0.4 + i * 0.07,
                                  ease: "easeOut",
                                }}
                                className="absolute inset-y-0 left-0 bg-gray-200 rounded-lg"
                              />
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${(d.actual / maxSavingsAmount) * 100}%`,
                                }}
                                transition={{
                                  duration: 0.9,
                                  delay: 0.4 + i * 0.07 + 0.1,
                                  ease: "easeOut",
                                }}
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-indigo-600 rounded-lg"
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      {savingsData.every((d) => d.savings === 0) && (
                        <p className="text-xs text-gray-400 text-center mt-4">
                          No skipped deliveries in this period
                        </p>
                      )}
                    </motion.div>
                  </div>

                  {/* -- Row: Streak Tracker + Budget vs Actual -- */}
                  <div className="grid lg:grid-cols-2 gap-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className={CARD}
                    >
                      <SectionHeader
                        icon={Flame}
                        title="Streak Tracker"
                        subtitle="Consecutive delivery streaks per service"
                      />
                      {streakData.length === 0 ? (
                        <div className="text-center py-8">
                          <Flame className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">
                            Start tracking deliveries to see streaks.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {streakData.slice(0, 6).map((svc, i) => (
                            <motion.div
                              key={svc.serviceId}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.45 + i * 0.08 }}
                            >
                              <div className="flex items-center gap-3 mb-1.5">
                                <div
                                  className={`w-2 h-full min-h-[32px] rounded-full ${svc.color} shrink-0`}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                      {svc.name}
                                      {svc.currentStreak >= 7 && (
                                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                                      )}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {svc.totalDelivered} total
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs mt-0.5">
                                    <span className="text-green-600 font-medium">
                                      🔥 {svc.currentStreak} day streak
                                    </span>
                                    <span className="text-gray-400">
                                      Best: {svc.longestStreak} days
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <AnimatedBar
                                pct={
                                  svc.longestStreak > 0
                                    ? (svc.currentStreak / svc.longestStreak) * 100
                                    : 0
                                }
                                className={`${svc.color}`}
                                delay={0.45 + i * 0.08}
                                height="h-3"
                              />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className={CARD}
                    >
                      <SectionHeader
                        icon={Target}
                        title="Budget vs Actual"
                        subtitle="Set a monthly budget and track usage"
                      />
                      <div className="flex gap-2 mb-6">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            ?
                          </span>
                          <input
                            type="number"
                            value={budgetInput}
                            onChange={(e) => setBudgetInput(e.target.value)}
                            placeholder="Set monthly budget"
                            className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 text-sm"
                          />
                        </div>
                        <button
                          onClick={handleSetBudget}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                        >
                          Set
                        </button>
                      </div>

                      {monthlyBudget > 0 ? (
                        <>
                          <div className="flex items-end justify-between mb-3">
                            <div>
                              <p className="text-3xl font-bold text-gray-900">
                                ₹{currentMonthSpend.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-400">
                                of ₹{monthlyBudget.toLocaleString()} budget
                              </p>
                            </div>
                            <p
                              className={`text-2xl font-bold ${budgetPct >= 100
                                  ? "text-red-600"
                                  : budgetPct >= 70
                                    ? "text-amber-600"
                                    : "text-green-600"
                                }`}
                            >
                              {Math.round(budgetPct)}%
                            </p>
                          </div>
                          <div className="relative h-8 bg-gray-100 rounded-xl overflow-hidden mb-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(budgetPct, 100)}%` }}
                              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${budgetBarColor} rounded-xl`}
                            />
                          </div>
                          {monthlyBudget - currentMonthSpend >= 0 ? (
                            <p className="text-sm font-semibold text-green-600">
                              ₹{(monthlyBudget - currentMonthSpend).toLocaleString()} remaining
                              this month
                            </p>
                          ) : (
                            <p className="text-sm font-semibold text-red-600">
                              ₹{Math.abs(monthlyBudget - currentMonthSpend).toLocaleString()} over
                              budget
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <Target className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">
                            Set a budget above to start tracking
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* -- Section J: Service Breakdown -- */}
                  <div className="grid lg:grid-cols-2 gap-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 }}
                      className={CARD}
                    >
                      <SectionHeader
                        icon={PieChart}
                        title="Service Breakdown"
                        subtitle="This month — where your money goes"
                      />
                      {serviceBreakdown.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">
                          No data for current month.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {serviceBreakdown.map((svc, i) => (
                            <motion.div
                              key={svc.name}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.55 + i * 0.08 }}
                              className="space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${svc.color}`} />
                                  <span className="font-semibold text-gray-700">{svc.name}</span>
                                </div>
                                <span className="font-bold text-gray-900">
                                  ₹{svc.amount.toLocaleString()}
                                </span>
                              </div>
                              <AnimatedBar
                                pct={svc.percentage}
                                className={svc.color}
                                delay={0.55 + i * 0.08}
                                height="h-3"
                              />
                              <p className="text-xs text-gray-400">{svc.percentage}% of this month</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className={CARD}
                    >
                      <SectionHeader
                        icon={Package}
                        title="Year-to-Date Breakdown"
                        subtitle="Cumulative spend per service this year"
                      />
                      {serviceBreakdownYTD.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">
                          No YTD data yet.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {serviceBreakdownYTD.map((svc, i) => (
                            <motion.div
                              key={svc.name}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 + i * 0.08 }}
                              className="space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${svc.color}`} />
                                  <span className="font-semibold text-gray-700">{svc.name}</span>
                                </div>
                                <span className="font-bold text-gray-900">
                                  ₹{svc.amount.toLocaleString()}
                                </span>
                              </div>
                              <AnimatedBar
                                pct={svc.percentage}
                                className={svc.color}
                                delay={0.6 + i * 0.08}
                                height="h-3"
                              />
                              <p className="text-xs text-gray-400">
                                {svc.percentage}% of total YTD
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* -- Section K: Delivery vs Skipped + Forecast -- */}
                  <div className="grid lg:grid-cols-2 gap-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65 }}
                      className={CARD}
                    >
                      <SectionHeader
                        icon={Activity}
                        title="Delivery vs Skipped"
                        subtitle="Service completion rates"
                      />
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">
                              Services Delivered
                            </span>
                            <span className="text-2xl font-bold text-green-600">
                              {deliveryStats.delivered}
                            </span>
                          </div>
                          <AnimatedBar
                            pct={deliveryStats.rate}
                            className="from-green-500 to-emerald-600 bg-gradient-to-r"
                            delay={0.65}
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">
                              Services Skipped
                            </span>
                            <span className="text-2xl font-bold text-red-500">
                              {deliveryStats.skipped}
                            </span>
                          </div>
                          <AnimatedBar
                            pct={100 - deliveryStats.rate}
                            className="from-red-400 to-rose-500 bg-gradient-to-r"
                            delay={0.7}
                          />
                        </div>
                        <div className="pt-4 border-t border-gray-100 text-center">
                          <p className="text-sm text-gray-500 mb-1">Overall Efficiency</p>
                          <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">
                            {deliveryStats.rate}%
                          </p>
                          <p className="text-sm font-semibold mt-2 text-green-600">
                            {deliveryStats.rate >= 90
                              ? "Excellent performance!"
                              : deliveryStats.rate >= 70
                                ? "Good consistency"
                                : "Room to improve"}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-6 md:p-8 border border-purple-200/50 flex flex-col justify-center"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Next Month Forecast
                          </h3>
                          <p className="text-gray-600 text-sm mb-4">
                            Based on your current usage, estimated spend is approximately{" "}
                            <span className="font-bold text-primary">
                              ₹{forecast.expected.toLocaleString()}
                            </span>
                            .
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white/60 rounded-xl p-3 text-center">
                              <p className="text-xs text-gray-500 mb-1">Best</p>
                              <p className="text-lg font-bold text-green-600">
                                ₹{forecast.best.toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-white/60 rounded-xl p-3 text-center">
                              <p className="text-xs text-gray-500 mb-1">Expected</p>
                              <p className="text-lg font-bold text-primary">
                                ₹{forecast.expected.toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-white/60 rounded-xl p-3 text-center">
                              <p className="text-xs text-gray-500 mb-1">Worst</p>
                              <p className="text-lg font-bold text-orange-600">
                                ₹{forecast.worst.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </>)}
              </div>
            )}

            {/* -- AI Usage Tab -- */}
            {activeTab === "ai-usage" && <AIUsageTab />}
          </motion.main>
        </div>

      </div>
    </AppLayout>
  );
}
