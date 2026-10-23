import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bot,
  CheckCircle2,
  Mic,
  MicOff,
  Plus,
  Send,
  Trash2,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronLeft,
  Copy,
  Pause,
  Play,
  Square,
  AlertTriangle,
  Keyboard,
  X,
  Languages,
} from "lucide-react";
import { AppShell } from "@/components/krishi/app-shell";
import { Button } from "@/components/ui/button";
import { schemes } from "@/data/schemes";
import { useApp, t } from "@/context/app-context";
import { assistantTranslations } from "@/i18n/scheme-translations";
import type { ChatMessage, ChatThread, Language } from "@/types/app";
import { toast } from "sonner";
import { sendFarmerQuestion, checkBackendHealth } from "@/services/chat-service";
import { Link } from "@tanstack/react-router";

// ---------------------------------------------------------------------------
// Language & Speech Configuration
// ---------------------------------------------------------------------------
const SPEECH_LANG_MAP: Record<Language, string> = {
  ta: "ta-IN",
  te: "te-IN",
  en: "en-IN",
  hi: "hi-IN",
};

const LANG_CONFIG: Record<Language, { label: string; nativeName: string; flag: string; promptNote: string }> = {
  en: { label: "English", nativeName: "English", flag: "🇬🇧", promptNote: "Ask in English" },
  ta: { label: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳", promptNote: "தமிழில் கேளுங்கள்" },
  te: { label: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳", promptNote: "తెలుగులో అడగండి" },
  hi: { label: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", promptNote: "हिंदी में पूछें" },
};

function getSeedThread(language: Language): ChatThread {
  const trans = assistantTranslations[language] ?? assistantTranslations.en;
  return {
    id: "welcome",
    title: trans.seed.title,
    updatedAt: "Today",
    messages: [
      {
        id: "m1",
        role: "user" as const,
        content: trans.seed.userMsg,
        createdAt: "10:30",
      },
      {
        id: "m2",
        role: "assistant" as const,
        content: trans.seed.assistantMsg,
        schemeIds: ["pm-kisan", "kcc"],
        confidence: 96,
        createdAt: "10:30",
      },
    ],
  };
}

function chatKey(mobile: string, language: Language) {
  return `km-u-${mobile}-chat-threads-${language}`;
}

function loadThreads(language: Language, mobile: string): ChatThread[] {
  if (typeof window === "undefined" || !mobile) return [];
  try {
    const parsed = JSON.parse(
      localStorage.getItem(chatKey(mobile, language)) ?? "[]"
    ) as ChatThread[];
    if (parsed.length) return parsed;
    return [];
  } catch {
    return [];
  }
}

function saveThreads(v: ChatThread[], language: Language, mobile: string) {
  if (!mobile) return;
  localStorage.setItem(chatKey(mobile, language), JSON.stringify(v));
}

function extractSchemeIdsFromText(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const s of schemes) {
    if (
      lower.includes(s.id.toLowerCase()) ||
      lower.includes(s.name.toLowerCase()) ||
      lower.includes(s.shortName?.toLowerCase() || "___")
    ) {
      if (!found.includes(s.id)) found.push(s.id);
    }
  }
  return found.slice(0, 3);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[🌾💰📋📄🔗⚠️🤖✨🔍📌]/g, "")
    .replace(/[#*_`~|]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "official website link")
    .replace(/\n+/g, ". ")
    .slice(0, 1200);
}

function findVoiceForLanguage(voices: SpeechSynthesisVoice[], lang: Language): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;
  const targetCode = SPEECH_LANG_MAP[lang].toLowerCase().replace("_", "-");
  const langPrefix = lang.toLowerCase();

  // 1. Exact match e.g. "ta-in" or "te-in"
  let match = voices.find((v) => v.lang.toLowerCase().replace("_", "-") === targetCode);
  if (match) return match;

  // 2. Prefix match e.g. starts with "ta" or "te"
  match = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
  if (match) return match;

  // 3. Name-based match (e.g. "Microsoft Valluvar - Tamil" or "Google தமிழ்")
  if (lang === "ta") {
    match = voices.find(
      (v) =>
        v.name.toLowerCase().includes("tamil") ||
        v.name.includes("தமிழ்") ||
        v.lang.toLowerCase().includes("tam")
    );
    if (match) return match;
  } else if (lang === "te") {
    match = voices.find(
      (v) =>
        v.name.toLowerCase().includes("telugu") ||
        v.name.includes("తెలుగు") ||
        v.lang.toLowerCase().includes("tel")
    );
    if (match) return match;
  } else if (lang === "hi") {
    match = voices.find(
      (v) =>
        v.name.toLowerCase().includes("hindi") ||
        v.name.includes("हिन्दी") ||
        v.lang.toLowerCase().includes("hin")
    );
    if (match) return match;
  } else if (lang === "en") {
    match = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
    if (match) return match;
  }

  return null;
}

export function AssistantPage({ threadId }: { threadId: string }) {
  const { language, setLanguage, userMobile } = useApp();
  const navigate = useNavigate();

  // Mode and chat state
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Text mode state
  const [inputText, setInputText] = useState("");

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [voiceDraftText, setVoiceDraftText] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Voice output (TTS) state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const localizedData = assistantTranslations[language] ?? assistantTranslations.en;
  const defaultEmptyThread: ChatThread = {
    id: threadId || "welcome",
    title: "New conversation",
    updatedAt: "Just now",
    messages: [],
  };

  // Populate browser voices on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length) setAvailableVoices(v);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Cleanup speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    setThreads(loadThreads(language, userMobile));
    setTimeout(() => inputRef.current?.focus(), 0);
    checkBackendHealth().then((online) => setIsBackendOnline(online));
  }, [threadId, language, userMobile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threads, loading]);

  const thread = threads.find((t) => t.id === threadId) ?? (threads[0] || defaultEmptyThread);

  const update = (next: ChatThread[]) => {
    setThreads(next);
    saveThreads(next, language, userMobile);
  };

  // ---------------------------------------------------------------------------
  // Speech Synthesis (Voice Output) Handlers
  // ---------------------------------------------------------------------------
  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveSpeakingId(null);
  }, []);

  const speakMessage = useCallback(
    (messageId: string, text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        toast.error("Text-to-Speech is not supported in this browser.");
        return;
      }

      // If this message is already active, handle Pause / Resume
      if (activeSpeakingId === messageId) {
        if (isPaused) {
          window.speechSynthesis.resume();
          setIsPaused(false);
          setIsSpeaking(true);
          return;
        } else if (isSpeaking) {
          window.speechSynthesis.pause();
          setIsPaused(true);
          return;
        }
      }

      // Cancel any currently playing speech before playing new audio
      stopSpeaking();

      const cleanText = cleanTextForSpeech(text);
      if (!cleanText.trim()) {
        toast.info("No readable text found.");
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLangCode = SPEECH_LANG_MAP[language];
      utterance.lang = targetLangCode;
      utterance.rate = 0.95; // Slightly slower, clear cadence for farmers

      const matchedVoice = findVoiceForLanguage(availableVoices, language);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      } else if (language === "ta" || language === "te") {
        toast.info(
          `Note: A dedicated ${LANG_CONFIG[language].nativeName} voice is not installed on this device. Playing with system fallback synthesizer.`
        );
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setActiveSpeakingId(messageId);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveSpeakingId(null);
      };

      utterance.onerror = (e) => {
        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.warn("TTS Error:", e);
        }
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveSpeakingId(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    [activeSpeakingId, isPaused, isSpeaking, language, availableVoices, stopSpeaking]
  );

  // ---------------------------------------------------------------------------
  // Speech Recognition (Voice Input) Handlers
  // ---------------------------------------------------------------------------
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const startListening = useCallback(() => {
    setSpeechError(null);
    stopSpeaking(); // Never speak while user is recording

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      const err = "Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.";
      setSpeechError(err);
      toast.error(err);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognitionClass();
      const targetLangCode = SPEECH_LANG_MAP[language];
      recognition.lang = targetLangCode;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        setInterimTranscript("");
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }
        if (final) {
          setVoiceDraftText((prev) => (prev ? `${prev} ${final}` : final).trim());
          setInterimTranscript("");
        } else {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        setInterimTranscript("");

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          const msg = "Microphone access was denied. Please allow microphone permission in your browser address bar.";
          setSpeechError(msg);
          toast.error(msg);
        } else if (event.error === "no-speech") {
          setSpeechError("No speech detected. Please speak clearly into your device's microphone.");
        } else if (event.error === "network") {
          setSpeechError("Network error occurred during speech recognition. Please check your internet connection.");
        } else if (event.error !== "aborted") {
          setSpeechError(`Voice recognition notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setSpeechError("Could not start microphone. Please check browser microphone permissions.");
      toast.error("Could not activate microphone.");
    }
  }, [language, stopSpeaking]);

  const cancelVoiceDraft = useCallback(() => {
    stopListening();
    setVoiceDraftText("");
    setInterimTranscript("");
    setSpeechError(null);
  }, [stopListening]);

  // ---------------------------------------------------------------------------
  // Language Change Handler
  // ---------------------------------------------------------------------------
  const handleLanguageChange = (newLang: Language) => {
    if (newLang === language) return;
    stopSpeaking();
    stopListening();
    setSpeechError(null);
    setLanguage(newLang);
    toast.success(`Language set to ${LANG_CONFIG[newLang].nativeName} (${LANG_CONFIG[newLang].label})`);
  };

  // ---------------------------------------------------------------------------
  // Submission Pipeline
  // ---------------------------------------------------------------------------
  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // Halt any active speech or listening immediately
    stopListening();
    stopSpeaking();
    setInputText("");
    setVoiceDraftText("");
    setInterimTranscript("");
    setSpeechError(null);

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user" as const,
      content: trimmed,
      createdAt: formatTime(new Date()),
    };

    const currentThreadId = thread.id;
    const exists = threads.some((t) => t.id === currentThreadId);
    const targetThread: ChatThread = exists
      ? threads.find((t) => t.id === currentThreadId)!
      : { id: currentThreadId, title: trimmed.slice(0, 34), updatedAt: "Just now", messages: [] };

    const updatedWithUser = exists
      ? threads.map((t) =>
          t.id === currentThreadId
            ? {
                ...t,
                title: t.messages.length ? t.title : trimmed.slice(0, 34),
                updatedAt: "Just now",
                messages: [...t.messages, userMessage],
              }
            : t
        )
      : [{ ...targetThread, title: trimmed.slice(0, 34), messages: [userMessage] }, ...threads];

    update(updatedWithUser);
    setLoading(true);

    try {
      // Send question and target language to backend
      const response = await sendFarmerQuestion(trimmed, language);
      setIsBackendOnline(true);
      const matchedSchemeIds = extractSchemeIdsFromText(response.answer);

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant" as const,
        content: response.answer,
        schemeIds: matchedSchemeIds,
        confidence: 96,
        createdAt: formatTime(new Date()),
      };

      setThreads((current) => {
        const next = current.map((t) =>
          t.id === currentThreadId
            ? { ...t, updatedAt: "Just now", messages: [...t.messages, assistantMessage] }
            : t
        );
        saveThreads(next, language, userMobile);
        return next;
      });
    } catch (error: any) {
      setIsBackendOnline(false);
      const errorMsg = error.message || "Could not connect to backend.";
      toast.error(errorMsg);

      const errorMsg2: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant" as const,
        content: `⚠️ **Connection Notice:**\n\n${errorMsg}\n\n*Ensure your FastAPI backend is running with:*\n\`uvicorn main:app --reload\``,
        createdAt: formatTime(new Date()),
      };

      setThreads((current) => {
        const next = current.map((t) =>
          t.id === currentThreadId ? { ...t, messages: [...t.messages, errorMsg2] } : t
        );
        saveThreads(next, language, userMobile);
        return next;
      });
    } finally {
      setLoading(false);
      if (inputMode === "text") {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  const createThread = () => {
    stopSpeaking();
    stopListening();
    const id = `chat-${Date.now()}`;
    const next = [
      ...threads,
      { id, title: "New conversation", updatedAt: "Just now", messages: [] },
    ];
    update(next);
    void navigate({ to: "/assistant/$threadId", params: { threadId: id } });
    setSidebarOpen(false);
  };

  const removeThread = (id: string) => {
    if (activeSpeakingId) stopSpeaking();
    const next = threads.filter((t) => t.id !== id);
    update(next);
    if (id === threadId) {
      const target = next[0]?.id ?? "welcome";
      void navigate({ to: "/assistant/$threadId", params: { threadId: target } });
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit(inputText);
    }
  };

  const lastAssistantMsg = [...thread.messages].reverse().find((m) => m.role === "assistant");

  return (
    <AppShell hidePadding>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* ── Sidebar ── */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-card transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-auto`}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="size-5" />
              </span>
              <span className="font-bold text-sm">Krishi Mitra AI</span>
            </div>
            <Button variant="ghost" size="icon" className="size-8 lg:hidden" onClick={() => setSidebarOpen(false)}>
              <ChevronLeft className="size-4" />
            </Button>
          </div>

          {/* New chat button */}
          <div className="p-3 border-b">
            <Button onClick={createThread} variant="outline" className="w-full gap-2 justify-start font-medium text-sm h-9">
              <Plus className="size-4" />
              New conversation
            </Button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {threads.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No conversations yet</p>
            )}
            {threads.map((tItem) => (
              <div key={tItem.id} className="group relative">
                <button
                  onClick={() => {
                    void navigate({ to: "/assistant/$threadId", params: { threadId: tItem.id } });
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    tItem.id === threadId
                      ? "bg-secondary font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <span className="block truncate pr-6">{tItem.title}</span>
                  <span className="text-[10px] text-muted-foreground">{tItem.updatedAt}</span>
                </button>
                <button
                  onClick={() => removeThread(tItem.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-6 grid place-items-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition"
                  aria-label="Delete"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Backend status */}
          <div className="p-3 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`size-2 rounded-full ${isBackendOnline === null ? "bg-muted" : isBackendOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              {isBackendOnline === null ? "Connecting…" : isBackendOnline ? "Backend online" : "Backend offline"}
            </div>
          </div>
        </aside>

        {/* Sidebar backdrop (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Main chat area ── */}
        <div className="flex flex-1 flex-col min-w-0 bg-background">
          {/* Chat header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 bg-card/80 backdrop-blur-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden size-8 grid place-items-center rounded-lg hover:bg-secondary transition text-muted-foreground"
              >
                <ChevronLeft className="size-5 rotate-180" />
              </button>
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs">
                  <Bot className="size-5" />
                </span>
                <div>
                  <b className="block text-sm font-bold">{t(language, "brand_title")}</b>
                  <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Multilingual RAG · Groq · Government Schemes
                  </span>
                </div>
              </div>
            </div>

            {/* Language Selector & Global Audio Stop Button */}
            <div className="flex items-center gap-2">
              {/* Language Selector Pills */}
              <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-xl border">
                {(["en", "ta", "te", "hi"] as Language[]).map((lCode) => {
                  const isSelected = language === lCode;
                  const item = LANG_CONFIG[lCode];
                  return (
                    <button
                      key={lCode}
                      type="button"
                      onClick={() => handleLanguageChange(lCode)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                      }`}
                      title={`Switch language to ${item.label} (${item.nativeName})`}
                    >
                      <span className="text-[13px]">{item.flag}</span>
                      <span>{item.nativeName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Stop Speaking button (visible when TTS is playing) */}
              {isSpeaking && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={stopSpeaking}
                  className="h-8 text-xs gap-1.5 animate-pulse font-semibold"
                  title="Stop speaking aloud"
                >
                  <Square className="size-3 fill-current" /> Stop
                </Button>
              )}

              {/* Header actions */}
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => {
                  if (lastAssistantMsg) speakMessage(lastAssistantMsg.id, lastAssistantMsg.content);
                  else toast.info("No response to read.");
                }}
                title={isSpeaking ? "Pause / Resume speech" : "Read latest answer aloud"}
              >
                {isSpeaking ? (
                  <VolumeX className="size-4 text-primary animate-pulse" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={createThread} title="New conversation">
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {thread.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="grid size-20 place-items-center rounded-2xl bg-primary/10 text-primary mb-5 shadow-xs">
                    <Sparkles className="size-10" />
                  </span>
                  <h2 className="text-2xl font-bold">{t(language, "assistant_welcome_heading")}</h2>
                  <p className="mt-2 text-muted-foreground max-w-sm text-sm">
                    {t(language, "assistant_welcome_sub")}
                  </p>

                  {/* Mode announcement */}
                  <div className="mt-4 flex items-center gap-2 text-xs text-primary font-medium bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20">
                    <span>🎙️ Voice & 💬 Text supported in {LANG_CONFIG[language].nativeName} ({LANG_CONFIG[language].label})</span>
                  </div>

                  {/* Quick action suggested questions */}
                  <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
                    {localizedData.suggested.slice(0, 4).map((q) => (
                      <button
                        key={q}
                        onClick={() => void submit(q)}
                        className="rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {thread.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  {m.role === "assistant" ? (
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs mt-0.5">
                      <Bot className="size-4.5" />
                    </span>
                  ) : (
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground font-bold text-xs mt-0.5">
                      You
                    </span>
                  )}

                  {/* Bubble */}
                  <div className={`group max-w-[85%] sm:max-w-[75%] space-y-2 ${m.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-xs"
                          : "bg-card border shadow-xs rounded-tl-xs text-foreground"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"
                          dangerouslySetInnerHTML={{
                            __html: m.content
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\*(.*?)\*/g, "<em>$1</em>")
                              .replace(/`([^`]+)`/g, "<code class=\"bg-muted px-1 py-0.5 rounded text-xs\">$1</code>")
                              .replace(/\n/g, "<br />"),
                          }}
                        />
                      ) : (
                        <span>{m.content}</span>
                      )}
                    </div>

                    {/* Scheme cards */}
                    {m.schemeIds?.length ? (
                      <div className="grid gap-2 w-full sm:grid-cols-2 pt-1">
                        {m.schemeIds.map((id) => {
                          const s = schemes.find((x) => x.id === id);
                          return s ? (
                            <Link
                              key={id}
                              to="/schemes/$id"
                              params={{ id: s.id }}
                              className="rounded-xl border bg-card p-3 text-xs hover:border-primary/40 hover:shadow-xs transition-all"
                            >
                              <span className="font-bold block text-foreground">{s.shortName}</span>
                              <span className="text-muted-foreground mt-0.5 block line-clamp-1">{s.department}</span>
                              <span className="mt-1.5 inline-flex items-center gap-1 text-primary font-semibold">
                                <CheckCircle2 className="size-3" /> {s.matchScore}% match
                              </span>
                            </Link>
                          ) : null;
                        })}
                      </div>
                    ) : null}

                    {/* Message Action Controls (Copy, Read Aloud, Pause, Stop) */}
                    <div className={`flex items-center gap-1.5 transition-opacity ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <span className="text-[10px] text-muted-foreground px-1">{m.createdAt}</span>

                      {m.role === "assistant" && (
                        <>
                          <button
                            onClick={() => copyMessage(m.id, m.content)}
                            className="size-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition opacity-0 group-hover:opacity-100"
                            title="Copy text"
                          >
                            <Copy className="size-3" />
                          </button>

                          {/* Individual Message Audio Controls */}
                          {activeSpeakingId === m.id ? (
                            <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-md px-1.5 py-0.5">
                              <span className="size-1.5 rounded-full bg-primary animate-ping" />
                              <span className="text-[10px] font-semibold text-primary">
                                {isPaused ? "Paused" : "Speaking"}
                              </span>
                              <button
                                onClick={() => speakMessage(m.id, m.content)}
                                className="size-5 grid place-items-center rounded text-primary hover:bg-primary/20 transition"
                                title={isPaused ? "Resume speaking" : "Pause speech"}
                              >
                                {isPaused ? <Play className="size-3 fill-current" /> : <Pause className="size-3 fill-current" />}
                              </button>
                              <button
                                onClick={stopSpeaking}
                                className="size-5 grid place-items-center rounded text-destructive hover:bg-destructive/20 transition"
                                title="Stop speaking"
                              >
                                <Square className="size-3 fill-current" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => speakMessage(m.id, m.content)}
                              className="size-6 grid place-items-center rounded text-muted-foreground hover:text-primary hover:bg-secondary transition"
                              title={`Listen aloud in ${LANG_CONFIG[language].nativeName}`}
                            >
                              <Volume2 className="size-3.5" />
                            </button>
                          )}

                          {copiedId === m.id && (
                            <span className="text-[10px] text-emerald-600 font-semibold">Copied!</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs mt-0.5">
                    <Bot className="size-4.5" />
                  </span>
                  <div className="rounded-2xl rounded-tl-xs bg-card border px-4 py-3 shadow-xs">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="size-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Quick suggested questions (above input) */}
          {thread.messages.length > 0 && (
            <div className="border-t px-4 py-2 bg-background flex gap-2 overflow-x-auto">
              {localizedData.suggested.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => void submit(q)}
                  disabled={loading}
                  className="shrink-0 rounded-full border border-border bg-card hover:border-primary/40 hover:bg-primary/5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ── Mode Switch & Input Area ── */}
          <div className="border-t bg-card/90 backdrop-blur-xs p-3 sm:p-4">
            <div className="max-w-3xl mx-auto space-y-3">
              {/* Mode Toggle Controls */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border">
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode("text");
                      stopListening();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      inputMode === "text"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Keyboard className="size-3.5" />
                    <span>Text Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode("voice");
                      setSpeechError(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      inputMode === "voice"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Mic className="size-3.5 text-primary" />
                    <span>Voice Mode</span>
                    {isListening && (
                      <span className="size-1.5 rounded-full bg-red-500 animate-ping" />
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span>Language:</span>
                  <span className="font-semibold text-foreground">
                    {LANG_CONFIG[language].flag} {LANG_CONFIG[language].nativeName} ({SPEECH_LANG_MAP[language]})
                  </span>
                </div>
              </div>

              {/* ── Text Mode View ── */}
              {inputMode === "text" ? (
                <div>
                  <div className="flex items-end gap-2 rounded-2xl border bg-background shadow-xs px-4 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`${LANG_CONFIG[language].promptNote} (${LANG_CONFIG[language].label})…`}
                      disabled={loading}
                      className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground max-h-32 min-h-[2.25rem] py-1"
                      style={{ fieldSizing: "content" } as any}
                    />
                    <div className="flex items-center gap-1 pb-1">
                      {/* Quick Mic shortcut inside text mode */}
                      <button
                        type="button"
                        onClick={() => {
                          setInputMode("voice");
                          startListening();
                        }}
                        className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                        title="Switch to Voice Mode"
                      >
                        <Mic className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void submit(inputText)}
                        disabled={loading || !inputText.trim()}
                        className="size-8 grid place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        title="Send"
                      >
                        <Send className="size-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                    Press <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">Enter</kbd> to send · <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">Shift+Enter</kbd> for new line
                  </p>
                </div>
              ) : (
                /* ── Voice Mode View ── */
                <div className="rounded-2xl border bg-background p-4 shadow-xs space-y-3">
                  {/* Status header */}
                  <div className="flex items-center justify-between border-b pb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${isListening ? "bg-red-500 animate-ping" : "bg-emerald-500"}`} />
                      <span className="font-semibold">
                        {isListening
                          ? `Listening in ${LANG_CONFIG[language].nativeName} (${SPEECH_LANG_MAP[language]})...`
                          : `Voice Mode · ${LANG_CONFIG[language].nativeName} (${SPEECH_LANG_MAP[language]})`}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Speech Recognition: Browser Native (ta-IN, en-IN, te-IN)
                    </span>
                  </div>

                  {/* Large Microphone Action Button */}
                  <div className="flex flex-col items-center justify-center py-2 text-center space-y-2.5">
                    <div className="relative">
                      {isListening && (
                        <span className="absolute -inset-3 rounded-full bg-red-500/20 animate-ping" />
                      )}
                      <button
                        type="button"
                        onClick={isListening ? stopListening : startListening}
                        disabled={loading}
                        className={`relative size-16 grid place-items-center rounded-full transition-all shadow-md ${
                          isListening
                            ? "bg-red-500 text-white hover:bg-red-600 scale-105"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                        }`}
                        title={isListening ? "Stop listening" : "Click to speak"}
                      >
                        {isListening ? <MicOff className="size-7" /> : <Mic className="size-7" />}
                      </button>
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        {isListening
                          ? `Listening to your voice in ${LANG_CONFIG[language].nativeName}...`
                          : voiceDraftText
                          ? "Review or edit your recognized question below:"
                          : `Click microphone to ask in ${LANG_CONFIG[language].nativeName}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isListening
                          ? "Speak clearly. Click the red button when finished."
                          : "Your speech will be converted to text and verified against agricultural schemes."}
                      </p>
                    </div>

                    {/* Live interim transcript display */}
                    {interimTranscript && (
                      <div className="w-full max-w-lg rounded-xl bg-primary/10 border border-primary/20 p-2.5 text-xs text-primary font-medium animate-pulse text-left">
                        <span className="text-[10px] uppercase font-bold text-primary/70 block mb-0.5">Hearing:</span>
                        "{interimTranscript}"
                      </div>
                    )}
                  </div>

                  {/* Review and Edit Recognized Text */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-muted-foreground">
                        Recognized Question (Editable):
                      </label>
                      {voiceDraftText && (
                        <button
                          type="button"
                          onClick={cancelVoiceDraft}
                          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition"
                        >
                          <X className="size-3" /> Clear text
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={voiceDraftText}
                      onChange={(e) => setVoiceDraftText(e.target.value)}
                      placeholder={`Spoken question in ${LANG_CONFIG[language].nativeName} will appear here. You can also edit it with your keyboard before sending...`}
                      disabled={loading || isListening}
                      className="w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-all placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Error & Warning Alert Banner */}
                  {speechError && (
                    <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">Speech Recognition Notice</p>
                        <p className="mt-0.5 leading-relaxed">{speechError}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSpeechError(null)}
                        className="text-destructive/70 hover:text-destructive text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Voice Controls: Speak Again, Clear, Send */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {isListening ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={stopListening}
                          className="gap-1.5 text-xs h-8 font-semibold"
                        >
                          <Square className="size-3 fill-current" /> Stop Listening
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={startListening}
                          disabled={loading}
                          className="gap-1.5 text-xs h-8"
                        >
                          <Mic className="size-3.5 text-primary" /> Speak Again
                        </Button>
                      )}

                      {voiceDraftText && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={cancelVoiceDraft}
                          disabled={loading || isListening}
                          className="text-xs h-8 text-muted-foreground hover:text-destructive"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={() => void submit(voiceDraftText)}
                      disabled={loading || !voiceDraftText.trim() || isListening}
                      className="gap-2 text-xs font-semibold h-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                    >
                      <Send className="size-3.5" /> Send Voice Question
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
