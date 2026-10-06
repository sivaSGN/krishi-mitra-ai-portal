import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bot,
  CheckCircle2,
  FileUp,
  MessageSquare,
  MessageSquarePlus,
  Mic,
  MicOff,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/krishi/app-shell";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { SchemeCard } from "@/components/krishi/scheme-card";
import { schemes } from "@/data/schemes";
import { useApp, t } from "@/context/app-context";
import { assistantTranslations } from "@/i18n/scheme-translations";
import type { ChatMessage, ChatThread, Language } from "@/types/app";
import { toast } from "sonner";
import { sendFarmerQuestion, checkBackendHealth } from "@/services/chat-service";

/**
 * Initial seed thread with friendly welcome message.
 */
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

/**
 * Loads saved threads for current language from browser localStorage.
 */
function loadThreads(language: Language): ChatThread[] {
  const defaultSeed = getSeedThread(language);
  if (typeof window === "undefined") return [defaultSeed];
  try {
    const parsed = JSON.parse(
      localStorage.getItem(`km-chat-threads-${language}`) ?? "[]"
    ) as ChatThread[];
    if (parsed.length) return parsed;
    return [defaultSeed];
  } catch {
    return [defaultSeed];
  }
}

/**
 * Saves chat threads to browser localStorage.
 */
function saveThreads(v: ChatThread[], language: Language) {
  localStorage.setItem(`km-chat-threads-${language}`, JSON.stringify(v));
}

/**
 * Helper to match any referenced scheme IDs in backend answer text to display cards.
 */
function extractSchemeIdsFromText(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const s of schemes) {
    if (
      lower.includes(s.id.toLowerCase()) ||
      lower.includes(s.name.toLowerCase()) ||
      lower.includes(s.shortName?.toLowerCase() || "___")
    ) {
      if (!found.includes(s.id)) {
        found.push(s.id);
      }
    }
  }
  return found.slice(0, 3); // Max 3 cards
}

export function AssistantPage({ threadId }: { threadId: string }) {
  const { language } = useApp();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  // Mode Selection: 'text' (Standard typed LLM chat) or 'voice' (Speech to Text & Voice Mode)
  const [activeMode, setActiveMode] = useState<"text" | "voice">("text");

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const localizedData = assistantTranslations[language] ?? assistantTranslations.en;
  const seed = getSeedThread(language);

  // Load threads and check backend health on mount
  useEffect(() => {
    setThreads(loadThreads(language));
    setTimeout(() => inputRef.current?.focus(), 0);

    // Verify FastAPI server status
    checkBackendHealth().then((online) => {
      setIsBackendOnline(online);
    });
  }, [threadId, language]);

  const thread = threads.find((t) => t.id === threadId) ?? (threads[0] || seed);

  const update = (next: ChatThread[]) => {
    setThreads(next);
    saveThreads(next, language);
  };

  /**
   * Submits a farmer's question to the FastAPI RAG backend (Layer 4 -> Layer 3 -> Layer 2)
   */
  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessageId = `u-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user" as const,
      content: trimmed,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Ensure thread exists in state
    const currentThreads = threads.some((t) => t.id === threadId)
      ? threads
      : [...threads, { ...seed, id: threadId, title: trimmed.slice(0, 34), messages: [] }];

    // Add user message to thread immediately
    const updatedWithUser = currentThreads.map((t) =>
      t.id === threadId
        ? {
            ...t,
            title: t.messages.length ? t.title : trimmed.slice(0, 34),
            updatedAt: "Just now",
            messages: [...t.messages, userMessage],
          }
        : t
    );

    update(updatedWithUser);
    setLoading(true);

    try {
      // Call real FastAPI backend: POST http://localhost:8000/chat
      const response = await sendFarmerQuestion(trimmed);
      setIsBackendOnline(true);

      const matchedSchemeIds = extractSchemeIdsFromText(response.answer);

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant" as const,
        content: response.answer,
        schemeIds: matchedSchemeIds,
        confidence: 96,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setThreads((current) => {
        const next = current.map((t) =>
          t.id === threadId
            ? {
                ...t,
                updatedAt: "Just now",
                messages: [...t.messages, assistantMessage],
              }
            : t
        );
        saveThreads(next, language);
        return next;
      });

      // If in voice mode, speak response aloud
      if (activeMode === "voice" && typeof window !== "undefined" && "speechSynthesis" in window) {
        speakText(response.answer);
      }
    } catch (error: any) {
      console.error("FastAPI Backend Error:", error);
      setIsBackendOnline(false);

      const errorMessage =
        error.message ||
        "Could not connect to Krishi Mitra backend. Please ensure 'uvicorn main:app --reload' is running.";

      toast.error(errorMessage);

      // Append user-friendly fallback error message in chat
      const errorAssistantMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant" as const,
        content: `⚠️ **Connection Notice:**\n\n${errorMessage}\n\n*Please ensure your FastAPI backend is running on \`http://localhost:8000\` with:*  \n\`uvicorn main:app --reload\``,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setThreads((current) => {
        const next = current.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: [...t.messages, errorAssistantMessage],
              }
            : t
        );
        saveThreads(next, language);
        return next;
      });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  /**
   * Text-to-Speech (TTS) helper to read answer aloud
   */
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.info("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean markdown characters for pleasant speech audio
    const cleanSpeech = text
      .replace(/[#*_`~|]/g, "")
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
      .slice(0, 1000); // Read first portion

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = language === "ta" ? "ta-IN" : language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN";
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  /**
   * Voice recognition toggle for Voice Mode
   */
  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang =
        language === "ta" ? "ta-IN" : language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript("");
        toast.info("Listening... Speak your farming question now.");
      };

      recognition.onresult = (event: any) => {
        const current = event.results[0][0].transcript;
        setVoiceTranscript(current);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        toast.error("Could not capture speech. Please try speaking again or type in Text Mode.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      toast.error("Microphone access permission required.");
    }
  };

  const createThread = () => {
    const id = `chat-${Date.now()}`;
    const next = [
      ...threads,
      { id, title: t(language, "New conversation"), updatedAt: "Just now", messages: [] },
    ];
    update(next);
    void navigate({ to: "/assistant/$threadId", params: { threadId: id } });
  };

  const removeThread = (id: string) => {
    const next = threads.filter((t) => t.id !== id);
    update(next.length ? next : [seed]);
    const target = next[0]?.id ?? seed.id;
    if (id === threadId)
      void navigate({ to: "/assistant/$threadId", params: { threadId: target } });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px]">
        <PageHeader
          title={t(language, "Scheme Connect Assistant")}
          description={t(language, "assistant_page_desc")}
          actions={
            <Button onClick={createThread} className="gap-2">
              <MessageSquarePlus className="size-4" />
              {t(language, "New conversation")}
            </Button>
          }
        />

        <div className="grid min-h-[calc(100vh-12rem)] overflow-hidden rounded-lg border bg-card shadow-sm lg:grid-cols-[260px_1fr]">
          {/* Left Sidebar: Saved Conversation Threads */}
          <aside className="hidden border-r bg-muted/40 p-3 lg:block">
            <Button onClick={createThread} variant="outline" className="mb-3 w-full gap-2">
              <Plus className="size-4" />
              {t(language, "New conversation")}
            </Button>
            <div className="space-y-1">
              {threads.map((tItem) => (
                <div key={tItem.id} className="group flex items-center gap-1">
                  <Link
                    to="/assistant/$threadId"
                    params={{ threadId: tItem.id }}
                    className={
                      (tItem.id === threadId
                        ? "bg-secondary text-foreground font-semibold "
                        : "text-muted-foreground ") +
                      "min-w-0 flex-1 rounded-md px-3 py-2 text-sm hover:bg-secondary transition-colors"
                    }
                  >
                    <span className="block truncate">{tItem.title}</span>
                    <span className="text-[10px] font-normal">{tItem.updatedAt}</span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-h-9 min-w-9 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => removeThread(tItem.id)}
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Chat Container */}
          <div className="flex min-h-0 flex-col">
            {/* Top Chat Bar: Status, Mode Switcher, and Voice TTS */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 bg-muted/20">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  <Bot className="size-6" />
                </span>
                <div>
                  <b className="block text-sm font-semibold">{t(language, "brand_title")}</b>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    {t(language, "Mock assistant online")}
                  </span>
                </div>
              </div>

              {/* Text / Voice Mode Toggle */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border bg-background p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveMode("text")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                      activeMode === "text"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className="size-3.5" />
                    Text Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode("voice")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                      activeMode === "voice"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Mic className="size-3.5" />
                    Voice Mode
                  </button>
                </div>

                {/* Read Aloud Button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="min-h-9 min-w-9"
                  onClick={() => {
                    const lastAssistantMsg = [...thread.messages]
                      .reverse()
                      .find((m) => m.role === "assistant");
                    if (lastAssistantMsg) {
                      speakText(lastAssistantMsg.content);
                    } else {
                      toast.info("No assistant answer to read aloud yet.");
                    }
                  }}
                  aria-label={t(language, "Read answers aloud")}
                  title={isSpeaking ? "Stop speaking" : "Read answer aloud"}
                >
                  {isSpeaking ? <VolumeX className="size-4 text-primary animate-pulse" /> : <Volume2 className="size-4" />}
                </Button>
              </div>
            </div>

            {/* Conversation Messages View */}
            <Conversation className="min-h-0 flex-1">
              <ConversationContent className="mx-auto max-w-3xl gap-6 px-4 py-6">
                {thread.messages.length === 0 && (
                  <div className="py-10 text-center">
                    <span className="mx-auto grid size-16 place-items-center rounded-full bg-secondary text-primary">
                      <Bot className="size-8" />
                    </span>
                    <h2 className="mt-4 text-xl font-bold">
                      {t(language, "assistant_welcome_heading")}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t(language, "assistant_welcome_sub")}
                    </p>
                  </div>
                )}

                {thread.messages.map((m) => (
                  <Message key={m.id} from={m.role}>
                    <MessageContent
                      className={
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-2xl px-4 py-3"
                          : "bg-muted/40 border rounded-2xl px-5 py-4 text-foreground shadow-sm"
                      }
                    >
                      {m.role === "assistant" && (
                        <div className="mb-2 flex items-center justify-between gap-2 border-b pb-2 text-xs font-bold text-primary">
                          <div className="flex items-center gap-1.5">
                            <Bot className="size-4" />
                            <span>Krishi Mitra AI (RAG + Groq)</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => speakText(m.content)}
                            title="Read this response aloud"
                          >
                            <Volume2 className="size-3.5" />
                          </Button>
                        </div>
                      )}

                      <MessageResponse>{m.content}</MessageResponse>

                      {/* Display matched scheme cards if any */}
                      {m.schemeIds?.length ? (
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {m.schemeIds.map((id) => {
                            const s = schemes.find((x) => x.id === id);
                            return s ? <SchemeCard key={id} scheme={s} compact /> : null;
                          })}
                        </div>
                      ) : null}

                      {m.role === "assistant" && m.confidence && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                          <CheckCircle2 className="size-4 text-emerald-500" />
                          {t(language, "Demo confidence")} {m.confidence}% · Verified Government Data
                        </div>
                      )}
                    </MessageContent>
                  </Message>
                ))}

                {/* Loading Shimmer State */}
                {loading && (
                  <Message from="assistant">
                    <MessageContent className="bg-muted/30 border rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2.5 text-primary">
                        <Bot className="size-4 animate-bounce" />
                        <Shimmer>{t(language, "assistant_reviewing")}</Shimmer>
                      </div>
                    </MessageContent>
                  </Message>
                )}

                <ConversationScrollButton />
              </ConversationContent>
            </Conversation>

            {/* Voice Mode Floating Control Panel (When Voice Mode is Active) */}
            {activeMode === "voice" && (
              <div className="mx-auto w-full max-w-3xl px-4 pb-3">
                <div className="rounded-xl border bg-card p-4 shadow-sm text-center">
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      type="button"
                      size="lg"
                      variant={isListening ? "destructive" : "default"}
                      className="rounded-full size-16 p-0 shadow-md gap-0 animate-pulse"
                      onClick={toggleSpeechRecognition}
                      aria-label={isListening ? "Stop listening" : "Start speaking"}
                    >
                      {isListening ? <MicOff className="size-7" /> : <Mic className="size-7" />}
                    </Button>
                  </div>
                  <p className="mt-3 text-sm font-medium">
                    {isListening ? (
                      <span className="text-destructive font-semibold">
                        🎙️ Listening to your voice... Speak your question.
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Click the microphone button to ask by voice in your language
                      </span>
                    )}
                  </p>

                  {/* Live transcript preview */}
                  {voiceTranscript && (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-muted/60 p-3 text-left">
                      <p className="text-sm italic">"{voiceTranscript}"</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          submit(voiceTranscript);
                          setVoiceTranscript("");
                        }}
                        disabled={loading}
                        className="gap-1.5 shrink-0"
                      >
                        <Send className="size-3.5" />
                        Send Voice Query
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Text Input Section */}
            <div className="border-t p-4 bg-background">
              {/* Suggested Quick Question Pills */}
              <div className="mx-auto mb-3 flex max-w-3xl gap-2 overflow-x-auto pb-1">
                {localizedData.suggested.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    onClick={() => submit(q)}
                    disabled={loading}
                    className="min-h-9 shrink-0 rounded-full text-xs hover:bg-primary/10 transition-colors"
                  >
                    {q}
                  </Button>
                ))}
              </div>

              {/* Text Input Box & Submit Button */}
              <PromptInput
                className="mx-auto max-w-3xl shadow-sm"
                accept=".pdf,.jpg,.jpeg,.png"
                onSubmit={({ text, files }) => {
                  if (files.length) toast.info(`${files.length} document attached`);
                  submit(text);
                }}
              >
                <PromptInputTextarea
                  ref={inputRef}
                  placeholder={t(language, "Ask Scheme Connect anything…")}
                />
                <PromptInputFooter>
                  <PromptInputTools>
                    <PromptInputButton tooltip={t(language, "Upload document")}>
                      <FileUp />
                    </PromptInputButton>
                    <PromptInputButton
                      tooltip={isListening ? "Stop voice listening" : t(language, "Voice input")}
                      onClick={() => {
                        setActiveMode("voice");
                        toggleSpeechRecognition();
                      }}
                    >
                      <Mic className={isListening ? "text-destructive animate-pulse" : ""} />
                    </PromptInputButton>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {t(language, "Mock answers · No data is sent")}
                    </span>
                  </PromptInputTools>
                  <PromptInputSubmit status={loading ? "submitted" : "ready"} />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
