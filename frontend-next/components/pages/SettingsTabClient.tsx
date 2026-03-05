// @ts-nocheck
'use client'
import { useRouter, useParams } from 'next/navigation';
import { assetUrl } from "@/lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Key,
  Lock,
  CreditCard,
  Bell,
  Moon,
  Eye,
  EyeOff,
  Save,
  Sparkles,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building,
  Upload,
  Loader2,
  Flag,
  ChevronDown,
  Pencil,
  X,
  XCircle,
  Camera,
  ExternalLink,
  Calendar,
  ImagePlus,
  AlertCircle,
  CheckCircle2,
  FileText,
  ChevronUp,
  Brain,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Zap,
  Trash2,
  Info,
  Check,
  LogOut,
  Monitor,
  Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WithTooltip } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/components/ui/toaster-custom";
import { useUser } from "@/hooks/useUser";
import { profileService } from "@/services/profileService";
import { authService } from "@/services/authService";
import { authAPI, generatedBillsAPI } from "@/services/api";
import { servicesService } from "@/services/dataService";
import PasswordStrengthBar, { getPasswordStrength } from "@/components/ui/PasswordStrengthBar";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { aiSettingsService } from "@/services/aiSettingsService";
import AppLoadingScreen from "@/components/loading/AppLoadingScreen";
import { usePageReady } from "@/hooks/usePageReady";
import { COUNTRY_TIMEZONE } from "@/lib/timezone";
import { COUNTRIES } from "@/lib/countries";

const EFFORT_OPTIONS = [
  { value: "none", label: "None (Fastest)" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "Max" },
];

function ReasoningEffortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = EFFORT_OPTIONS.find((o) => o.value === value) || EFFORT_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 border border-violet-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white hover:border-violet-400 hover:bg-violet-50/50 transition-all cursor-pointer min-w-[150px] justify-between"
      >
        <div className="flex items-center gap-1.5">
          <Brain className="w-4 h-4 text-violet-500 flex-shrink-0" />
          <span className="font-medium">{current.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 bottom-full mb-1.5 z-50 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-[170px]"
          >
            {EFFORT_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${o.value === value
                  ? "bg-violet-50 text-violet-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <Brain className={`w-3.5 h-3.5 flex-shrink-0 ${o.value === value ? "text-violet-500" : "text-gray-300"}`} />
                <span className="flex-1">{o.label}</span>
                {o.value === value && <Check className="w-3.5 h-3.5 text-violet-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const { user, profile, displayName, fullName, email: userEmail, avatarUrl, coverImageUrl, loading, profileLoading, refreshProfile } = useUser();
  const { tab: urlTab } = useParams();
  const router = useRouter();

  // Reliable user ID / email — reads from hook or localStorage (synchronous, no locks)
  const resolveUserId = () => user?.id || localStorage.getItem('user_id') || null;
  const resolvedEmail = userEmail || localStorage.getItem('user_email') || '';

  const validTabs = ['profile', 'ai', 'notifications', 'security'];
  const [activeTab, setActiveTab] = useState(() => {
    if (urlTab && validTabs.includes(urlTab)) return urlTab;
    return 'profile';
  });

  // Sync activeTab with URL param changes
  useEffect(() => {
    if (urlTab && validTabs.includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    } else if (!urlTab && activeTab !== 'profile') {
      // /settings with no tab ? default to profile
      setActiveTab('profile');
    }
  }, [urlTab]);

  // Navigate when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    router.replace(`/settings/${tabId}`);
  };
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState(null);
  const [pendingCoverFile, setPendingCoverFile] = useState(null);
  const [pendingCoverPreview, setPendingCoverPreview] = useState(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [coverBroken, setCoverBroken] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});

  // Reset broken state when URLs change
  useEffect(() => { setAvatarBroken(false); }, [avatarUrl]);
  useEffect(() => { setCoverBroken(false); }, [coverImageUrl]);

  // Initialize profileData from cached profile immediately (not in an effect)
  // so the form has data from the very first render
  const [profileReady, setProfileReady] = useState(() => !!profile && !!profile.full_name);

  const [profileData, setProfileData] = useState(() => {
    if (profile) {
      return {
        full_name: profile.full_name || '',
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        company: profile.company || '',
        website: profile.website || '',
        location: profile.location || '',
        bio: profile.bio || '',
        country: profile.country || '',
        country_code: profile.country_code || '',
        currency: profile.currency || '',
        currency_code: profile.currency_code || '',
        timezone: profile.timezone || ''
      };
    }
    return {
      full_name: '',
      display_name: '',
      phone: '',
      company: '',
      website: '',
      location: '',
      bio: '',
      country: '',
      country_code: '',
      currency: '',
      currency_code: '',
      timezone: ''
    };
  });

  // Safety: force profileReady after 2.5s so the form never gets stuck loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setProfileReady(prev => {
        if (!prev) console.warn('Settings: Profile load timeout — showing form with available data');
        return true;
      });
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const countries = COUNTRIES;

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef(null);

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };
    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCountryDropdown]);

  // Track whether profile data has been loaded from DB for the form
  const profileDataLoadedRef = useRef(false);

  // Helper to populate profileData from a profile object
  const applyProfileToForm = useCallback((data) => {
    if (!data) return;
    setProfileData({
      full_name: data.full_name || '',
      display_name: data.display_name || '',
      phone: data.phone || '',
      company: data.company || '',
      website: data.website || '',
      location: data.location || '',
      bio: data.bio || '',
      country: data.country || '',
      country_code: data.country_code || '',
      currency: data.currency || '',
      currency_code: data.currency_code || '',
      timezone: data.timezone || ''
    });
    setProfileReady(true);
    profileDataLoadedRef.current = true;
  }, []);

  // Populate form whenever the shared profile updates
  useEffect(() => {
    if (profile) {
      applyProfileToForm(profile);
    } else if (user && !profileLoading && !profileDataLoadedRef.current) {
      // No profile record exists — use auth metadata as fallback
      setProfileData(prev => ({
        ...prev,
        full_name: prev.full_name || fullName || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '',
        display_name: prev.display_name || displayName || '',
      }));
      setProfileReady(true);
    }
  }, [profile, user, profileLoading, fullName, displayName, applyProfileToForm]);

  // Force a fresh DB fetch on mount AND when the tab regains visibility
  useEffect(() => {
    let cancelled = false;

    const fetchFresh = async (attempt = 1) => {
      try {
        if (cancelled) return;

        // Resolve user ID synchronously — no getSession() calls
        const userId = user?.id || localStorage.getItem('user_id');
        if (!userId) {
          // Still no user — will retry when user becomes available via dependency change
          if (attempt === 1) console.warn('Settings: No user ID available yet, will retry when available');
          return;
        }

        // Query directly — the Supabase client attaches auth headers
        // automatically. No need for ensureSession() which can hang
        // due to navigator.locks contention.
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error('Settings: Profile fetch error:', error.message);
          // If it's an auth error, try once more after a short delay
          if ((error.message?.includes('JWT') || error.message?.includes('token')) && attempt < 3) {
            const delay = Math.min(attempt * 500, 2000);
            console.warn(`Settings: Auth error, retrying in ${delay}ms (attempt ${attempt})...`);
            setTimeout(() => { if (!cancelled) fetchFresh(attempt + 1); }, delay);
            return;
          }
          setProfileReady(true);
          return;
        }

        if (data) {
          console.log('Settings: Fresh profile loaded from DB:', Object.keys(data).filter(k => data[k]).join(', '));
          applyProfileToForm(data);
        } else {
          console.warn('Settings: No profile found in DB for user', userId);
          setProfileReady(true);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Settings: Fresh profile fetch failed:', err);
        setProfileReady(true);
      }
    };

    // Fetch immediately
    fetchFresh(1);

    // Also re-fetch when the browser tab regains visibility (user switched tabs)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !cancelled) {
        fetchFresh(1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => { cancelled = true; document.removeEventListener('visibilitychange', handleVisibility); };
  }, [user?.id, applyProfileToForm]);

  // Auto-set country code, currency, and timezone when country changes
  const handleCountryChange = (countryName) => {
    const selected = countries.find(c => c.name === countryName);
    const timezone = COUNTRY_TIMEZONE[countryName] || '';
    setProfileData(prev => ({
      ...prev,
      country: countryName,
      country_code: selected?.code || prev.country_code,
      currency: selected?.currency || prev.currency,
      currency_code: selected?.currencySymbol || prev.currency_code,
      timezone
    }));
    setShowCountryDropdown(false);
  };

  const DEFAULT_NOTIF_PREFS = {
    bill_due_soon: true,
    bill_overdue: true,
    payment_recorded: true,
    budget_exceeded: true,
    bill_added: true,
    bill_auto_generated: true,
    bill_auto_warning: true,
    service_created: true,
    service_updated: true,
    email_verification: true,
    general: true,
  };
  const [notifPrefs, setNotifPrefs] = useState(DEFAULT_NOTIF_PREFS);
  const [notifSaving, setNotifSaving] = useState(false);

  // -- AI Settings State (fetched from Supabase) --
  const [aiProviders, setAiProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [aiSettings, setAiSettings] = useState({});
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiSelectedModel, setAiSelectedModel] = useState('');
  const [aiEnableInsights, setAiEnableInsights] = useState(true);
  const [aiDefaultReasoningEffort, setAiDefaultReasoningEffort] = useState('none');
  const [aiKeyValidation, setAiKeyValidation] = useState({ status: 'idle', message: '' }); // idle | checking | valid | invalid | error
  const [aiLoading, setAiLoading] = useState(true);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiValidating, setAiValidating] = useState(false);
  const [aiKeyTouched, setAiKeyTouched] = useState(false);
  const [aiHasExistingKey, setAiHasExistingKey] = useState(false);
  const [modelProbeMap, setModelProbeMap] = useState({}); // { provider: { modelId: { status, message } } }
  const [probingModels, setProbingModels] = useState(false);

  // -- Security tab state ----------------------------------------------
  const [secCurrentPassword, setSecCurrentPassword] = useState('');
  const [secNewPassword, setSecNewPassword] = useState('');
  const [secConfirmPassword, setSecConfirmPassword] = useState('');
  const [secShowCurrent, setSecShowCurrent] = useState(false);
  const [secShowNew, setSecShowNew] = useState(false);
  const [secShowConfirm, setSecShowConfirm] = useState(false);
  const [secPasswordLoading, setSecPasswordLoading] = useState(false);
  const [secNewEmail, setSecNewEmail] = useState('');
  const [secEmailLoading, setSecEmailLoading] = useState(false);
  const [secEmailMsg, setSecEmailMsg] = useState({ type: '', text: '' });
  const [identities, setIdentities] = useState([]);
  const [lastSignIn, setLastSignIn] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [accountDataLoading, setAccountDataLoading] = useState(false);
  const [accountServices, setAccountServices] = useState([]);
  const [accountBillsCount, setAccountBillsCount] = useState(0);

  // Load identities + session info when Security tab is activated
  useEffect(() => {
    if (activeTab !== 'security') return;
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u?.identities) setIdentities(u.identities);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user?.last_sign_in_at) setLastSignIn(s.user.last_sign_in_at);
    });
  }, [activeTab]);

  // Pre-fetch account data (services + bills) for the delete modal — runs on mount
  useEffect(() => {
    let cancelled = false;
    const fetchAccountData = async () => {
      setAccountDataLoading(true);
      try {
        const [servicesData, billsRes] = await Promise.all([
          servicesService.getAll(),
          generatedBillsAPI.list(),
        ]);
        if (cancelled) return;
        setAccountServices(servicesData || []);
        setAccountBillsCount((billsRes?.data || []).length);
      } catch {
        // Non-fatal — modal still works without counts
      } finally {
        if (!cancelled) setAccountDataLoading(false);
      }
    };
    fetchAccountData();
    return () => { cancelled = true; };
  }, []);

  const secPasswordStrength = getPasswordStrength(secNewPassword);
  const secPasswordsMatch = secConfirmPassword.length > 0 && secNewPassword === secConfirmPassword;
  const secPasswordsMismatch = secConfirmPassword.length > 0 && secNewPassword !== secConfirmPassword;
  const hasPasswordIdentity = identities.some((id) => id.provider === 'email');

  const handleChangePassword = async () => {
    if (hasPasswordIdentity && !secCurrentPassword) {
      toast({ title: 'Current password required', description: 'Please enter your current password.', type: 'error' });
      return;
    }
    if (hasPasswordIdentity && secCurrentPassword === secNewPassword) {
      toast({ title: 'Same password', description: 'New password must be different from your current password.', type: 'error' });
      return;
    }
    const hasLower = /[a-z]/.test(secNewPassword);
    const hasUpper = /[A-Z]/.test(secNewPassword);
    const hasDigit = /[0-9]/.test(secNewPassword);
    const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./~`]/.test(secNewPassword);
    if (!hasLower || !hasUpper || !hasDigit || !hasSymbol) {
      const missing = [];
      if (!hasLower) missing.push('lowercase letter');
      if (!hasUpper) missing.push('uppercase letter');
      if (!hasDigit) missing.push('number');
      if (!hasSymbol) missing.push('symbol');
      toast({ title: "Password doesn't meet requirements", description: `Missing: ${missing.join(', ')}`, type: 'error' });
      return;
    }
    if (secNewPassword !== secConfirmPassword) {
      toast({ title: "Passwords don't match", type: 'error' });
      return;
    }
    setSecPasswordLoading(true);
    try {
      if (hasPasswordIdentity) {
        await authService.verifyPassword(resolvedEmail, secCurrentPassword);
      }
      await authService.updatePassword(secNewPassword);
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.', type: 'success' });
      setSecCurrentPassword('');
      setSecNewPassword('');
      setSecConfirmPassword('');
      // Reload identities so the form adapts (SSO user now has email identity)
      supabase.auth.getUser().then(({ data: { user: u } }) => {
        if (u?.identities) setIdentities(u.identities);
      });
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
        toast({ title: 'Incorrect current password', description: 'Please check your current password and try again.', type: 'error' });
      } else {
        toast({ title: 'Failed to update password', description: msg || 'Please try again.', type: 'error' });
      }
    } finally {
      setSecPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleteLoading(true);
    try {
      try { await supabase.functions.invoke('notify-account-deleted'); } catch (_) { /* silent */ }
      await authAPI.deleteAccount();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      toast({ title: 'Deletion failed', description: err.message || 'Please try again.', type: 'error' });
      setDeleteLoading(false);
    }
  };

  const formatLastSignIn = (iso) => {
    if (!iso) return 'Unknown';
    const d = new Date(iso);
    return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
    return 'Browser';
  };

  const getOSName = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown OS';
  };

  // Page-level loading gate (shows branded loading screen briefly)
  const pageReady = usePageReady(500, !loading);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "ai", label: "AI Configuration", icon: Brain },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: ShieldCheck },
  ];

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 5MB', type: 'error' });
      return;
    }
    const userId = resolveUserId();
    if (!userId) {
      toast({ title: 'Error', description: 'User session not found. Please refresh the page.', type: 'error' });
      return;
    }

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(file);
    setPendingAvatarPreview(previewUrl);
    setPendingAvatarFile(file);

    // Upload directly to Supabase
    setUploading(true);
    try {
      await profileService.uploadAvatar(userId, file);
      await refreshProfile();
      toast({ title: 'Photo updated', description: 'Your profile picture has been saved.', type: 'success' });
      // Clean up local preview since DB avatar is now live
      URL.revokeObjectURL(previewUrl);
      setPendingAvatarPreview(null);
      setPendingAvatarFile(null);
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({ title: 'Upload failed', description: error.message || 'Could not upload avatar.', type: 'error' });
      // Keep local preview so user can see what they tried
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', type: 'error' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 10MB', type: 'error' });
      return;
    }
    const userId = resolveUserId();
    if (!userId) {
      toast({ title: 'Error', description: 'User session not found. Please refresh the page.', type: 'error' });
      return;
    }

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(file);
    setPendingCoverPreview(previewUrl);
    setPendingCoverFile(file);

    // Upload directly to Supabase
    setUploading(true);
    try {
      await profileService.uploadCoverImage(userId, file);
      await refreshProfile();
      toast({ title: 'Cover updated', description: 'Your cover image has been saved.', type: 'success' });
      URL.revokeObjectURL(previewUrl);
      setPendingCoverPreview(null);
      setPendingCoverFile(null);
    } catch (error) {
      console.error('Cover upload error:', error);
      toast({ title: 'Upload failed', description: error.message || 'Could not upload cover image.', type: 'error' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // -- Field Validation --
  const validateField = (name, value) => {
    switch (name) {
      case 'full_name':
        if (!value || !value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.trim().length > 100) return 'Name must be under 100 characters';
        return null;
      case 'display_name':
        if (value && value.trim().length > 50) return 'Display name must be under 50 characters';
        return null;
      case 'phone':
        if (value && !/^\d{0,15}$/.test(value)) return 'Phone must contain only digits';
        if (value && value.length < 7) return 'Phone number is too short';
        return null;
      case 'website':
        if (value && value.trim() && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}([\/\w.-]*)*$/i.test(value.trim()))
          return 'Enter a valid website URL';
        return null;
      case 'bio':
        if (value && value.length > 500) return 'Bio must be under 500 characters';
        return null;
      case 'company':
        if (value && value.trim().length > 100) return 'Company name must be under 100 characters';
        return null;
      case 'location':
        if (value && value.trim().length > 100) return 'Location must be under 100 characters';
        return null;
      default:
        return null;
    }
  };

  const handleFieldChange = (name, value) => {
    setProfileData(prev => ({ ...prev, [name]: value }));
    if (fieldTouched[name]) {
      const error = validateField(name, value);
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleFieldBlur = (name) => {
    setFieldTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, profileData[name]);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAllFields = () => {
    const errors = {};
    const fieldsToValidate = ['full_name', 'display_name', 'phone', 'website', 'bio', 'company', 'location'];
    fieldsToValidate.forEach(name => {
      const error = validateField(name, profileData[name]);
      if (error) errors[name] = error;
    });
    setFieldErrors(errors);
    setFieldTouched(fieldsToValidate.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    return Object.keys(errors).length === 0;
  };

  const getFieldStatus = (name) => {
    if (!fieldTouched[name]) return 'idle';
    if (fieldErrors[name]) return 'error';
    return 'valid';
  };

  const handleSaveProfile = async () => {
    if (!validateAllFields()) {
      toast({ title: 'Validation Error', description: 'Please fix the errors before saving.', type: 'error' });
      return;
    }

    const userId = resolveUserId();
    if (!userId) {
      toast({ title: 'Error', description: 'User session not found. Please refresh the page.', type: 'error' });
      return;
    }

    setSaving(true);

    try {
      const result = await profileService.updateProfile(userId, profileData);

      // Verify the save actually persisted data
      if (!result) {
        throw new Error('Profile save returned no data. Please try again.');
      }

      // Refresh the shared profile store so all components update
      await refreshProfile();

      // Exit edit mode back to preview
      setIsEditingProfile(false);

      toast({ title: 'Profile updated', description: 'Your changes have been saved successfully', type: 'success' });
    } catch (error) {
      console.error('Profile update error:', error);
      const description = error.message?.includes('session')
        ? 'Session expired. Please refresh the page and try again.'
        : error.message || 'Could not update profile';
      toast({ title: 'Update failed', description, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Revert profileData to the current DB profile
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        company: profile.company || '',
        website: profile.website || '',
        location: profile.location || '',
        bio: profile.bio || '',
        country: profile.country || '',
        country_code: profile.country_code || '',
        currency: profile.currency || '',
        currency_code: profile.currency_code || '',
        timezone: profile.timezone || ''
      });
    }
    // Clean up pending previews
    if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
    if (pendingCoverPreview) URL.revokeObjectURL(pendingCoverPreview);
    setPendingAvatarFile(null);
    setPendingAvatarPreview(null);
    setPendingCoverFile(null);
    setPendingCoverPreview(null);
    setFieldErrors({});
    setFieldTouched({});
    setIsEditingProfile(false);
  };

  // -- Load notification prefs from profile when profile is ready --
  useEffect(() => {
    if (profile?.notification_prefs) {
      setNotifPrefs((prev) => ({ ...prev, ...profile.notification_prefs }));
    }
  }, [profile?.notification_prefs]);

  // -- Save notification prefs to Supabase --
  const handleSaveNotifications = async () => {
    const userId = resolveUserId();
    if (!userId) {
      toast({ title: 'Error', description: 'User session not found. Please refresh.', type: 'error' });
      return;
    }
    setNotifSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ notification_prefs: notifPrefs, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      await refreshProfile();
      toast({ title: 'Preferences saved', description: 'Your notification settings have been updated.', type: 'success' });
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, type: 'error' });
    } finally {
      setNotifSaving(false);
    }
  };

  // -- AI Settings: Fetch providers + user settings from DB --
  useEffect(() => {
    let cancelled = false;
    const loadAIData = async () => {
      setAiLoading(true);
      try {
        // Load providers (backend or fallback)
        const providers = await aiSettingsService.getProviders();
        if (!cancelled) setAiProviders(providers);

        // Load user's saved settings from Supabase
        const userId = resolveUserId();
        if (userId) {
          const allSettings = await aiSettingsService.getAllSettings(userId);
          if (!cancelled && allSettings.length > 0) {
            // Index by provider
            const settingsMap = {};
            allSettings.forEach(s => { settingsMap[s.provider] = s; });
            setAiSettings(settingsMap);

            // Auto-select the most recently saved provider (not hardcoded 'openai')
            const latestEntry = allSettings
              .slice()
              .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
            const initialProvider = latestEntry?.provider || selectedProvider;
            if (!cancelled) setSelectedProvider(initialProvider);

            // Apply the selected provider's settings
            const current = settingsMap[initialProvider];
            if (current) {
              setAiApiKey(current.api_key_encrypted || '');
              setAiSelectedModel(current.selected_model || '');
              setAiEnableInsights(current.enable_insights ?? true);
              setAiDefaultReasoningEffort(current.default_reasoning_effort || 'none');
              setAiHasExistingKey(!!current.api_key_encrypted);
              setAiKeyValidation({
                status: current.is_key_valid ? 'valid' : 'idle',
                message: current.is_key_valid ? 'Key verified and active' : '',
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load AI settings:', err);
      } finally {
        if (!cancelled) setAiLoading(false);
      }

      // Background probe for all configured providers (silent, best-effort)
      try {
        const probe = await aiSettingsService.probeModels(null, false); // no force, use cache
        if (!cancelled && probe?.providers) {
          const map = {};
          for (const p of probe.providers) {
            map[p.provider] = {};
            for (const m of (p.models || [])) {
              map[p.provider][m.id] = { status: m.availability_status, message: m.availability_message };
            }
          }
          setModelProbeMap(map);
        }
      } catch {
        // probe failures are non-critical
      }
    };
    loadAIData();
    return () => { cancelled = true; };
  }, [user?.id]);

  // When provider selection changes, update form from cached settings
  useEffect(() => {
    const current = aiSettings[selectedProvider];
    if (current) {
      setAiApiKey(current.api_key_encrypted || '');
      setAiSelectedModel(current.selected_model || '');
      setAiEnableInsights(current.enable_insights ?? true);
      setAiDefaultReasoningEffort(current.default_reasoning_effort || 'none');
      setAiHasExistingKey(!!current.api_key_encrypted);
      setAiKeyValidation({
        status: current.is_key_valid ? 'valid' : 'idle',
        message: current.is_key_valid ? 'Key verified and active' : '',
      });
    } else {
      setAiApiKey('');
      setAiSelectedModel('');
      setAiEnableInsights(true);
      setAiDefaultReasoningEffort('none');
      setAiHasExistingKey(false);
      setAiKeyValidation({ status: 'idle', message: '' });
    }
    setShowApiKey(false);
    setAiKeyTouched(false);
  }, [selectedProvider, aiSettings]);

  // Get the currently selected provider's models
  const currentProviderInfo = aiProviders.find(p => p.id === selectedProvider) || aiProviders[0];
  const currentModels = (currentProviderInfo?.models || []).filter((m) => !m.is_deprecated);

  // Set default model if none selected or selected model is no longer valid
  useEffect(() => {
    if (currentModels.length === 0) return;
    const selectedStillVisible = currentModels.some((m) => m.id === aiSelectedModel);
    if (!aiSelectedModel || !selectedStillVisible) {
      const recommended = currentModels.find(m => m.recommended);
      setAiSelectedModel(recommended?.id || currentModels[0].id);
    }
  }, [currentModels, aiSelectedModel]);

  // -- AI Key Format Validation (on change) --
  const handleAiKeyChange = (value) => {
    setAiApiKey(value);
    setAiKeyTouched(true);
    // Real-time format validation
    if (!value.trim()) {
      setAiKeyValidation({ status: 'idle', message: '' });
    } else {
      const result = aiSettingsService.formatValidateKey(selectedProvider, value);
      setAiKeyValidation({
        status: result.valid ? 'idle' : 'invalid',
        message: result.message,
      });
    }
  };

  // -- Validate API Key (live test via backend) --
  const handleValidateKey = async () => {
    if (!aiApiKey.trim()) {
      setAiKeyValidation({ status: 'invalid', message: 'Please enter an API key first' });
      return;
    }
    setAiValidating(true);
    setAiKeyValidation({ status: 'checking', message: 'Validating...' });
    try {
      const result = await aiSettingsService.validateKey(selectedProvider, aiApiKey);
      setAiKeyValidation({
        status: result.valid ? 'valid' : 'invalid',
        message: result.message,
      });
      // Update cached settings
      if (result.valid && aiSettings[selectedProvider]) {
        setAiSettings(prev => ({
          ...prev,
          [selectedProvider]: { ...prev[selectedProvider], is_key_valid: true },
        }));
      }
    } catch (err) {
      setAiKeyValidation({ status: 'error', message: 'Validation failed. Try again.' });
    } finally {
      setAiValidating(false);
    }
  };

  // -- Save AI Settings to Supabase --
  const handleSaveAISettings = async () => {
    const userId = resolveUserId();
    if (!userId) {
      toast({ title: 'Error', description: 'User session not found. Please refresh.', type: 'error' });
      return;
    }
    if (!aiApiKey.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter an API key', type: 'error' });
      return;
    }

    // Format check before saving
    const formatCheck = aiSettingsService.formatValidateKey(selectedProvider, aiApiKey);
    if (!formatCheck.valid) {
      toast({ title: 'Invalid Key Format', description: formatCheck.message, type: 'error' });
      return;
    }

    setAiSaving(true);
    try {
      const saved = await aiSettingsService.saveSettings(userId, {
        provider: selectedProvider,
        api_key_encrypted: aiApiKey,
        selected_model: aiSelectedModel,
        enable_insights: aiEnableInsights,
        default_reasoning_effort: aiDefaultReasoningEffort,
        is_key_valid: aiKeyValidation.status === 'valid',
      });

      // Update local cache immediately (for instant UI feedback)
      setAiSettings(prev => ({ ...prev, [selectedProvider]: saved }));
      setAiHasExistingKey(true);

      // Re-fetch all settings from DB to ensure full sync (covers model/provider changes)
      if (userId) {
        const freshSettings = await aiSettingsService.getAllSettings(userId);
        if (freshSettings.length > 0) {
          const settingsMap = {};
          freshSettings.forEach(s => { settingsMap[s.provider] = s; });
          setAiSettings(settingsMap);
        }
      }

      // Probe model availability immediately after save
      try {
        const probe = await aiSettingsService.probeModels(selectedProvider, true);
        const providerProbe = (probe?.providers || []).find((p) => p.provider === selectedProvider);
        const selectedProbe = (providerProbe?.models || []).find((m) => m.id === aiSelectedModel);
        if (selectedProbe?.availability_status === 'available') {
          setAiKeyValidation({ status: 'valid', message: 'Model access verified successfully.' });
        } else if (selectedProbe) {
          setAiKeyValidation({
            status: 'invalid',
            message: selectedProbe.availability_message || 'Selected model is unavailable. Please choose another model.',
          });
        }
        // Update probe map for the provider
        if (providerProbe?.models) {
          const provMap = {};
          for (const m of providerProbe.models) {
            provMap[m.id] = { status: m.availability_status, message: m.availability_message };
          }
          setModelProbeMap(prev => ({ ...prev, [selectedProvider]: provMap }));
        }
      } catch (probeErr) {
        console.warn('Model probe after save failed:', probeErr);
      }

      toast({ title: 'AI Settings Saved', description: `${currentProviderInfo?.name || 'Provider'} configuration saved successfully`, type: 'success' });
    } catch (err) {
      console.error('Save AI settings error:', err);
      toast({ title: 'Save Failed', description: err.message || 'Could not save AI settings', type: 'error' });
    } finally {
      setAiSaving(false);
    }
  };

  // -- Delete AI Settings --
  const handleDeleteAISettings = async () => {
    const userId = resolveUserId();
    if (!userId) return;
    try {
      await aiSettingsService.deleteSettings(userId, selectedProvider);
      setAiSettings(prev => {
        const updated = { ...prev };
        delete updated[selectedProvider];
        return updated;
      });
      setAiApiKey('');
      setAiSelectedModel('');
      setAiEnableInsights(true);
      setAiHasExistingKey(false);
      setAiKeyValidation({ status: 'idle', message: '' });
      toast({ title: 'Removed', description: `${currentProviderInfo?.name} configuration removed`, type: 'success' });
    } catch (err) {
      toast({ title: 'Error', description: 'Could not remove settings', type: 'error' });
    }
  };

  const handleTestModelAvailability = async () => {
    if (probingModels) return;
    setProbingModels(true);
    try {
      const probe = await aiSettingsService.probeModels(selectedProvider, true);
      const providerProbe = (probe?.providers || []).find((p) => p.provider === selectedProvider);
      if (providerProbe?.models) {
        const provMap = {};
        for (const m of providerProbe.models) {
          provMap[m.id] = { status: m.availability_status, message: m.availability_message };
        }
        setModelProbeMap(prev => ({ ...prev, [selectedProvider]: provMap }));
        toast({ title: 'Model check complete', description: 'Model availability updated.', type: 'success' });
      }
    } catch {
      toast({ title: 'Test failed', description: 'Could not check model availability.', type: 'error' });
    } finally {
      setProbingModels(false);
    }
  };

  // Key validation status badge helper
  const getKeyStatusIcon = () => {
    switch (aiKeyValidation.status) {
      case 'valid': return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case 'invalid': return <ShieldX className="w-5 h-5 text-red-500" />;
      case 'checking': return <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />;
      case 'error': return <ShieldAlert className="w-5 h-5 text-amber-500" />;
      default: return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  // Provider icons - OpenAI uses inline SVG, Anthropic & Google use image files
  const ProviderIcon = ({ providerId, size = 32 }) => {
    switch (providerId) {
      case 'openai':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.047 6.047 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" fill="#000000" />
          </svg>
        );
      case 'anthropic':
        return <img src={assetUrl("/assets/icons/anthropic.png")} alt="Anthropic" width={size} height={size} className="object-contain" />;
      case 'google':
        return <img src={assetUrl("/assets/icons/google-ai.png")} alt="Google AI" width={size} height={size} className="object-contain" />;
      default:
        return <Brain className="text-indigo-500" style={{ width: size, height: size }} />;
    }
  };

  const getKeyStatusColor = () => {
    switch (aiKeyValidation.status) {
      case 'valid': return 'border-green-300 bg-green-50/30';
      case 'invalid': return 'border-red-300 bg-red-50/30';
      case 'checking': return 'border-indigo-300 bg-indigo-50/30';
      case 'error': return 'border-amber-300 bg-amber-50/30';
      default: return 'border-gray-300';
    }
  };

  return (
    <AppLayout>
      <AnimatePresence>
        {!pageReady && <AppLoadingScreen key="loading" pageName="Settings" pageType="settings" />}
      </AnimatePresence>
      {!profileReady ? (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="w-36 h-9 mb-3 rounded-lg" />
            <Skeleton className="w-56 h-5 rounded" />
          </div>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white/80 rounded-2xl p-2 space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="w-full h-12 rounded-xl" />)}
              </div>
            </div>
            <div className="flex-1 bg-white/80 rounded-3xl p-8 space-y-6">
              <Skeleton className="w-48 h-7 rounded-lg" />
              <Skeleton className="w-72 h-5 rounded" />
              <div className="flex items-center gap-6">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="space-y-2"><Skeleton className="w-32 h-5 rounded" /><Skeleton className="w-48 h-4 rounded" /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-full h-14 rounded-xl" />)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
                Settings
              </span>
            </h1>
            <p className="text-gray-500 text-lg">
              Manage your account and preferences
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Tabs */}
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

            {/* Content Area */}
            <motion.main
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 min-w-0"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/5 border border-gray-200/50 p-6 md:p-8 overflow-hidden">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <AnimatePresence mode="wait">
                    {!isEditingProfile ? (
                      /* ----------- PROFILE PREVIEW MODE ----------- */
                      <motion.div
                        key="profile-preview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-8"
                      >
                        {/* Header Row */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
                            <p className="text-gray-500 mt-1">Your personal information</p>
                          </div>
                          <Button
                            onClick={() => setIsEditingProfile(true)}
                            variant="outline"
                            className="border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit Profile
                          </Button>
                        </div>

                        {/* Profile Hero Card */}
                        <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60">
                          {/* Cover Image / Gradient Background — unified block so layout is identical with or without cover */}
                          <div className="h-36 md:h-44 w-full overflow-hidden relative">
                            {coverImageUrl && !coverBroken ? (
                              <img
                                src={coverImageUrl}
                                alt="Cover"
                                className="w-full h-full object-cover"
                                onError={() => setCoverBroken(true)}
                              />
                            ) : (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600" />
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-60" />
                              </>
                            )}
                          </div>

                          <div className="relative pt-8 md:pt-10 pb-6 px-6 md:px-8">
                            {/* Avatar — overlaps the banner bottom edge */}
                            <div className="flex gap-5 -mt-16">
                              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden ring-4 ring-white shadow-xl flex-shrink-0">
                                {avatarUrl && !avatarBroken ? (
                                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" onError={() => setAvatarBroken(true)} />
                                ) : (
                                  displayName?.[0]?.toUpperCase() || 'U'
                                )}
                              </div>
                            </div>
                            {/* Name / email / bio — always below the avatar */}
                            <div className="mt-3 sm:ml-1">
                              <h3 className="text-2xl font-bold text-gray-900">
                                {profileData.display_name || profileData.full_name || displayName || fullName || 'User'}
                              </h3>
                              <p className="text-gray-500 flex items-center gap-1.5 mt-1">
                                <Mail className="w-4 h-4" />
                                {resolvedEmail || 'N/A'}
                              </p>
                              {/* Bio */}
                              {profileData.bio && (
                                <motion.div
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-2 max-w-xl"
                                >
                                  <p className={`text-sm text-gray-500 leading-relaxed whitespace-pre-wrap break-words ${!bioExpanded && profileData.bio.length > 150 ? 'line-clamp-3' : ''}`}>
                                    {profileData.bio}
                                  </p>
                                  {profileData.bio.length > 150 && (
                                    <button
                                      onClick={() => setBioExpanded(!bioExpanded)}
                                      className="mt-1 text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1"
                                    >
                                      {bioExpanded ? (<><ChevronUp className="w-3 h-3" /> Show less</>) : (<><ChevronDown className="w-3 h-3" /> Read more</>)}
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Detail Sections */}
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Personal Info */}
                          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 space-y-5">
                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Personal Information</h4>

                            <AnimatedProfileField icon={User} label="Full Name" value={profileData.full_name || fullName} delay={0} />
                            <AnimatedProfileField icon={User} label="Display Name" value={profileData.display_name || displayName} delay={0.05} />
                            <AnimatedProfileField icon={Mail} label="Email" value={resolvedEmail} delay={0.1} />
                            <AnimatedProfileField icon={FileText} label="Bio" value={profileData.bio} isBio delay={0.15} />
                            <AnimatedProfileField
                              icon={Flag}
                              label="Country"
                              delay={0.2}
                              value={
                                profileData.country
                                  ? `${countries.find(c => c.name === profileData.country)?.flag || ''} ${profileData.country}`
                                  : null
                              }
                            />
                          </div>

                          {/* Contact & Work */}
                          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 space-y-5">
                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Contact & Work</h4>

                            <AnimatedProfileField
                              icon={Phone}
                              label="Phone"
                              delay={0}
                              value={
                                profileData.country_code && profileData.phone
                                  ? `${profileData.country_code} ${profileData.phone}`
                                  : profileData.phone
                              }
                            />
                            <AnimatedProfileField icon={Building} label="Company" value={profileData.company} delay={0.05} />
                            <AnimatedProfileField icon={Globe} label="Website" value={profileData.website} isLink delay={0.1} />
                            <AnimatedProfileField icon={MapPin} label="Location" value={profileData.location} delay={0.15} />
                            <AnimatedProfileField
                              icon={CreditCard}
                              label="Currency"
                              delay={0.2}
                              value={
                                profileData.currency
                                  ? `${profileData.currency_code || ''} ${profileData.currency}`
                                  : null
                              }
                            />
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      /* ----------- PROFILE EDIT MODE ----------- */
                      <motion.div
                        key="profile-edit"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                            <p className="text-gray-500 mt-1">Update your personal information, photos, and cover</p>
                          </div>
                          <WithTooltip tip="Cancel editing" side="left">
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </WithTooltip>
                        </div>

                        {/* Cover Image Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                          <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-indigo-300 transition-colors group">
                            {(pendingCoverPreview || (coverImageUrl && !coverBroken)) ? (
                              <div className="h-36 md:h-44 w-full overflow-hidden">
                                <img
                                  src={pendingCoverPreview || coverImageUrl}
                                  alt="Cover"
                                  className="w-full h-full object-cover"
                                  onError={() => { if (!pendingCoverPreview) setCoverBroken(true); }}
                                />
                              </div>
                            ) : (
                              <div className="h-36 md:h-44 w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2 text-white/80">
                                  <ImagePlus className="w-10 h-10" />
                                  <span className="text-sm font-medium">Click to upload cover image</span>
                                </div>
                              </div>
                            )}
                            {/* Overlay for upload */}
                            <label className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all cursor-pointer flex items-center justify-center">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleCoverUpload}
                                disabled={uploading}
                                className="hidden"
                              />
                              <div className="opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center gap-2">
                                {uploading ? (
                                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                                ) : (
                                  <>
                                    <ImagePlus className="w-8 h-8 text-white" />
                                    <span className="text-white text-sm font-medium">
                                      {coverImageUrl || pendingCoverPreview ? 'Change Cover Image' : 'Upload Cover Image'}
                                    </span>
                                    <span className="text-white/70 text-xs">Recommended: 1200 x 400px, max 10MB</span>
                                  </>
                                )}
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Avatar Upload Section */}
                        <div className="flex items-center space-x-6 pb-6 border-b border-gray-200">
                          <div className="relative group">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden ring-4 ring-gray-100 shadow-lg">
                              {pendingAvatarPreview ? (
                                <img src={pendingAvatarPreview} alt="New avatar" className="w-full h-full object-cover" />
                              ) : avatarUrl && !avatarBroken ? (
                                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" onError={() => setAvatarBroken(true)} />
                              ) : (
                                displayName?.[0]?.toUpperCase() || 'U'
                              )}
                            </div>
                            {/* Clickable overlay — always visible with subtle hint, stronger on hover */}
                            <label className="absolute inset-0 rounded-full bg-black/20 group-hover:bg-black/50 transition-all cursor-pointer flex items-center justify-center flex-col gap-1">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleAvatarUpload}
                                disabled={uploading}
                                className="hidden"
                              />
                              {uploading ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                              ) : (
                                <>
                                  <Camera className="w-6 h-6 text-white" />
                                  <span className="text-white text-xs font-medium">Change</span>
                                </>
                              )}
                            </label>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{profileData.full_name || displayName || fullName || 'User'}</h3>
                            <p className="text-sm text-gray-600">{resolvedEmail || 'N/A'}</p>
                            <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max size 5MB</p>
                          </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <ValidatedField
                            label="Full Name"
                            required
                            icon={User}
                            error={fieldErrors.full_name}
                            status={getFieldStatus('full_name')}
                          >
                            <input
                              type="text"
                              value={profileData.full_name}
                              onChange={(e) => handleFieldChange('full_name', e.target.value)}
                              onBlur={() => handleFieldBlur('full_name')}
                              className={`w-full pl-11 pr-10 py-3 border rounded-xl transition-all ${getFieldStatus('full_name') === 'error'
                                ? 'border-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-red-50/30'
                                : getFieldStatus('full_name') === 'valid'
                                  ? 'border-green-300 focus:ring-2 focus:ring-green-400 focus:border-green-400'
                                  : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                }`}
                              placeholder={loading ? "Loading..." : "Your full name"}
                            />
                          </ValidatedField>

                          <ValidatedField
                            label="Display Name"
                            icon={User}
                            error={fieldErrors.display_name}
                            status={getFieldStatus('display_name')}
                          >
                            <input
                              type="text"
                              value={profileData.display_name}
                              onChange={(e) => handleFieldChange('display_name', e.target.value)}
                              onBlur={() => handleFieldBlur('display_name')}
                              className={`w-full pl-11 pr-10 py-3 border rounded-xl transition-all ${getFieldStatus('display_name') === 'error'
                                ? 'border-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-red-50/30'
                                : getFieldStatus('display_name') === 'valid'
                                  ? 'border-green-300 focus:ring-2 focus:ring-green-400 focus:border-green-400'
                                  : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                }`}
                              placeholder={loading ? "Loading..." : "How you want to be called"}
                            />
                          </ValidatedField>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="email"
                                value={resolvedEmail || ''}
                                disabled
                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                            <div className="relative" ref={countryDropdownRef}>
                              <button
                                type="button"
                                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-left bg-white"
                              >
                                {profileData.country ? (
                                  <span className="flex items-center gap-3">
                                    <span className="text-xl flex-shrink-0">{countries.find(c => c.name === profileData.country)?.flag || ''}</span>
                                    <span className="truncate">{profileData.country}</span>
                                  </span>
                                ) : (
                                  <span className="text-gray-400 flex items-center gap-3">
                                    <Flag className="w-5 h-5 flex-shrink-0" />
                                    <span>Select your country</span>
                                  </span>
                                )}
                              </button>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                              {showCountryDropdown && (
                                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-[200px] overflow-y-auto">
                                  {countries.map((country) => (
                                    <button
                                      key={country.name}
                                      type="button"
                                      onClick={() => handleCountryChange(country.name)}
                                      className={`w-full px-4 py-3 text-left hover:bg-indigo-50 flex items-center gap-3 transition-colors text-sm ${profileData.country === country.name ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                                        }`}
                                    >
                                      <span className="text-xl flex-shrink-0">{country.flag}</span>
                                      <span className="flex-1 truncate">{country.name}</span>
                                      <span className="text-sm text-gray-400 flex-shrink-0">{country.code}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="text"
                                value={
                                  profileData.currency
                                    ? `${profileData.currency_code || ''} ${profileData.currency}`
                                    : ''
                                }
                                disabled
                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                                placeholder="Auto-set by country"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Auto-selected based on your country</p>
                          </div>

                          <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                              Phone Number
                              <AnimatePresence mode="wait">
                                {getFieldStatus('phone') === 'error' && (
                                  <motion.span key="err" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                  </motion.span>
                                )}
                                {getFieldStatus('phone') === 'valid' && (
                                  <motion.span key="ok" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-shrink-0 w-28">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                                  {countries.find(c => c.code === profileData.country_code)?.flag || '??'}
                                </span>
                                <input
                                  type="text"
                                  value={profileData.country_code}
                                  onChange={(e) => setProfileData({ ...profileData, country_code: e.target.value })}
                                  className="w-full pl-11 pr-2 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-center font-medium text-gray-700"
                                  placeholder="+91"
                                />
                              </div>
                              <div className="relative flex-1">
                                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${getFieldStatus('phone') === 'error' ? 'text-red-400' : getFieldStatus('phone') === 'valid' ? 'text-green-400' : 'text-gray-400'
                                  }`} />
                                <input
                                  type="tel"
                                  value={profileData.phone}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^\d]/g, '');
                                    handleFieldChange('phone', val);
                                  }}
                                  onBlur={() => handleFieldBlur('phone')}
                                  className={`w-full pl-11 pr-10 py-3 border rounded-xl transition-all ${getFieldStatus('phone') === 'error'
                                    ? 'border-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-red-50/30'
                                    : getFieldStatus('phone') === 'valid'
                                      ? 'border-green-300 focus:ring-2 focus:ring-green-400 focus:border-green-400'
                                      : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                    }`}
                                  placeholder="Enter phone number"
                                  maxLength={15}
                                />
                                {getFieldStatus('phone') === 'error' && (
                                  <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                  </motion.div>
                                )}
                                {getFieldStatus('phone') === 'valid' && (
                                  <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                  </motion.div>
                                )}
                              </div>
                            </div>
                            <AnimatePresence>
                              {fieldErrors.phone && (
                                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 flex-shrink-0" /> {fieldErrors.phone}
                                </motion.p>
                              )}
                            </AnimatePresence>
                            {!fieldErrors.phone && profileData.country_code && profileData.phone && (
                              <p className="text-xs text-gray-500 mt-1.5">
                                Full number: <span className="font-medium text-gray-700">{profileData.country_code} {profileData.phone}</span>
                              </p>
                            )}
                          </div>

                          <ValidatedField
                            label="Company"
                            icon={Building}
                            error={fieldErrors.company}
                            status={getFieldStatus('company')}
                          >
                            <input
                              type="text"
                              value={profileData.company}
                              onChange={(e) => handleFieldChange('company', e.target.value)}
                              onBlur={() => handleFieldBlur('company')}
                              className={`w-full pl-11 pr-10 py-3 border rounded-xl transition-all ${getFieldStatus('company') === 'error'
                                ? 'border-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-red-50/30'
                                : getFieldStatus('company') === 'valid'
                                  ? 'border-green-300 focus:ring-2 focus:ring-green-400 focus:border-green-400'
                                  : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                }`}
                              placeholder="Add your company"
                            />
                          </ValidatedField>

                          <ValidatedField
                            label="Website"
                            icon={Globe}
                            error={fieldErrors.website}
                            status={getFieldStatus('website')}
                          >
                            <input
                              type="url"
                              value={profileData.website}
                              onChange={(e) => handleFieldChange('website', e.target.value)}
                              onBlur={() => handleFieldBlur('website')}
                              className={`w-full pl-11 pr-10 py-3 border rounded-xl transition-all ${getFieldStatus('website') === 'error'
                                ? 'border-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-red-50/30'
                                : getFieldStatus('website') === 'valid'
                                  ? 'border-green-300 focus:ring-2 focus:ring-green-400 focus:border-green-400'
                                  : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                }`}
                              placeholder="https://example.com"
                            />
                          </ValidatedField>

                          <div className="md:col-span-2">
                            <ValidatedField
                              label="Location"
                              icon={MapPin}
                              error={fieldErrors.location}
                              status={getFieldStatus('location')}
                            >
                              <input
                                type="text"
                                value={profileData.location}
                                onChange={(e) => handleFieldChange('location', e.target.value)}
                                onBlur={() => handleFieldBlur('location')}
                                className={`w-full pl-11 pr-10 py-3 border rounded-xl transition-all ${getFieldStatus('location') === 'error'
                                  ? 'border-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-red-50/30'
                                  : getFieldStatus('location') === 'valid'
                                    ? 'border-green-300 focus:ring-2 focus:ring-green-400 focus:border-green-400'
                                    : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                  }`}
                                placeholder="City, Country"
                              />
                            </ValidatedField>
                          </div>

                          <div className="md:col-span-2">
                            <ValidatedField
                              label="Bio"
                              icon={FileText}
                              error={fieldErrors.bio}
                              status={getFieldStatus('bio')}
                              noIcon
                            >
                              <div className="relative">
                                <textarea
                                  value={profileData.bio}
                                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                                  onBlur={() => handleFieldBlur('bio')}
                                  rows={4}
                                  maxLength={500}
                                  className={`w-full px-4 py-3 border rounded-xl transition-all resize-none ${getFieldStatus('bio') === 'error'
                                    ? 'border-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-red-50/30'
                                    : getFieldStatus('bio') === 'valid'
                                      ? 'border-green-300 focus:ring-2 focus:ring-green-400 focus:border-green-400'
                                      : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                    }`}
                                  placeholder="Tell us about yourself..."
                                />
                                {/* Character counter with color feedback */}
                                <div className="flex items-center justify-between mt-1.5">
                                  <p className={`text-xs ${profileData.bio.length >= 480 ? 'text-red-500 font-medium' :
                                    profileData.bio.length >= 400 ? 'text-amber-500' : 'text-gray-400'
                                    }`}>
                                    {profileData.bio.length}/500 characters
                                  </p>
                                  {/* Progress bar */}
                                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full rounded-full transition-colors ${profileData.bio.length >= 480 ? 'bg-red-400' :
                                        profileData.bio.length >= 400 ? 'bg-amber-400' :
                                          profileData.bio.length > 0 ? 'bg-indigo-400' : 'bg-gray-200'
                                        }`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(profileData.bio.length / 500) * 100}%` }}
                                      transition={{ duration: 0.2 }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </ValidatedField>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                          <Button
                            onClick={handleSaveProfile}
                            disabled={saving || uploading}
                            className="bg-gradient-to-r from-primary to-indigo-600 shadow-lg hover:shadow-xl transition-all"
                          >
                            {saving || uploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {uploading ? 'Uploading photo...' : 'Saving...'}
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                            disabled={saving || uploading}
                            className="border-gray-200 hover:bg-gray-50 transition-all"
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

                {/* AI Configuration Tab */}
                {activeTab === "ai" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Configuration</h2>
                      <p className="text-gray-500 text-base">Configure AI-powered bill generation and insights</p>
                    </div>

                    {aiLoading ? (
                      /* Loading skeleton */
                      <div className="space-y-6">
                        <Skeleton className="w-full h-24 rounded-2xl" />
                        <div className="grid grid-cols-3 gap-4">
                          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                        </div>
                        <Skeleton className="w-full h-14 rounded-xl" />
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => <Skeleton key={i} className="w-full h-20 rounded-xl" />)}
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Provider Info Banner */}
                        {currentProviderInfo && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-indigo-50/80 to-purple-50/60 rounded-2xl p-6 md:p-7 border border-indigo-200/40"
                          >
                            <div className="flex items-start gap-5">
                              <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center p-1.5">
                                <ProviderIcon providerId={selectedProvider} size={32} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 text-lg mb-1">About {currentProviderInfo.name}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed mb-3">{currentProviderInfo.description}</p>
                                <a
                                  href={currentProviderInfo.docs_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
                                >
                                  Get your API key
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Provider Selection Cards */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Choose Provider</label>
                          <div className="grid grid-cols-3 gap-4">
                            {aiProviders.map((provider) => (
                              <div
                                key={provider.id}
                                onClick={() => setSelectedProvider(provider.id)}
                                role="button"
                                tabIndex={0}
                                className={`relative cursor-pointer p-5 rounded-2xl border-2 transition-all hover:shadow-md ${selectedProvider === provider.id
                                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/15'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                                  }`}
                              >
                                {selectedProvider === provider.id && (
                                  <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm">
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  </div>
                                )}
                                {/* Icon */}
                                <div className="flex items-center justify-center h-16 mb-3">
                                  <ProviderIcon providerId={provider.id} size={44} />
                                </div>
                                {/* Name & models */}
                                <div className="text-center">
                                  <p className="font-semibold text-gray-900">{provider.name}</p>
                                  <p className="text-sm text-gray-500 mt-0.5">{provider.models.length} models</p>
                                </div>
                                {aiSettings[provider.id] && (
                                  <div className="text-center mt-3">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Configured
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100" />

                        {/* API Key Input with Validation */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                            <Key className="w-4 h-4" />
                            {currentProviderInfo?.name || 'Provider'} API Key
                            {getKeyStatusIcon()}
                          </label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 min-w-0">
                              <input
                                type={showApiKey ? 'text' : 'password'}
                                value={aiApiKey}
                                onChange={(e) => handleAiKeyChange(e.target.value)}
                                className={`w-full px-5 py-3.5 pr-12 rounded-2xl border-2 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono text-sm ${getKeyStatusColor()}`}
                                placeholder={`${currentProviderInfo?.key_prefix || 'sk-'}...`}
                              />
                              <WithTooltip tip={showApiKey ? 'Hide key' : 'Show key'} side="left">
                                <button
                                  type="button"
                                  onClick={() => setShowApiKey(!showApiKey)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors hover:opacity-70 focus:outline-none focus:ring-0 focus:bg-transparent active:bg-transparent active:ring-0 active:outline-none"
                                >
                                  {showApiKey ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                                </button>
                              </WithTooltip>
                            </div>
                            <button
                              type="button"
                              onClick={handleValidateKey}
                              disabled={aiValidating || !aiApiKey.trim()}
                              className="px-5 py-3.5 text-sm font-bold rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all border-2 border-indigo-200 whitespace-nowrap flex-shrink-0"
                            >
                              {aiValidating ? (
                                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Checking...</span>
                              ) : (
                                <span className="flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4" /> Validate Key</span>
                              )}
                            </button>
                          </div>
                          {/* Validation message */}
                          <AnimatePresence>
                            {aiKeyValidation.message && (
                              <motion.div
                                initial={{ opacity: 0, y: -5, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -5, height: 0 }}
                                className={`flex items-center gap-2 mt-3 text-sm font-medium ${aiKeyValidation.status === 'valid' ? 'text-green-600' :
                                  aiKeyValidation.status === 'invalid' ? 'text-red-500' :
                                    aiKeyValidation.status === 'checking' ? 'text-indigo-500' :
                                      aiKeyValidation.status === 'error' ? 'text-amber-600' : 'text-gray-500'
                                  }`}
                              >
                                {aiKeyValidation.status === 'valid' && <CheckCircle2 className="w-4 h-4" />}
                                {aiKeyValidation.status === 'invalid' && <AlertCircle className="w-4 h-4" />}
                                {aiKeyValidation.status === 'checking' && <Loader2 className="w-4 h-4 animate-spin" />}
                                {aiKeyValidation.status === 'error' && <AlertCircle className="w-4 h-4" />}
                                {aiKeyValidation.message}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" />
                            Your API key is stored securely in your private database
                          </p>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100" />

                        {/* Model Selection */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                            Model Selection
                          </label>
                          <div className="space-y-2.5">
                            {currentModels.map((model) => (
                              <div
                                key={model.id}
                                onClick={() => setAiSelectedModel(model.id)}
                                role="button"
                                tabIndex={0}
                                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${aiSelectedModel === model.id
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                                  }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="font-semibold text-gray-900">{model.name}</span>
                                    {model.recommended && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md flex-shrink-0">
                                        <Zap className="w-3 h-3" />
                                        Recommended
                                      </span>
                                    )}
                                    {model.is_preview && (
                                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md flex-shrink-0">
                                        Preview
                                      </span>
                                    )}
                                    {model.reasoning_supported && (
                                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md flex-shrink-0">
                                        {model.reasoning_label || 'Reasoning'}
                                      </span>
                                    )}
                                  </div>
                                  {aiSelectedModel === model.id && (
                                    <span className="flex items-center gap-1.5 text-primary text-sm font-semibold flex-shrink-0">
                                      <Check className="w-4 h-4" />
                                      Selected
                                    </span>
                                  )}
                                  {(() => {
                                    const probe = modelProbeMap[selectedProvider]?.[model.id];
                                    if (!probe) return null;
                                    if (probe.status === 'available') return <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="Available" />;
                                    if (probe.status === 'unavailable') return <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" title={probe.message || 'Unavailable'} />;
                                    return null;
                                  })()}
                                </div>
                                <p className="text-sm text-gray-500">{model.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100" />

                        {/* AI Insights Toggle */}
                        <div className="flex items-center justify-between gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-2xl border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border border-indigo-100">
                              <Sparkles className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-base">Enable AI Insights</p>
                              <p className="text-sm text-gray-500 mt-1">Get spending recommendations and trends</p>
                            </div>
                          </div>
                          <div
                            role="switch"
                            aria-checked={aiEnableInsights}
                            tabIndex={0}
                            onClick={() => setAiEnableInsights(!aiEnableInsights)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setAiEnableInsights((prev) => !prev);
                              }
                            }}
                            className={`relative w-14 h-7 rounded-full overflow-hidden shrink-0 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${aiEnableInsights ? 'bg-primary' : 'bg-gray-300'
                              }`}
                            style={{ width: 56, minWidth: 56, height: 28 }}
                          >
                            <motion.span
                              layout
                              className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm"
                              animate={{ x: aiEnableInsights ? 28 : 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          </div>
                        </div>

                        {/* Default Reasoning Effort */}
                        {currentModels.some(m => m.reasoning_supported) && (
                          <div className="flex items-center justify-between gap-4 p-5 bg-gradient-to-r from-violet-50 to-indigo-50/50 rounded-2xl border border-violet-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center border border-violet-100">
                                <Brain className="w-5 h-5 text-violet-500" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-base">Default Reasoning Effort</p>
                                <p className="text-sm text-gray-500 mt-1">For reasoning-capable models ({currentModels.filter(m => m.reasoning_supported).map(m => m.name).join(', ')})</p>
                              </div>
                            </div>
                            <ReasoningEffortDropdown
                              value={aiDefaultReasoningEffort}
                              onChange={setAiDefaultReasoningEffort}
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                          <Button
                            onClick={handleSaveAISettings}
                            disabled={aiSaving || !aiApiKey.trim()}
                            className="bg-gradient-to-r from-primary to-indigo-600 shadow-lg hover:shadow-xl transition-all px-8 py-3 text-sm font-bold"
                          >
                            {aiSaving ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                            ) : (
                              <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                            )}
                          </Button>
                          {aiHasExistingKey && (
                            <Button
                              onClick={handleDeleteAISettings}
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">Notification Preferences</h2>
                      <p className="text-gray-500">Choose which in-app notifications you receive. Disabled types will not appear in your notification bell.</p>
                    </div>

                    {/* Bill alerts group */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bill Alerts</p>
                      <div className="space-y-2">
                        {[
                          { key: "bill_due_soon", label: "Bill Due Soon", desc: "Remind you when a bill is approaching its due date" },
                          { key: "bill_overdue", label: "Bill Overdue", desc: "Alert when a bill has passed its due date without payment" },
                          { key: "payment_recorded", label: "Payment Recorded", desc: "Confirm when a payment is successfully logged" },
                          { key: "budget_exceeded", label: "Budget Threshold Exceeded", desc: "Warn when spending crosses your set budget limit" },
                        ].map(({ key, label, desc }) => (
                          <NotifToggleRow
                            key={key}
                            label={label}
                            desc={desc}
                            enabled={!!notifPrefs[key]}
                            onToggle={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Bill generation group */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bill Generation</p>
                      <div className="space-y-2">
                        {[
                          { key: "bill_added", label: "New Bill Added", desc: "Confirm when a bill is manually added to your account" },
                          { key: "bill_auto_generated", label: "Bill Auto-Generated", desc: "Notify when a bill is automatically created on billing day" },
                          { key: "bill_auto_warning", label: "Pre-Generation Warning", desc: "Alert the day before an auto-bill will be generated" },
                        ].map(({ key, label, desc }) => (
                          <NotifToggleRow
                            key={key}
                            label={label}
                            desc={desc}
                            enabled={!!notifPrefs[key]}
                            onToggle={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Service activity group */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Service Activity</p>
                      <div className="space-y-2">
                        {[
                          { key: "service_created", label: "Service Added", desc: "Notify when a new service is added to your account" },
                          { key: "service_updated", label: "Service Updated", desc: "Notify when an existing service's details are modified" },
                        ].map(({ key, label, desc }) => (
                          <NotifToggleRow
                            key={key}
                            label={label}
                            desc={desc}
                            enabled={!!notifPrefs[key]}
                            onToggle={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Account group */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account</p>
                      <div className="space-y-2">
                        {[
                          { key: "email_verification", label: "Email Verification", desc: "Notifications related to email verification and account security" },
                          { key: "general", label: "General Notifications", desc: "App updates, announcements, and other general alerts" },
                        ].map(({ key, label, desc }) => (
                          <NotifToggleRow
                            key={key}
                            label={label}
                            desc={desc}
                            enabled={!!notifPrefs[key]}
                            onToggle={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={handleSaveNotifications}
                        disabled={notifSaving}
                        className="bg-gradient-to-r from-primary to-indigo-600 shadow-lg hover:shadow-xl transition-all"
                      >
                        {notifSaving ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="w-4 h-4 mr-2" /> Save Preferences</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* --- Security Tab --------------------------------------- */}
                {activeTab === "security" && (
                  <div className="space-y-8">
                    {/* Header */}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">Security</h2>
                      <p className="text-gray-500">Manage your password, connected accounts, and account access.</p>
                    </div>

                    {/* -- Change Password -------------------------------- */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Change Password</h3>
                          <p className="text-xs text-gray-500">Update your account password</p>
                        </div>
                      </div>

                      {/* SSO-only banner */}
                      {!hasPasswordIdentity && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4"
                        >
                          <Link2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-blue-800">You signed in with Google</p>
                            <p className="text-xs text-blue-600 mt-0.5">Set a password below to also log in with your email address. Once set, both methods will work.</p>
                          </div>
                        </motion.div>
                      )}

                      <div className="bg-gray-50/70 rounded-2xl border border-gray-200 p-5 space-y-4">
                        {/* Current Password (only shown when user has a password) */}
                        {hasPasswordIdentity && (
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Current Password</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                              <input
                                type={secShowCurrent ? "text" : "password"}
                                placeholder="Enter current password"
                                value={secCurrentPassword}
                                onChange={(e) => setSecCurrentPassword(e.target.value)}
                                className="w-full h-[44px] rounded-xl border border-gray-200 pl-10 pr-11 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => setSecShowCurrent((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                {secShowCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* New Password */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">New Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              type={secShowNew ? "text" : "password"}
                              placeholder="Enter new password"
                              value={secNewPassword}
                              onChange={(e) => setSecNewPassword(e.target.value)}
                              className="w-full h-[44px] rounded-xl border border-gray-200 pl-10 pr-11 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => setSecShowNew((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {secShowNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {secNewPassword && (
                            <PasswordStrengthBar
                              password={secNewPassword}
                              showRequirements={secPasswordStrength.score < 4}
                            />
                          )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              type={secShowConfirm ? "text" : "password"}
                              placeholder="Confirm new password"
                              value={secConfirmPassword}
                              onChange={(e) => setSecConfirmPassword(e.target.value)}
                              className={`w-full h-[44px] rounded-xl border pl-10 pr-11 text-sm outline-none focus:ring-2 transition-all bg-white ${secConfirmPassword
                                ? secPasswordsMatch
                                  ? 'border-emerald-400 focus:ring-emerald-400 focus:border-emerald-400'
                                  : 'border-red-300 focus:ring-red-400 focus:border-red-400'
                                : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                                }`}
                            />
                            <button
                              type="button"
                              onClick={() => setSecShowConfirm((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {secShowConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {secConfirmPassword && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className={`flex items-center gap-1.5 text-xs font-medium ${secPasswordsMatch ? 'text-emerald-600' : 'text-red-500'}`}
                            >
                              {secPasswordsMatch ? (
                                <>
                                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </motion.div>
                                  <span>Passwords match</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Passwords do not match</span>
                                </>
                              )}
                            </motion.div>
                          )}
                        </div>

                        <Button
                          onClick={handleChangePassword}
                          disabled={secPasswordLoading || secPasswordsMismatch || !secNewPassword}
                          className="bg-gradient-to-r from-primary to-indigo-600 shadow-lg hover:shadow-xl transition-all"
                        >
                          {secPasswordLoading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating…</>
                          ) : (
                            <><Lock className="w-4 h-4 mr-2" /> Update Password</>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* -- Change Email ----------------------------------- */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Change Email Address</h3>
                          <p className="text-xs text-gray-500">A confirmation link will be sent to your new email</p>
                        </div>
                      </div>

                      <div className="bg-gray-50/70 rounded-2xl border border-gray-200 p-5 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">Current Email</label>
                          <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-2.5">{resolvedEmail || 'Unknown'}</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">New Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              type="email"
                              placeholder="Enter new email address"
                              value={secNewEmail}
                              onChange={(e) => { setSecNewEmail(e.target.value); setSecEmailMsg({ type: '', text: '' }); }}
                              className="w-full h-[44px] rounded-xl border border-gray-200 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            />
                          </div>
                        </div>

                        <AnimatePresence>
                          {secEmailMsg.text && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className={`text-sm flex items-center gap-1.5 ${secEmailMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}
                            >
                              {secEmailMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                              {secEmailMsg.text}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        <Button
                          onClick={async () => {
                            const email = secNewEmail.trim();
                            if (!email) { setSecEmailMsg({ type: 'error', text: 'Please enter a new email address.' }); return; }
                            if (email === resolvedEmail) { setSecEmailMsg({ type: 'error', text: 'New email must differ from your current email.' }); return; }
                            setSecEmailLoading(true);
                            setSecEmailMsg({ type: '', text: '' });
                            try {
                              const { error } = await supabase.auth.updateUser({ email, options: { emailRedirectTo: `${window.location.origin}/auth/change-email` } });
                              if (error) throw error;
                              setSecEmailMsg({ type: 'success', text: `Confirmation sent to ${email}. Check your inbox to complete the change.` });
                              setSecNewEmail('');
                            } catch (err) {
                              const msg = err.message || '';
                              if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('exists')) {
                                setSecEmailMsg({ type: 'error', text: 'This email address is already in use by another account.' });
                              } else {
                                setSecEmailMsg({ type: 'error', text: msg || 'Failed to update email.' });
                              }
                            } finally {
                              setSecEmailLoading(false);
                            }
                          }}
                          disabled={secEmailLoading || !secNewEmail.trim()}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 transition-all"
                          variant="outline"
                        >
                          {secEmailLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>) : (<><Mail className="w-4 h-4 mr-2" />Send Confirmation Email</>)}
                        </Button>
                      </div>
                    </div>

                    {/* -- Connected Accounts ---------------------------- */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                          <Link2 className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Connected Accounts</h3>
                          <p className="text-xs text-gray-500">Login methods linked to your account</p>
                        </div>
                      </div>
                      <div className="bg-gray-50/70 rounded-2xl border border-gray-200 divide-y divide-gray-100">
                        {/* Google */}
                        {identities.some((id) => id.provider === 'google') && (
                          <div className="flex items-center gap-3 px-5 py-4">
                            <div className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">Google</p>
                              <p className="text-xs text-gray-500">Sign in with Google account</p>
                            </div>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">Connected</span>
                          </div>
                        )}
                        {/* Email + Password */}
                        {identities.some((id) => id.provider === 'email') && (
                          <div className="flex items-center gap-3 px-5 py-4">
                            <div className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0">
                              <Mail className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">Email & Password</p>
                              <p className="text-xs text-gray-500">{resolvedEmail}</p>
                            </div>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">Connected</span>
                          </div>
                        )}
                        {identities.length === 0 && (
                          <div className="px-5 py-4 text-sm text-gray-400 italic">Loading…</div>
                        )}
                      </div>
                      {identities.length === 1 && (
                        <p className="text-xs text-amber-600 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          Only one login method active. Consider adding another for backup access.
                        </p>
                      )}
                    </div>

                    {/* -- Last Login ------------------------------------- */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                          <Monitor className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Current Session</h3>
                          <p className="text-xs text-gray-500">Your last sign-in details</p>
                        </div>
                      </div>
                      <div className="bg-gray-50/70 rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0">
                          <Monitor className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{getBrowserName()} on {getOSName()}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Last sign-in: {formatLastSignIn(lastSignIn)}</p>
                        </div>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 flex-shrink-0">Active</span>
                      </div>
                    </div>

                    {/* -- Danger Zone ------------------------------------ */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                          <ShieldAlert className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Danger Zone</h3>
                          <p className="text-xs text-gray-500">Irreversible account actions</p>
                        </div>
                      </div>
                      <div className="bg-red-50/60 rounded-2xl border-2 border-red-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900">Delete Account</p>
                          <p className="text-xs text-red-600 mt-0.5">Permanently delete your account and all associated data. This action cannot be undone.</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); }}
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.main>

            {/* -- Delete Account Confirmation Modal ------------------- */}
            <AnimatePresence>
              {showDeleteModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                  onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 16 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">Delete Account</h3>
                          <p className="text-xs text-gray-500">This cannot be undone</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDeleteModal(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
                      <p className="text-sm font-semibold text-red-800">You are about to permanently delete your account.</p>
                      <p className="text-xs text-red-600">All your services, bills, calendar data, and settings will be removed immediately with no recovery option.</p>
                    </div>

                    {/* -- What will be deleted summary -- */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What will be deleted</p>

                      {/* Services row */}
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-gray-500 w-14 shrink-0 pt-0.5">Services</span>
                        {accountDataLoading ? (
                          <span className="text-xs text-gray-400 italic">Loading…</span>
                        ) : accountServices.length === 0 ? (
                          <span className="text-xs text-gray-400">No services</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 flex-1">
                            {accountServices.slice(0, 3).map((s) => (
                              <span key={s.id} className="text-xs bg-white border border-gray-200 rounded-md px-2 py-0.5 text-gray-700 font-medium">
                                {s.name}
                              </span>
                            ))}
                            {accountServices.length > 3 && (
                              <span className="text-xs text-gray-500 pt-0.5">
                                and {accountServices.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bills row */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 w-14 shrink-0">Bills</span>
                        {accountDataLoading ? (
                          <span className="text-xs text-gray-400 italic">Loading…</span>
                        ) : (
                          <span className="text-xs text-gray-700">
                            {accountBillsCount === 0
                              ? 'No generated bills'
                              : `${accountBillsCount} generated bill${accountBillsCount !== 1 ? 's' : ''}`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Type <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">DELETE</span> to confirm
                      </label>
                      <input
                        type="text"
                        placeholder="Type DELETE"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all font-mono"
                      />
                    </div>

                    <div className="flex gap-3 pt-1">
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteModal(false)}
                        className="flex-1 border-gray-200"
                        disabled={deleteLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white border-transparent"
                      >
                        {deleteLoading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting…</>
                        ) : (
                          <><Trash2 className="w-4 h-4 mr-2" /> Delete Forever</>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/* --- Notification toggle row --- */
function NotifToggleRow({ label, desc, enabled, onToggle }) {
  return (
    <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${enabled ? "bg-primary/[0.03] border-primary/20" : "bg-gray-50 border-gray-200"
      }`}>
      <div className="min-w-0 pr-4">
        <p className={`font-semibold text-sm ${enabled ? "text-gray-900" : "text-gray-500"}`}>{label}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <div
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${label}`}
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`relative shrink-0 w-12 h-6 rounded-full overflow-hidden transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${enabled ? "bg-primary" : "bg-gray-300"
          }`}
        style={{ width: 48, minWidth: 48, height: 24 }}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? "translate-x-6" : "translate-x-0"
            }`}
        />
      </div>
    </div>
  );
}

/* --- Animated read-only field for Profile Preview --- */
function AnimatedProfileField({ icon: Icon, label, value, isLink = false, isBio = false, delay = 0 }) {
  const isEmpty = !value || value.trim?.() === '';

  return (
    <motion.div
      className="flex items-start gap-3 group"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
    >
      <motion.div
        className="mt-0.5 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center flex-shrink-0 border border-indigo-100/50 group-hover:from-indigo-100 group-hover:to-purple-100 transition-all"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 400, damping: 12 }}
      >
        <Icon className="w-4 h-4 text-indigo-500" />
      </motion.div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        {isEmpty ? (
          <p className="text-sm text-gray-300 italic">Not set</p>
        ) : isLink ? (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 break-all"
          >
            {value}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        ) : isBio ? (
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed line-clamp-4">{value}</p>
        ) : (
          <p className="text-sm text-gray-800 break-all">{value}</p>
        )}
      </div>
    </motion.div>
  );
}

/* --- Validated field wrapper for Edit Mode --- */
function ValidatedField({ label, required, icon: Icon, error, status, children, noIcon = false }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && (
          <span className="text-red-500 text-xs">*</span>
        )}
        {/* Validation indicator */}
        <AnimatePresence mode="wait">
          {status === 'error' && (
            <motion.span
              key="error"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            </motion.span>
          )}
          {status === 'valid' && (
            <motion.span
              key="valid"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            </motion.span>
          )}
        </AnimatePresence>
      </label>
      <div className="relative">
        {!noIcon && Icon && (
          <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${status === 'error' ? 'text-red-400' : status === 'valid' ? 'text-green-400' : 'text-gray-400'
            }`} />
        )}
        {/* Status icon inside input */}
        {!noIcon && status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <AlertCircle className="w-4 h-4 text-red-400" />
          </motion.div>
        )}
        {!noIcon && status === 'valid' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </motion.div>
        )}
        {children}
      </div>
      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            className="text-xs text-red-500 mt-1.5 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
