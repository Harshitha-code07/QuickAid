import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import {
  Search,
  Activity,
  Flame,
  ShieldAlert,
  Sun,
  Zap,
  Sparkles,
  MapPin,
  Compass,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  HeartOff,
  PhoneCall,
  Award,
  BookOpen,
  Volume2,
  Wifi,
  WifiOff,
  Database,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { FirstAidGuide, EmergencyIssuePreset } from "./types";
import { PRIMARY_EMERGENCY_PRESETS } from "./presets";
import HospitalFinder from "./components/HospitalFinder";
import VoiceInput from "./components/VoiceInput";
import AudioPlayer from "./components/AudioPlayer";

// Icon renderer helper to map preset icon strings to Lucide components
function renderPresetIcon(name: string, className?: string) {
  const IconComponent = (Icons as any)[name] || Activity;
  return <IconComponent className={className} />;
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGuide, setActiveGuide] = useState<FirstAidGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isCustomSymptom, setIsCustomSymptom] = useState(false);

  // Offline Capabilities States
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  // Custom Guide Offline Cache Dictionary
  const [customGuides, setCustomGuides] = useState<Record<string, FirstAidGuide>>(() => {
    try {
      const saved = localStorage.getItem("quick-aid-custom-guides");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Offline Sync Queue
  const [syncQueue, setSyncQueue] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("quick-aid-sync-queue");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Track Online/Offline state changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerBackgroundSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [customGuides]);

  // Load standard "Burns" guide on initial load
  useEffect(() => {
    const defaultPreset = PRIMARY_EMERGENCY_PRESETS.find(p => p.id === "burns");
    if (defaultPreset) {
      setActiveGuide(defaultPreset.guide);
    }
    // Attempt sync if initial state is online
    if (navigator.onLine) {
      triggerBackgroundSync();
    }
  }, []);

  // Save parsed custom guide helper
  const saveCustomGuide = (query: string, guide: FirstAidGuide) => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return;
    setCustomGuides(prev => {
      const updated = { ...prev, [normalized]: guide };
      localStorage.setItem("quick-aid-custom-guides", JSON.stringify(updated));
      return updated;
    });
  };

  // Update Offline Sync Queue helper
  const addToSyncQueue = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSyncQueue(prev => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      localStorage.setItem("quick-aid-sync-queue", JSON.stringify(updated));
      return updated;
    });
  };

  // Background Sync engine trigger
  const triggerBackgroundSync = async () => {
    try {
      const savedQueue = localStorage.getItem("quick-aid-sync-queue");
      const queue: string[] = savedQueue ? JSON.parse(savedQueue) : [];
      if (!navigator.onLine || queue.length === 0) return;

      setIsSyncing(true);
      setSyncMessage(`Reconnected! Synchronizing ${queue.length} offline symptom tutorial(s)...`);

      let parsedSavedGuides = { ...customGuides };
      try {
        const savedGuidesStr = localStorage.getItem("quick-aid-custom-guides");
        if (savedGuidesStr) parsedSavedGuides = JSON.parse(savedGuidesStr);
      } catch (err) {}

      let successCount = 0;
      let remainingQueue = [...queue];

      for (const symptom of queue) {
        try {
          const response = await fetch("/api/first-aid", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ symptom }),
          });

          if (response.ok) {
            const data = await response.json();
            parsedSavedGuides[symptom.toLowerCase().trim()] = data as FirstAidGuide;
            successCount++;
            remainingQueue = remainingQueue.filter(q => q !== symptom);
            localStorage.setItem("quick-aid-sync-queue", JSON.stringify(remainingQueue));
          }
        } catch (err) {
          console.error(`Offline sync request failed for "${symptom}":`, err);
        }
      }

      // Commit custom guides and state updates
      localStorage.setItem("quick-aid-custom-guides", JSON.stringify(parsedSavedGuides));
      setCustomGuides(parsedSavedGuides);
      setSyncQueue(remainingQueue);
      setIsSyncing(false);

      if (successCount > 0) {
        setSyncMessage(`Offline databases updated! Synced ${successCount} topic(s) automatically.`);
        setTimeout(() => {
          setSyncMessage(null);
        }, 5000);
      } else {
        setSyncMessage(null);
      }
    } catch (gErr) {
      console.error("General Background Sync Error:", gErr);
      setIsSyncing(false);
      setSyncMessage(null);
    }
  };

  // Main search action handler
  const handleFirstAidSearch = async (queryText: string) => {
    const query = queryText.trim();
    if (!query) return;

    setLoading(true);
    setErrorHeader(null);
    setErrorDetails([]);
    setIsCustomSymptom(false);
    setIsFromCache(false);
    setActiveStepIndex(0);

    const loweredQuery = query.toLowerCase();
    
    // 1. Search in local high-fidelity presets first (instant loading!)
    const foundPreset = PRIMARY_EMERGENCY_PRESETS.find(
      (preset) =>
        preset.id.includes(loweredQuery) ||
        preset.label.toLowerCase().includes(loweredQuery) ||
        loweredQuery.includes(preset.id) ||
        loweredQuery.includes(preset.label.toLowerCase())
    );

    if (foundPreset) {
      setActiveGuide(foundPreset.guide);
      setLoading(false);
      // Smooth scroll to the results card
      setTimeout(() => {
        document.getElementById("first-aid-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return;
    }

    // 2. Search matches inside offline cache
    if (customGuides[loweredQuery]) {
      setActiveGuide(customGuides[loweredQuery]);
      setIsCustomSymptom(true);
      setIsFromCache(true);
      setLoading(false);
      setTimeout(() => {
        document.getElementById("first-aid-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return;
    }

    // 3. Handle Offline search case (when query isn't preloaded or cached yet)
    if (!isOnline) {
      setLoading(false);
      setErrorHeader("Symptom Search Offline");
      setErrorDetails([
        `"${query}" is not stored in your offline safety storage yet.`,
        "We have automatically scheduled this topic to sync as soon as you have internet connection.",
        "For immediate offline safety, click standard WHO tutorials in the sidebar to review verified practices."
      ]);
      addToSyncQueue(query);
      return;
    }

    // 4. Query Gemini via Full-Stack backend for custom symptom queries
    try {
      const response = await fetch("/api/first-aid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symptom: query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.error || "Failed to contact WHO first aid assistant.",
          steps: data.recoverySteps || [data.details || "Is the server running? Check your terminal logs."]
        };
      }

      const freshGuide = data as FirstAidGuide;
      // Write into persistent custom cache
      saveCustomGuide(query, freshGuide);

      setActiveGuide(freshGuide);
      setIsCustomSymptom(true);

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById("first-aid-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

    } catch (err: any) {
      console.error("AI First Aid Fetch Error:", err);
      // Fallback: search failed due to API / demand issue, allow adding to queue if desired
      setErrorHeader(err.message || "An unexpected connection issue occurred.");
      setErrorDetails(err.steps || [
        "Verify your internet connection.",
        "The server is experiencing temporary unavailability.",
        "You can still access all standard scenarios without any connectivity."
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onPresetClick = (preset: EmergencyIssuePreset) => {
    setSearchQuery("");
    setErrorHeader(null);
    setErrorDetails([]);
    setIsCustomSymptom(false);
    setIsFromCache(false);
    setActiveStepIndex(0);
    setActiveGuide(preset.guide);
    
    // Smooth scroll to results
    setTimeout(() => {
      document.getElementById("first-aid-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Sleek Interface Header Section */}
      <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-blue-900 font-display flex items-center gap-2">
              Quick Aid
              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Pro
              </span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Connectivity Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold select-none ${
              isOnline
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                : "bg-amber-50 text-amber-700 border border-amber-200/50"
            }`}
            title={isOnline ? "You are online. Custom assessments active." : "You are offline. Standard guides fully available."}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span className="hidden sm:inline font-mono">ONLINE</span>
                <span className="sm:hidden">ON</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline font-mono">OFFLINE MODE</span>
                <span className="sm:hidden">OFF</span>
              </>
            )}
          </div>

          <button className="hidden lg:inline-block px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">
            WHO Database v2.4
          </button>
          <a
            href="tel:911"
            className="px-4 md:px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm font-bold rounded-lg shadow-lg shadow-red-200 uppercase tracking-wider transition flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
            <span>Emergency SOS</span>
          </a>
        </div>
      </header>

      {/* Main App View with Split layout (Sleek Interface template style) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
        
        {/* Background Sync Queue Status Indicator */}
        <AnimatePresence>
          {syncMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-blue-600 text-white rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg shadow-blue-200 flex-shrink-0"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  {isSyncing ? (
                    <RefreshCw className="w-4.5 h-4.5 animate-spin text-white" />
                  ) : (
                    <Database className="w-4.5 h-4.5 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold font-display uppercase tracking-wider opacity-90">Offline Cache Sync</p>
                  <p className="text-sm font-semibold mt-0.5">{syncMessage}</p>
                </div>
              </div>
              {syncQueue.length > 0 && (
                <div className="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold">
                  {syncQueue.length} Pending
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Banner Announcement / Reassurance Hero */}
        <section className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-100 border border-blue-800 relative overflow-hidden">
          {/* Subtle decoration vectors */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="max-w-2xl relative z-10">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-200 bg-blue-600/45 border border-blue-400/23 px-3 py-1 rounded-full">
              WHO Evidence-Based First Aid Guidelines
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight mt-3 tracking-tight">
              Instant First Aid, Spoken Out Loud.
            </h2>
            <p className="text-blue-100/90 text-xs sm:text-sm mt-2 leading-relaxed">
              Enter any health crisis or symptom. Our AI searches certified WHO standards to deliver immediate voice-guided treatment routines, keeping you composed while emergency help is on the way.
            </p>
          </div>
        </section>

        {/* Dual Column Layout split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Search, Voice Command, and Preset List */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Search Area */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">
                Search Emergency
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleFirstAidSearch(searchQuery);
                }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Describe symptoms (e.g. burn, choking)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-3 top-2.5 text-blue-600 p-1 bg-white hover:bg-blue-50 rounded-lg shadow-xs transition"
                  title="Search Guidelines"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </form>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleFirstAidSearch(searchQuery)}
                  disabled={loading || !searchQuery.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 font-semibold text-white px-4 py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Symptoms</span>
                </button>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-3 py-2 rounded-xl transition"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Dynamic Offline pending queue */}
              {syncQueue.length > 0 && (
                <div className="mt-4 p-3.5 bg-amber-50/60 border border-amber-200/50 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] text-amber-800 font-bold mb-1 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                      Pending Sync Queue ({syncQueue.length})
                    </span>
                    <button
                      onClick={() => {
                        setSyncQueue([]);
                        localStorage.setItem("quick-aid-sync-queue", "[]");
                      }}
                      className="text-amber-500 hover:text-amber-700 underline text-[10px]"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {syncQueue.map((item, idx) => (
                      <span
                        key={idx}
                        className="bg-white text-amber-900 border border-amber-200/40 text-[10px] px-2 py-0.5 rounded-md font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Voice Command Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">
                Voice Assistant
              </label>
              <VoiceInput
                onTranscriptionComplete={(text) => {
                  setSearchQuery(text);
                  handleFirstAidSearch(text);
                }}
                isLoading={loading}
              />
            </div>

            {/* Custom Common Emergency Scenarios Cards (Styled specifically to template specs) */}
            <div className="flex flex-col">
              <h2 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest pl-1">
                Common Scenarios
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {PRIMARY_EMERGENCY_PRESETS.map((p) => {
                  // Elegant preset styles mapped to mimic the Sleek design spec emojis and hovers
                  let emoji = "🩹";
                  let bgHover = "hover:border-blue-500";
                  if (p.id === "burns") { emoji = "🔥"; }
                  else if (p.id === "choking") { emoji = "🥨"; }
                  else if (p.id === "severe-bleeding") { emoji = "🩸"; }
                  else if (p.id === "fracture") { emoji = "🦴"; }
                  else if (p.id === "heart-attack") { emoji = "🫀"; }
                  else if (p.id === "heatstroke") { emoji = "☀️"; }
                  else if (p.id === "poisoning") { emoji = "🧪"; }
                  else if (p.id === "electric-shock") { emoji = "⚡"; }

                  const isActive = activeGuide?.title.toLowerCase().includes(p.label.toLowerCase());

                  return (
                    <button
                      key={p.id}
                      onClick={() => onPresetClick(p)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all border ${
                        isActive
                          ? "bg-blue-600 border-transparent text-white shadow-lg shadow-blue-100/50"
                          : "bg-white border-slate-200 text-slate-800 hover:border-blue-500 shadow-sm"
                      } group`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center text-lg ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-blue-50/70 text-blue-600 group-hover:bg-blue-500 group-hover:text-white"
                        } transition-colors`}
                      >
                        {emoji}
                      </div>
                      <span className="text-xs font-bold">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nearby Quick Banner */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Nearby Support</p>
                <p className="text-sm font-semibold mt-0.5">Emergency Trauma Centers</p>
              </div>
              <a
                href="#hospital-finder-section"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition text-white"
              >
                <Compass className="w-3.5 h-3.5 animate-spin duration-10000" />
                OPEN FINDER
              </a>
            </div>

          </section>

          {/* Right Column: First Aid WHO Guidelines Deck */}
          <section className="lg:col-span-7 flex flex-col gap-6">

            {/* Global Loading Spinner for Custom Symptoms Assessment */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-lg flex flex-col items-center justify-center gap-4"
                >
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 animate-spin">
                    <Loader2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">Assessing Symptoms with Gemini Agent</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      Strictly formatting live steps with WHO certified response guides. Stay calm.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Gemini API Alert fallbacks */}
            <AnimatePresence>
              {errorHeader && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl border border-amber-200 p-6 md:p-8 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 font-display leading-tight">{errorHeader}</h3>
                      <div className="text-sm text-slate-600 mt-2 leading-relaxed">
                        <ul className="list-disc list-inside space-y-1 text-slate-500 text-xs">
                          {errorDetails.map((step, idx) => (
                            <li key={idx} className="leading-relaxed">{step}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                        <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                          💡 Quick Workaround: Check any of the pre-loaded emergency buttons in the list inside the left sidebar! They work 100% offline.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Interactive Guide Output panel */}
            <AnimatePresence>
              {activeGuide && !loading && (
                <motion.div
                  key={activeGuide.title}
                  id="first-aid-results"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col overflow-hidden"
                >
                  {/* Guide Header section matching the template aesthetics */}
                  <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-6 bg-gradient-to-b from-blue-50/20 to-white">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                          Active Guidance
                        </div>
                        {isFromCache && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-200/30">
                            <Database className="w-3 h-3 text-indigo-500 animate-pulse" />
                            Offline Saved
                          </div>
                        )}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display tracking-tight">
                        {activeGuide.title}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        Source: {activeGuide.whoRef}
                      </p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Severity</span>
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full mt-1.5 uppercase tracking-wide border ${
                          activeGuide.severity === "Critical"
                            ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                            : activeGuide.severity === "Moderate"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {activeGuide.severity}
                      </span>
                    </div>
                  </div>

                  {/* Speech synthesis widget */}
                  <div className="px-6 md:px-8 pt-6">
                    <AudioPlayer
                      guide={activeGuide}
                      activeStepIndex={activeStepIndex}
                      setActiveStepIndex={setActiveStepIndex}
                    />
                  </div>

                  {/* Hot SOS urgent notice banner within Right Side panel */}
                  {(activeGuide.emergencyContactRequired || activeGuide.severity === "Critical") && (
                    <div className="mx-6 md:mx-8 mt-6 p-4 bg-rose-50 border border-rose-200/65 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex gap-3 items-start text-rose-950">
                        <PhoneCall className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <h4 className="font-bold text-xs md:text-sm">Life-Threatening Emergency Notice</h4>
                          <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                            Call professional healthcare responders immediately. Keep speakerphone active.
                          </p>
                        </div>
                      </div>
                      <a
                        href="tel:911"
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl shadow-md shadow-rose-200 transition text-xs"
                      >
                        Call 911 Now
                      </a>
                    </div>
                  )}

                  {/* Scrollable steps lists container */}
                  <div className="p-6 md:p-8 flex-1">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase mb-4 tracking-widest pl-1">
                      Sequential First Aid Instructions
                    </h3>
                    
                    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
                      {activeGuide.steps.map((stepStr, idx) => {
                        const isStepActive = idx === activeStepIndex;
                        return (
                          <button
                            key={idx}
                            onClick={() => setActiveStepIndex(idx)}
                            className="w-full text-left flex gap-4 transition"
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${
                                isStepActive
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-900 text-white"
                              }`}
                            >
                              {String(idx + 1).padStart(2, "0")}
                            </div>
                            
                            <div
                              className={`flex-1 p-4 rounded-xl border-l-4 transition-all ${
                                isStepActive
                                  ? "bg-blue-50 border-blue-600"
                                  : "bg-slate-50/50 border-transparent hover:bg-slate-50"
                              }`}
                            >
                              <p
                                className={`text-sm leading-relaxed ${
                                  isStepActive
                                    ? "text-blue-900 font-medium"
                                    : "text-slate-700"
                                }`}
                              >
                                {stepStr}
                              </p>
                              {isStepActive && (
                                <span className="text-[9px] text-blue-600 font-bold block mt-1.5 uppercase tracking-widest animate-pulse">
                                  🎤 Active TTS Target Highlighted
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Parallel DOs & DON'Ts Column Panels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 md:px-8 pb-8">
                    {/* DOs panel */}
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 flex flex-col gap-3">
                      <h4 className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        RECOMMENDED ACTION DOs
                      </h4>
                      <ul className="space-y-2">
                        {activeGuide.dos.map((doStr, idx) => (
                          <li key={idx} className="flex gap-1.5 items-start text-xs text-emerald-900 leading-relaxed font-medium">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>{doStr}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* DONTs panel */}
                    <div className="bg-rose-50/30 border border-rose-100 rounded-2xl p-5 flex flex-col gap-3">
                      <h4 className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        STRICT PROHIBITIONS DONTs
                      </h4>
                      <ul className="space-y-2">
                        {activeGuide.donts.map((dontStr, idx) => (
                          <li key={idx} className="flex gap-1.5 items-start text-xs text-rose-900/90 leading-relaxed font-medium">
                            <span className="text-rose-500 font-bold">✖</span>
                            <span>{dontStr}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Progress / Step control footer within card */}
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-36 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{
                            width: `${((activeStepIndex + 1) / activeGuide.steps.length) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        STEP {activeStepIndex + 1} OF {activeGuide.steps.length}
                      </span>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activeStepIndex === 0}
                        className="px-5 py-2 bg-slate-200 border border-slate-200 font-bold rounded-lg text-xs hover:bg-slate-300 transition disabled:opacity-40"
                      >
                        PREV
                      </button>
                      <button
                        onClick={() =>
                          setActiveStepIndex((prev) =>
                            Math.min(activeGuide.steps.length - 1, prev + 1)
                          )
                        }
                        disabled={activeStepIndex === activeGuide.steps.length - 1}
                        className="px-5 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition disabled:opacity-40"
                      >
                        NEXT STEP
                      </button>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </section>

        </div>

        {/* GPS Hospital Tracker Map */}
        <section className="section-map mt-4">
          <HospitalFinder />
        </section>

      </main>

      {/* Modern Sleek Footer Layout */}
      <footer className="bg-slate-900 text-slate-300 mt-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              +
            </div>
            <div>
              <p className="font-bold font-display text-sm tracking-tight text-white">Quick Aid Safety Net</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tested & compliant with WHO First Aid Guides.</p>
            </div>
          </div>
          <p className="text-center md:text-right text-[11px] text-slate-400 max-w-lg leading-relaxed select-none">
            Guideline Precedence: Quick Aid provides automated assistants aligning strictly with guidelines published by the World Health Organization. It remains the user's primary responsibility to call expert medical responders during life-threatening crises.
          </p>
        </div>
      </footer>
    </div>
  );
}
