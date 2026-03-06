// @ts-nocheck
'use client'
import { useRouter } from 'next/navigation';
import { assetUrl } from "@/lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Phone,
  CreditCard,
  ChevronDown,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Lock,
  Brain,
  Sparkles,
  MessageSquare,
  BarChart3,
  Camera,
  ExternalLink,
  Key,
  Check,
  Zap,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import AppLoadingScreen from "@/components/loading/AppLoadingScreen";
import { profileService } from "@/services/profileService";
import { aiSettingsService } from "@/services/aiSettingsService";
import { notificationService } from "@/services/notificationService";
import { COUNTRY_TIMEZONE } from "@/lib/timezone";
import { COUNTRIES, getCountryByName } from "@/lib/countries";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/components/ui/toaster-custom";

function ProviderIcon({ providerId, size = 32 }) {
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
}

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required ? <span className="text-red-500 ml-0.5">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      ) : null}
      {!error && hint ? <p className="text-xs text-gray-500 mt-1.5">{hint}</p> : null}
    </div>
  );
}

function TextInput({ icon: Icon, error, className = "", ...props }) {
  return (
    <div className="relative">
      {Icon ? <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /> : null}
      <input
        {...props}
        className={`w-full ${Icon ? "pl-11" : "pl-4"} pr-4 py-3 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 transition-all ${error
            ? "border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/30"
            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          } ${className}`}
      />
    </div>
  );
}

function SkipAIModal({ userName, onSkip, onConfigure }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onConfigure}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">AI features will be limited</h3>
          </div>
          <button type="button" onClick={onConfigure} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Hey <strong>{userName || "there"}</strong>! Without an AI provider configured, these features will not be available:
        </p>

        <div className="space-y-2.5 mb-5">
          {["Bill Generation", "Ask AI Chat", "AI Insights"].map((label) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <Lock className="w-3.5 h-3.5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mb-4">
          You can configure AI anytime in <strong>Settings -&gt; AI Configuration</strong>.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfigure}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-sm font-medium"
          >
            Configure Now
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
          >
            Skip for Now
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

function ProfileStep({ onNext, initialName, initialAvatarUrl }) {
  const [form, setForm] = useState({
    full_name: initialName || "",
    display_name: initialName || "",
    phone: "",
    country: "",
    country_code: "",
    currency: "",
    currency_code: "",
    timezone: "",
    bio: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(initialAvatarUrl || null);
  const countryRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) setShowCountry(false);
    };
    if (showCountry) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showCountry]);

  useEffect(() => {
    if (initialName && !form.full_name) {
      setForm((prev) => ({ ...prev, full_name: initialName, display_name: prev.display_name || initialName }));
    }
  }, [initialName, form.full_name]);

  useEffect(() => {
    if (initialAvatarUrl && !avatarFile) setAvatarPreview((prev) => prev || initialAvatarUrl);
  }, [initialAvatarUrl, avatarFile]);

  const validate = (data = form) => {
    const next = {};
    const n = data.full_name.trim();
    if (!n) next.full_name = "Full name is required";
    else if (n.length < 2) next.full_name = "At least 2 characters required";
    const dn = data.display_name.trim();
    if (!dn) next.display_name = "Display name is required";
    else if (dn.length < 2) next.display_name = "At least 2 characters required";
    else if (!/^[a-zA-Z0-9 _-]+$/.test(dn)) next.display_name = "Only letters, numbers, spaces, hyphens and underscores";
    if (!data.country) next.country = "Country is required";
    if (data.phone && !/^\d{7,15}$/.test(data.phone.trim())) next.phone = "Enter a valid phone number (7-15 digits)";
    if (data.bio && data.bio.length > 500) next.bio = `${data.bio.length}/500 - too long`;
    return next;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const next = validate({ ...form, [field]: value });
      setErrors((prev) => ({ ...prev, [field]: next[field] || null }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const next = validate();
    setErrors((prev) => ({ ...prev, [field]: next[field] || null }));
  };

  const handleCountrySelect = (country) => {
    setForm((prev) => ({
      ...prev,
      country: country.name,
      country_code: country.code,
      currency: country.currency,
      currency_code: country.currencySymbol,
      timezone: COUNTRY_TIMEZONE[country.name] || "",
    }));
    setShowCountry(false);
  };

  const handleNext = async () => {
    setTouched({ full_name: true, display_name: true, country: true });
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const userId = localStorage.getItem("user_id");
      if (userId) {
        if (avatarFile) {
          try { await profileService.uploadAvatar(userId, avatarFile); } catch (e) { console.error("Avatar upload error:", e); }
        }
        await profileService.updateProfile(userId, form);
      }
      onNext(form.display_name || form.full_name);
    } catch (e) {
      console.error("Profile save error:", e);
      onNext(form.display_name || form.full_name);
    } finally {
      setSaving(false);
    }
  };

  const selectedCountry = getCountryByName(form.country);
  const canNext = Boolean(form.full_name.trim() && form.display_name.trim() && form.country);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-6 pb-6 border-b border-gray-200">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden ring-4 ring-gray-100 shadow-lg flex items-center justify-center text-white text-3xl font-bold">
            {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-white/90" />}
          </div>
          <label className="absolute inset-0 rounded-full bg-black/20 group-hover:bg-black/50 transition-all cursor-pointer flex items-center justify-center flex-col gap-1">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setAvatarFile(file);
                const reader = new FileReader();
                reader.onload = (ev) => setAvatarPreview(ev.target?.result);
                reader.readAsDataURL(file);
              }}
            />
            <Camera className="w-6 h-6 text-white" />
            <span className="text-white text-xs font-medium">Change</span>
          </label>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>
          <p className="text-sm text-gray-600">Optional - JPG, PNG or WebP, max 5 MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Full Name" required error={errors.full_name}><TextInput icon={User} value={form.full_name} onChange={(e) => handleChange("full_name", e.target.value)} onBlur={() => handleBlur("full_name")} error={errors.full_name} /></Field>
        <Field label="Display Name" required error={errors.display_name} hint={!errors.display_name ? "Shown in the app" : undefined}><TextInput icon={User} value={form.display_name} onChange={(e) => handleChange("display_name", e.target.value)} onBlur={() => handleBlur("display_name")} error={errors.display_name} /></Field>

        <Field label="Country" required error={errors.country}>
          <div className="relative" ref={countryRef}>
            <button type="button" onClick={() => setShowCountry((v) => !v)} className={`w-full pl-4 pr-10 py-3 border rounded-xl text-left ${errors.country ? "border-red-300 bg-red-50/30" : "border-gray-300 bg-white"}`}>
              {form.country ? <span className="flex items-center gap-3"><span className="text-xl">{selectedCountry?.flag || ""}</span><span>{form.country}</span></span> : <span className="text-gray-400">Select your country</span>}
            </button>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${showCountry ? "rotate-180" : ""}`} />
            {showCountry ? (
              <div className="absolute top-full mt-1 left-0 right-0 z-30 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                {COUNTRIES.map((country) => (
                  <button key={country.name} type="button" onClick={() => handleCountrySelect(country)} className={`w-full px-4 py-3 text-sm text-left flex items-center gap-3 hover:bg-indigo-50 ${form.country === country.name ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700"}`}>
                    <span className="text-xl">{country.flag}</span><span className="flex-1">{country.name}</span><span className="text-xs text-gray-400">{country.currency}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </Field>

        <Field label="Phone Number" error={errors.phone} hint={!errors.phone ? "Optional" : undefined}>
          <div className="flex gap-2">
            <div className="w-28 px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-700 flex items-center gap-2">
              <span className="text-base">{selectedCountry?.flag || ""}</span><span>{selectedCountry?.code || "+--"}</span>
            </div>
            <TextInput icon={Phone} value={form.phone} onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ""))} onBlur={() => handleBlur("phone")} error={errors.phone} className="flex-1" />
          </div>
        </Field>

        <Field label="Currency" hint="Auto-set from country"><TextInput icon={CreditCard} value={form.currency ? `${form.currency_code || ""} ${form.currency}` : ""} disabled placeholder="Select a country first" className="border-gray-200 bg-gray-50 text-gray-600" /></Field>
        <Field label="Timezone" required hint="Auto-set from country"><TextInput value={form.timezone} disabled placeholder="Select a country first" className="border-gray-200 bg-gray-50 text-gray-600" /></Field>
      </div>

      <Field label="Bio" error={errors.bio} hint={!errors.bio ? "Optional - max 500 characters" : undefined}>
        <textarea value={form.bio} onChange={(e) => handleChange("bio", e.target.value)} onBlur={() => handleBlur("bio")} rows={4} className={`w-full px-4 py-3 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 resize-none ${errors.bio ? "border-red-300" : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"}`} placeholder="Tell us a bit about yourself..." />
      </Field>

      <div className="flex items-center justify-end pt-4 border-t border-gray-100">
        <button type="button" onClick={handleNext} disabled={saving || !canNext} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold ${canNext && !saving ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? "Saving..." : "Next - AI Setup ->"}
        </button>
      </div>
    </div>
  );
}

function AIStep({ userName, onComplete }) {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [keyValidation, setKeyValidation] = useState({ status: "idle", message: "" });
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);

  useEffect(() => {
    aiSettingsService.getProviders().then(setProviders).catch(() => setProviders(aiSettingsService.getDefaultProviders()));
  }, []);

  const provider = providers.find((p) => p.id === selectedProvider) || providers[0];
  const models = (provider?.models || []).filter((m) => !m.is_deprecated);

  useEffect(() => {
    if (!models.length) return;
    if (!selectedModel || !models.some((m) => m.id === selectedModel)) {
      const rec = models.find((m) => m.recommended);
      setSelectedModel(rec?.id || models[0]?.id || "");
    }
  }, [models, selectedModel]);

  const onKeyChange = (value) => {
    setApiKey(value);
    if (!value.trim()) {
      setKeyValidation({ status: "idle", message: "" });
      return;
    }
    const check = aiSettingsService.formatValidateKey(selectedProvider, value);
    setKeyValidation({ status: check.valid ? "idle" : "invalid", message: check.message });
  };

  const onValidate = async () => {
    if (!apiKey.trim()) return;
    setValidating(true);
    setKeyValidation({ status: "checking", message: "Checking..." });
    try {
      const result = await aiSettingsService.validateKey(selectedProvider, apiKey);
      setKeyValidation({ status: result.valid ? "valid" : "invalid", message: result.message });
    } catch {
      setKeyValidation({ status: "error", message: "Validation failed. Try again." });
    } finally {
      setValidating(false);
    }
  };

  const onSave = async () => {
    if (!apiKey.trim()) return;
    const format = aiSettingsService.formatValidateKey(selectedProvider, apiKey);
    if (!format.valid) {
      setKeyValidation({ status: "invalid", message: format.message });
      return;
    }
    setSaving(true);
    try {
      const userId = localStorage.getItem("user_id");
      if (userId) {
        await aiSettingsService.saveSettings(userId, {
          provider: selectedProvider,
          api_key_encrypted: apiKey,
          selected_model: selectedModel,
          enable_insights: true,
          default_reasoning_effort: "none",
          is_key_valid: keyValidation.status === "valid",
        });
      }
      onComplete(false);
    } catch (e) {
      console.error("AI settings save error:", e);
      onComplete(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        {provider ? (
          <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/60 rounded-2xl p-6 md:p-7 border border-indigo-200/40">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center p-1.5">
                <ProviderIcon providerId={selectedProvider} size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-lg mb-1">About {provider.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">{provider.description}</p>
                <a href={provider.docs_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">Get your API key <ExternalLink className="w-3.5 h-3.5" /></a>
              </div>
            </div>
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Choose Provider</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {providers.map((p) => (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => { setSelectedProvider(p.id); setApiKey(""); setKeyValidation({ status: "idle", message: "" }); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedProvider(p.id);
                    setApiKey("");
                    setKeyValidation({ status: "idle", message: "" });
                  }
                }}
                className={`relative cursor-pointer p-5 rounded-2xl border-2 transition-all ${selectedProvider === p.id ? "border-primary bg-primary/5 shadow-lg shadow-primary/15" : "border-gray-200 hover:border-gray-300 bg-white"}`}
              >
                {selectedProvider === p.id ? <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white" /></div> : null}
                <div className="flex items-center justify-center h-16 mb-3"><ProviderIcon providerId={p.id} size={44} /></div>
                <p className="font-semibold text-gray-900 text-center">{p.name}</p>
                <p className="text-sm text-gray-500 mt-0.5 text-center">{p.models?.length || 0} models</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide"><Key className="w-4 h-4" /> {provider?.name || "Provider"} API Key</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => onKeyChange(e.target.value)} className="w-full px-5 py-3.5 pr-12 rounded-2xl border-2 border-gray-300 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono text-sm" placeholder={`${provider?.key_prefix || "sk-"}...`} />
              <button type="button" onClick={() => setShowKey((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-gray-100 text-gray-500">{showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
            <button type="button" onClick={onValidate} disabled={validating || !apiKey.trim()} className="px-5 py-3.5 text-sm font-bold rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 border-2 border-indigo-200">{validating ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Checking...</span> : "Validate Key"}</button>
          </div>
          {keyValidation.message ? <p className="mt-3 text-sm text-gray-600">{keyValidation.message}</p> : null}
        </div>

        <div className="border-t border-gray-100" />

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Model Selection</label>
          <div className="space-y-2.5">
            {models.map((m) => (
              <div
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedModel(m.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedModel(m.id);
                  }
                }}
                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${selectedModel === m.id ? "border-primary bg-primary/5 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                    <span className="font-semibold text-gray-900">{m.name || m.label}</span>
                    {m.recommended && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md flex-shrink-0">
                        <Zap className="w-3 h-3" /> Recommended
                      </span>
                    )}
                    {m.is_preview && (
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md flex-shrink-0">
                        Preview
                      </span>
                    )}
                    {m.reasoning_supported && (
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md flex-shrink-0">
                        {m.reasoning_label || 'Reasoning'}
                      </span>
                    )}
                  </div>
                  {selectedModel === m.id && (
                    <span className="flex items-center gap-1.5 text-primary text-sm font-semibold flex-shrink-0">
                      <Check className="w-4 h-4" /> Selected
                    </span>
                  )}
                </div>
                {m.description ? <p className="text-sm text-gray-500">{m.description}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onSave} disabled={!apiKey.trim() || saving} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold ${apiKey.trim() && !saving ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{saving ? "Saving..." : "Complete Setup"}</button>
          <button type="button" onClick={() => setShowSkipModal(true)} className="px-4 py-3 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100">Skip</button>
        </div>
      </div>

      <AnimatePresence>{showSkipModal ? <SkipAIModal userName={userName} onSkip={() => onComplete(true)} onConfigure={() => setShowSkipModal(false)} /> : null}</AnimatePresence>
    </>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { displayName, fullName, avatarUrl, user, loading: authLoading } = useUser();
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState(() => localStorage.getItem("user_name") || "");
  const [initialAvatarUrl, setInitialAvatarUrl] = useState(() => localStorage.getItem("user_avatar") || "");
  const [isCompleting, setIsCompleting] = useState(false);

  // Guard: only run the onboarding-status check ONCE per mount.
  // Without this, events like TOKEN_REFRESHED cause `user` to become a new
  // object reference (same data, different identity) which re-triggers the
  // effect mid-flow. If the user already saved Step 1 (which writes country_code),
  // the re-triggered check would see country_code set → treat them as onboarded
  // → redirect to /dashboard while they're on Step 2.
  const hasCheckedOnboarding = useRef(false);

  useEffect(() => {
    const fromStorage = localStorage.getItem("user_name") || "";
    const resolved = fromStorage || displayName || fullName || "";
    if (resolved && (!userName || userName !== resolved)) {
      setUserName(resolved);
      localStorage.setItem("user_name", resolved);
    }
  }, [displayName, fullName, userName]);

  useEffect(() => {
    const fromStorage = localStorage.getItem("user_avatar") || "";
    const resolved = avatarUrl || fromStorage;
    if (resolved && resolved !== initialAvatarUrl) setInitialAvatarUrl(resolved);
    if (resolved) localStorage.setItem("user_avatar", resolved);
  }, [avatarUrl, initialAvatarUrl]);

  useEffect(() => {
    // Bail out if still loading — the effect will re-run when authLoading flips to false.
    if (authLoading) return;
    // Bail out if we've already done the check for this session — prevents spurious
    // re-runs caused by TOKEN_REFRESHED creating a new `user` object reference.
    if (hasCheckedOnboarding.current) return;
    if (!user) { router.replace("/login"); return; }
    hasCheckedOnboarding.current = true;
    profileService.getOnboardingStatus(user.id).then((status) => {
      if (status?.onboarding_completed) router.replace("/dashboard");
    }).catch(() => { });
  // Use user?.id (primitive) instead of user (object ref) so TOKEN_REFRESHED,
  // USER_UPDATED etc. — which create a new user object but keep the same id —
  // do not re-trigger this effect.
  }, [authLoading, user?.id, router]);

  const handleProfileNext = (savedName) => {
    if (savedName) {
      setUserName(savedName);
      localStorage.setItem("user_name", savedName);
    }
    setStep(2);
  };

  const handleComplete = async (skippedAI = true) => {
    setIsCompleting(true);
    const userId = localStorage.getItem("user_id") || user?.id;
    if (userId) {
      // Attempt to mark onboarding complete — retry once on failure so a transient
      // session-cookie miss doesn't permanently lock users into the setup loop.
      let saved = false;
      for (let attempt = 1; attempt <= 2 && !saved; attempt++) {
        try {
          const updates = { onboarding_completed: true };
          if (skippedAI) updates.onboarding_skipped_steps = { ai_config: true };
          await profileService.updateProfile(userId, updates);
          saved = true;
        } catch (err) {
          console.error(`Onboarding save error (attempt ${attempt}):`, err);
          if (attempt < 2) {
            // Short delay before retry
            await new Promise((r) => setTimeout(r, 800));
          } else {
            // Both attempts failed — warn the user so they know to try logging in again
            toast({
              title: "Setup saved partially",
              description: "We couldn't save your setup status. If you're redirected to setup on next login, please complete it again or contact support.",
              type: "warning",
              duration: 6000,
            });
          }
        }
      }

      if (saved) {
        // Welcome notification — fire-and-forget
        notificationService.create(
          userId, "general",
          "Welcome to YesBill! 🎉",
          "Your account is set up. Start by adding a service or exploring the dashboard.",
          { path: "/dashboard" }
        ).catch(() => { });

        if (skippedAI) {
          notificationService.getAll(userId).catch(() => []).then((existingNotifs) => {
            const alreadyHasAiNotif = existingNotifs.some((n) => n.type === "ai_config_incomplete");
            if (!alreadyHasAiNotif) {
              notificationService.create(userId, "ai_config_incomplete", "AI features not configured", "Set up an API key in Settings -> AI Configuration to enable bill generation, chat, and agent features.", { path: "/settings/ai" }).catch((e) => console.error("Notification create failed:", e));
            }
          });
        }
      }
    }
    router.replace("/dashboard");
  };

  if (isCompleting) return (
    <AnimatePresence>
      <AppLoadingScreen key="completing" pageType="dashboard" pageName="Dashboard" />
    </AnimatePresence>
  );

  return (
    <AppLayout hideAgentButton={true} lockedNav={true} onboardingMode={true}>
      <div className="p-6 md:p-8 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:w-64 flex-shrink-0">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-black/5 border border-gray-200/50 p-2 space-y-2">
              {[1, 2].map((s) => {
                const isDone = step > s;
                const isCurrent = step === s;
                return (
                  <div key={s} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isDone ? "bg-emerald-50 text-emerald-700" : isCurrent ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/20" : "text-gray-500"}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${isDone ? "bg-emerald-500 text-white" : isCurrent ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>{isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}</span>
                    <span>{s === 1 ? "Profile" : "AI Setup"}</span>
                  </div>
                );
              })}
            </div>
          </motion.aside>

          <motion.main key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 min-w-0 pb-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/5 border border-gray-200/50 p-6 md:p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{step === 1 ? "Set up your profile" : "Configure AI"}</h1>
                <p className="text-gray-500 text-base">{step === 1 ? "Fill in your details to personalize YesBill." : "Connect an AI provider to unlock bill generation, insights, and chat."}</p>
              </div>
              <AnimatePresence mode="wait">
                {step === 1 ? <motion.div key="profile" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}><ProfileStep onNext={handleProfileNext} initialName={userName} initialAvatarUrl={initialAvatarUrl} /></motion.div> : <motion.div key="ai" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}><AIStep userName={userName} onComplete={handleComplete} /></motion.div>}
              </AnimatePresence>
            </div>
            <p className="text-center text-xs text-gray-400 mt-5">You can update all of this later in <span className="text-gray-500">Settings</span>.</p>
          </motion.main>
        </div>
      </div>
    </AppLayout>
  );
}
