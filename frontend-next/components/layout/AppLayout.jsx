'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect, useRef, useCallback } from "react";
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Package,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  CheckCheck,
  Receipt,
  TrendingUp,
  MailCheck,
  Clock,
  AlertTriangle,
  Banknote,
  RefreshCcw,
  MessageSquare,
  Lock,
  Brain,
  LifeBuoy,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import AgentButton from "../agent/AgentButton";
import { Button } from "../ui/button";
import { WithTooltip } from "../ui/tooltip";
import Background from "../landing/Background";
import AuthLoadingScreen from "../loading/AuthLoadingScreen";
import ServiceExpiryBanner from "../ServiceExpiryBanner";
import { cn } from "../../lib/utils"
import { assetUrl } from "../../lib/utils";
import authService from "../../services/authService";
import notificationService from "../../services/notificationService";
import { aiSettingsService } from "../../services/aiSettingsService";
import { useUser, resetUserStore } from "../../hooks/useUser";
import { useNotifications } from "../../hooks/useNotifications";

// ─── Searchable pages ──────────────────────────────────────────────
const DOCS_URL = "https://ishan96dev.github.io/YesBill/docs/";

const PAGES = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Calendar", path: "/calendar", icon: CalendarDays },
  { name: "Services", path: "/services", icon: Package },
  { name: "Bills", path: "/bills", icon: FileText },
  { name: "Ask AI", path: "/chat", icon: MessageSquare },
  { name: "Analytics", path: "/analytics", icon: BarChart3 },
  { name: "Settings", path: "/settings", icon: Settings },
  { name: "Support", path: "/support", icon: LifeBuoy },
  {
    name: "Documentation",
    path: DOCS_URL,
    icon: BookOpen,
    external: true,
    searchTerms: ["docs", "documentation", "guide", "help center"],
  },
];

// ─── Notification type → icon mapping ─────────────────────────────
function NotifIcon({ type, className = "w-4 h-4" }) {
  const map = {
    bill_due_soon: { Icon: Clock, color: "text-amber-500" },
    bill_overdue: { Icon: AlertTriangle, color: "text-red-500" },
    payment_recorded: { Icon: Banknote, color: "text-green-500" },
    budget_exceeded: { Icon: TrendingUp, color: "text-red-500" },
    bill_added: { Icon: Receipt, color: "text-blue-500" },
    bill_auto_generated: { Icon: RefreshCcw, color: "text-indigo-500" },
    bill_auto_warning: { Icon: Clock, color: "text-orange-500" },
    email_verification: { Icon: MailCheck, color: "text-teal-500" },
    service_expiry: { Icon: AlertTriangle, color: "text-amber-500" },
    ai_config_incomplete: { Icon: Brain, color: "text-violet-500" },
    service_created: { Icon: Package, color: "text-teal-500" },
    general: { Icon: Bell, color: "text-gray-500" },
  };
  const { Icon, color } = map[type] || map.general;
  return <Icon className={cn(className, color)} />;
}

// ─── Relative time helper ──────────────────────────────────────────
function relativeTime(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AppLayout({
  children,
  fullHeight = false,
  hideAgentButton = false,
  lockedNav = false,
  onboardingMode = false,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { displayName, avatarUrl, user, profile, loading } = useUser();
  const notifPrefs = profile?.notification_prefs || null;
  // Filter out notification types the user has disabled
  const { notifications: allNotifs, unreadCount, markAsRead, markAllAsRead, deleteOne, loading: notifsLoading } =
    useNotifications(user?.id);

  // Notification types where only one instance should ever be visible.
  // Deduplicating at render-time cleans up any pre-existing DB duplicates without a migration.
  const SINGLETON_NOTIF_TYPES = new Set(["ai_config_incomplete"]);
  const dedupedNotifs = allNotifs.filter((n, idx, arr) => {
    if (!SINGLETON_NOTIF_TYPES.has(n.type)) return true;
    return arr.findIndex((x) => x.type === n.type) === idx; // keep only first (newest, array is sorted desc)
  });

  const notifications = notifPrefs
    ? dedupedNotifs.filter((n) => notifPrefs[n.type] !== false)
    : dedupedNotifs;

  // Count only the notifications that are actually visible in the panel
  // (respects dedup + notifPrefs filtering). Used for the panel header
  // badge and the "Mark all read" button — distinct from `unreadCount`
  // which counts raw allNotifs and drives the bell badge only.
  const visibleUnreadCount = notifications.filter((n) => !n.read).length;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Dropdown states
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchHighlight, setSearchHighlight] = useState(0);

  // Refs for click-outside
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const aiConfigNotifRef = useRef(false);
  // Snapshot the display name at logout-start so resetUserStore() can't change it to 'User'
  const logoutNameRef = useRef('');

  // ── Cross-tab logout: redirect when Supabase fires SIGNED_OUT on other tabs ──
  useEffect(() => {
    if (!loading && !user && !isLoggingOut) {
      router.replace("/login");
    }
  }, [user, loading, isLoggingOut, router]);

  // ── AI config check: notify if unconfigured, or auto-clear stale notification once configured ──
  useEffect(() => {
    if (!profile || !user) return;
    if (onboardingMode) return; // skip during onboarding — user may be in the process of setting up AI
    if (notifsLoading) return; // wait until existing notifications are fetched
    if (aiConfigNotifRef.current) return;
    aiConfigNotifRef.current = true; // guard immediately (synchronous) to prevent concurrent runs
    (async () => {
      try {
        const settings = await aiSettingsService.getAllSettings(user.id);
        const hasAiKey = settings?.some((s) => s.api_key_encrypted?.trim());

        if (hasAiKey) {
          // AI IS configured — silently purge any stale "AI not configured" notifications
          // (including any duplicates that may have slipped in).
          notificationService.deleteByType(user.id, "ai_config_incomplete").catch(() => {});
          return;
        }

        // AI is NOT configured — use createIfAbsent to prevent duplicates even when
        // multiple AppLayout instances race (React 18 concurrent rendering / navigation).
        notificationService.createIfAbsent(
          user.id, "ai_config_incomplete",
          "AI not configured",
          "Add an API key in Settings → AI Providers to start using AI features",
          { path: "/settings" }
        ).catch(() => { aiConfigNotifRef.current = false; });
      } catch {
        aiConfigNotifRef.current = false; // allow retry on error
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, user?.id, notifsLoading]);

  // ── Click-outside to close dropdowns ──
  useEffect(() => {
    function handleMouseDown(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // ── Keyboard shortcut Ctrl/Cmd+K → focus search ──
  useEffect(() => {
    function handleKeyDown(e) {
      if (!onboardingMode && (e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
        setProfileOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onboardingMode]);

  // ── Filtered pages for search ──
  const filteredPages = PAGES.filter((p) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const haystacks = [p.name, ...(p.searchTerms || [])];
    return haystacks.some((value) => value.toLowerCase().includes(query));
  });

  // ── Search keyboard navigation ──
  function handleSearchKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchHighlight((h) => Math.min(h + 1, filteredPages.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (filteredPages[searchHighlight]) {
        const p = filteredPages[searchHighlight];
        handleSearchSelect(p.path, p.external);
      }
    }
  }

  function handleSearchSelect(path, external = false) {
    if (external) {
      window.open(path, "_blank", "noopener,noreferrer");
    } else {
      router.push(path);
    }
    setSearchOpen(false);
    setSearchQuery("");
    setSearchHighlight(0);
    searchInputRef.current?.blur();
  }

  function openDocsFromProfile() {
    setProfileOpen(false);
    setSidebarOpen(false);
    window.open(DOCS_URL, "_blank", "noopener,noreferrer");
  }

  // ── Notification click ──
  async function handleNotifClick(notif) {
    if (!notif.read) await markAsRead(notif.id);
    if (notif.data?.path) router.push(notif.data.path);
  }

  // ── Logout ──
  const handleLogout = async () => {
    setProfileOpen(false);
    logoutNameRef.current = displayName || '';  // capture before resetUserStore clears it
    setIsLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    resetUserStore();
    localStorage.clear();
    try {
      await Promise.race([
        authService.signOut(),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    } catch { /* ignore */ }
    router.replace("/login");
  };

  // ── Nav items ──
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Calendar", path: "/calendar", icon: CalendarDays },
    { name: "Services", path: "/services", icon: Package },
    { name: "Bills", path: "/bills", icon: FileText },
    { name: "Ask AI", path: "/chat", icon: MessageSquare, tooltip: "Chat with YesBill AI" },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Settings", path: "/settings", icon: Settings },
    { name: "Support", path: "/support", icon: LifeBuoy },
  ];

  if (isLoggingOut) {
    return <AuthLoadingScreen type="logout" message="Signing you out safely..." userName={logoutNameRef.current} />;
  }

  return (
    <div className="relative min-h-screen font-sans selection:bg-primary/20 text-gray-900">
      <Background />

      {/* ═══════════════════════════════════════════════
          TOP NAVIGATION
      ═══════════════════════════════════════════════ */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm h-[72px] flex items-center">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 h-full flex items-center gap-3 w-full">

          {/* ── Left: Hamburger + Logo ── */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-700 hover:bg-gray-100 rounded-xl"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div
              className="flex items-center cursor-pointer"
              onClick={() => router.push("/dashboard")}
            >
              <img
                src={assetUrl("/assets/branding/yesbill_logo_black.png")}
                alt="YesBill"
                className="w-[110px] h-[110px] object-contain"
              />
            </div>
          </div>

          {/* ── Center: Search Bar ── */}
          {!onboardingMode && (
            <div className="flex-1 flex justify-center px-4">
              <div ref={searchRef} className="relative w-full max-w-2xl">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search pages… (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchOpen(true);
                      setSearchHighlight(0);
                    }}
                    onFocus={() => setSearchOpen(true)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100/80 hover:bg-gray-100 focus:bg-white border border-transparent focus:border-gray-200 rounded-xl outline-none transition-all placeholder:text-gray-400 text-gray-700"
                  />
                </div>

                {/* Search dropdown */}
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200/60 overflow-hidden z-50"
                    >
                      {filteredPages.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400">No pages found</div>
                      ) : (
                        filteredPages.map((page, i) => {
                          const Icon = page.icon;
                          return (
                            <button
                              key={page.path}
                              onMouseDown={() => handleSearchSelect(page.path, page.external)}
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                                i === searchHighlight
                                  ? "bg-primary/10 text-primary"
                                  : "text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              <Icon className="w-4 h-4 shrink-0 text-gray-400" />
                              <span className="font-medium">{page.name}</span>
                              {page.external && (
                                <ExternalLink className="w-3 h-3 ml-auto shrink-0 text-gray-300" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ── Right: Bell + Profile ── */}
          {!onboardingMode && <div className="flex items-center gap-2 shrink-0">

            {/* ── Bell / Notifications ── */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => {
                  const opening = !notifOpen;
                  setNotifOpen(opening);
                  setProfileOpen(false);
                  setSearchOpen(false);
                }}
                className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100/80 hover:text-gray-700 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {visibleUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1 ring-2 ring-white">
                    {visibleUnreadCount > 9 ? "9+" : visibleUnreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden z-50"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-800">Notifications</span>
                        {visibleUnreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {visibleUnreadCount}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={markAllAsRead}
                        disabled={visibleUnreadCount === 0}
                        className={cn(
                          "flex items-center gap-1 text-xs font-medium transition-colors",
                          visibleUnreadCount > 0
                            ? "text-primary hover:text-indigo-700 cursor-pointer"
                            : "text-gray-300 cursor-not-allowed"
                        )}
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    </div>

                    {/* List */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
                          <Bell className="w-8 h-8 text-gray-300" />
                          <p className="text-sm text-gray-400">No notifications yet</p>
                          <p className="text-xs text-gray-300">
                            You'll see bill alerts and updates here
                          </p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={cn(
                              "group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50",
                              !notif.read && "bg-primary/[0.03] border-l-2 border-primary"
                            )}
                          >
                            <div className="mt-0.5 shrink-0">
                              <NotifIcon type={notif.type} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-sm truncate",
                                notif.read ? "text-gray-600 font-normal" : "text-gray-800 font-semibold"
                              )}>
                                {notif.title}
                              </p>
                              {notif.message && (
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                                  {notif.message}
                                </p>
                              )}
                              <p className="text-[10px] text-gray-300 mt-1">
                                {relativeTime(notif.created_at)}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteOne(notif.id); }}
                              className="mt-0.5 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all shrink-0 flex-shrink-0"
                              aria-label="Dismiss notification"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="border-t border-gray-100 px-4 py-2.5 text-center">
                        <button
                          onClick={() => {
                            setNotifOpen(false);
                            router.push("/settings/notifications");
                          }}
                          className="text-xs text-gray-400 hover:text-primary transition-colors"
                        >
                          Manage notification preferences
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Profile dropdown ── */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                  setSearchOpen(false);
                }}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100/80 transition-colors group"
                aria-label="Profile menu"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 to-indigo-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-primary text-sm font-bold">
                      {(displayName || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Name */}
                <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown
                  className={cn(
                    "hidden lg:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200",
                    profileOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Profile dropdown panel */}
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden z-50"
                  >
                    {/* User info */}
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 to-indigo-100 border border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={displayName || "User"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-primary text-sm font-bold">
                            {(displayName || "U").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user?.email || ""}
                        </p>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          router.push("/settings");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-left"
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          router.push("/support");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-left"
                      >
                        <LifeBuoy className="w-4 h-4 text-gray-400" />
                        Support
                      </button>
                      <button
                        onClick={openDocsFromProfile}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-left"
                      >
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        Docs
                        <ExternalLink className="w-3.5 h-3.5 ml-auto text-gray-300" />
                      </button>
                    </div>

                    <div className="p-1.5 border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════
          SIDEBAR — Desktop
      ═══════════════════════════════════════════════ */}
      <aside className="hidden md:block fixed left-0 top-[72px] w-64 h-[calc(100vh-72px)] bg-white/60 backdrop-blur-xl border-r border-gray-200/50 shadow-lg z-40">
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
            const itemContent = (
              <motion.span
                whileHover={lockedNav ? {} : { x: 8, scale: 1.02 }}
                whileTap={lockedNav ? {} : { scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-colors relative group overflow-hidden",
                  lockedNav
                    ? "text-gray-400 opacity-60 cursor-not-allowed"
                    : isActive
                    ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/20"
                    : "text-gray-700 hover:bg-gray-100/80"
                )}
              >
                {isActive && !lockedNav && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-600 rounded-xl -z-[0]"
                    transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3 flex-1">
                  <Icon className={cn("w-5 h-5 shrink-0", lockedNav ? "text-gray-400" : isActive ? "text-white" : "text-gray-500 group-hover:text-primary")} />
                  <span>{item.name}</span>
                </span>
                {lockedNav && <Lock className="w-3.5 h-3.5 text-gray-400 relative z-10 flex-shrink-0" />}
                {!lockedNav && !isActive && (
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                )}
              </motion.span>
            );
            return lockedNav ? (
              <span key={item.path} className="block" title="Complete setup to unlock navigation">{itemContent}</span>
            ) : (
              <WithTooltip key={item.path} tip={item.tooltip || ""} side="right">
                <Link href={item.path} className="block">{itemContent}</Link>
              </WithTooltip>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/50 bg-white/40 backdrop-blur-sm">
          <motion.div
            whileHover={{ x: 4, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </motion.div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          SIDEBAR — Mobile
      ═══════════════════════════════════════════════ */}
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="md:hidden fixed left-0 top-[72px] w-64 h-[calc(100vh-72px)] bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-2xl z-40"
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
              const mobileItemContent = (
                <motion.span
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 400, damping: 25 }}
                  whileTap={lockedNav ? {} : { scale: 0.96 }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-colors",
                    lockedNav
                      ? "text-gray-400 opacity-60 cursor-not-allowed"
                      : isActive
                      ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/20"
                      : "text-gray-700 hover:bg-gray-100/80"
                  )}
                >
                  <Icon className="w-5 h-5 flex-1" />
                  <span className="flex-1">{item.name}</span>
                  {lockedNav && <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                </motion.span>
              );
              return lockedNav ? (
                <span key={item.path} className="block" title="Complete setup to unlock navigation">{mobileItemContent}</span>
              ) : (
                <Link key={item.path} href={item.path} onClick={() => setSidebarOpen(false)} className="block">
                  {mobileItemContent}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/50 bg-white/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileTap={{ scale: 0.96 }}
            >
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </motion.div>
          </div>
        </motion.aside>
      )}

      {/* ═══════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════ */}
      <main className={cn(
        "md:ml-64 pt-[72px]",
        fullHeight
          ? "h-screen overflow-hidden pb-[53px]"
          : "min-h-screen overflow-y-auto pb-[65px]"
      )}>
        {!fullHeight && <ServiceExpiryBanner userId={user?.id} />}
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className={cn(fullHeight && "h-full")}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <footer className="fixed bottom-0 left-0 md:left-64 right-0 z-30 border-t border-gray-200/50 bg-white/80 backdrop-blur-xl shadow-[0_-1px_0_0_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-row justify-between items-center gap-2">
            <p className="text-sm text-gray-500 hidden md:block">© 2026 YesBill. All rights reserved.</p>
            {!onboardingMode && (
              <div className="flex items-center gap-5 text-sm text-gray-500">
                <Link href="/privacy" className="hover:text-primary transition-colors hidden md:block">Privacy</Link>
                <Link href="/terms" className="hover:text-primary transition-colors hidden md:block">Terms</Link>
                <Link href="/contact" className="hover:text-primary transition-colors hidden md:block">Support</Link>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════
          FLOATING AI ASSISTANT BUTTON (fixed, bottom-right)
          Rendered outside footer to avoid overlap
      ═══════════════════════════════════════════════ */}
      {!hideAgentButton && <AgentButton />}
    </div>
  );
}
