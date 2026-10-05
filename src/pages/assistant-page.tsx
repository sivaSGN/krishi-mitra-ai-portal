import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bot,
  CheckCircle2,
  FileUp,
  MessageSquarePlus,
  Mic,
  Plus,
  Trash2,
  Volume2,
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
        confidence: 94,
        createdAt: "10:30",
      },
    ],
  };
}

function loadThreads(language: Language) {
  const defaultSeed = getSeedThread(language);
  if (typeof window === "undefined") return [defaultSeed];
  try {
    const parsed = JSON.parse(localStorage.getItem(`km-chat-threads-${language}`) ?? "[]") as ChatThread[];
    if (parsed.length) return parsed;
    return [defaultSeed];
  } catch {
    return [defaultSeed];
  }
}

function saveThreads(v: ChatThread[], language: Language) {
  localStorage.setItem(`km-chat-threads-${language}`, JSON.stringify(v));
}

function generateMockReply(text: string, language: Language) {
  const q = text.toLowerCase();
  const trans = assistantTranslations[language]?.mockReplies ?? assistantTranslations.en.mockReplies;

  if (q.includes("document") || q.includes("ஆவணம்") || q.includes("పత్రాలు") || q.includes("दस्तावेज़")) {
    return {
      content: trans.document,
      schemeIds: [],
    };
  }
  if (q.includes("solar") || q.includes("pump") || q.includes("சோலார்") || q.includes("సోలార్") || q.includes("सोलर")) {
    return {
      content: trans.solar,
      schemeIds: ["pm-kusum"],
    };
  }
  if (q.includes("insurance") || q.includes("crop") || q.includes("காப்பீடு") || q.includes("బీమా") || q.includes("बीमा")) {
    return {
      content: trans.insurance,
      schemeIds: ["pmfby"],
    };
  }
  if (q.includes("loan") || q.includes("credit") || q.includes("கடன்") || q.includes("రుణ") || q.includes("ऋण")) {
    return {
      content: trans.loan,
      schemeIds: ["kcc"],
    };
  }
  if (q.includes("apply") || q.includes("pm-kisan") || q.includes("விண்ணப்ப") || q.includes("దరఖాస్తు") || q.includes("आवेदन")) {
    return {
      content: trans.apply,
      schemeIds: ["pm-kisan"],
    };
  }
  return {
    content: trans.default,
    schemeIds: ["pm-kisan", "kcc", "pm-kusum"],
  };
}

export function AssistantPage({ threadId }: { threadId: string }) {
  const { language } = useApp();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const localizedData = assistantTranslations[language] ?? assistantTranslations.en;
  const seed = getSeedThread(language);

  useEffect(() => {
    setThreads(loadThreads(language));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [threadId, language]);

  const thread = threads.find((t) => t.id === threadId) ?? (threads[0] || seed);

  const update = (next: ChatThread[]) => {
    setThreads(next);
    saveThreads(next, language);
  };

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    const user: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user" as const,
      content: text.trim(),
      createdAt: "Now",
    };
    const base = threads.some((t) => t.id === threadId)
      ? threads
      : [...threads, { ...seed, id: threadId, title: text.slice(0, 34), messages: [] }];
    update(
      base.map((t) =>
        t.id === threadId
          ? {
              ...t,
              title: t.messages.length ? t.title : text.slice(0, 34),
              updatedAt: "Now",
              messages: [...t.messages, user],
            }
          : t,
      ),
    );
    setLoading(true);
    setTimeout(() => {
      const answer = generateMockReply(text, language);
      setThreads((current) => {
        const next = current.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: [
                  ...t.messages,
                  {
                    id: `a-${Date.now()}`,
                    role: "assistant" as const,
                    content: answer.content,
                    schemeIds: answer.schemeIds,
                    confidence: 92,
                    createdAt: "Now",
                  },
                ],
              }
            : t,
        );
        saveThreads(next, language);
        return next;
      });
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }, 900);
  };

  const createThread = () => {
    const id = `chat-${Date.now()}`;
    const next = [
      ...threads,
      { id, title: t(language, "New conversation"), updatedAt: "Now", messages: [] },
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
            <Button onClick={createThread}>
              <MessageSquarePlus />
              {t(language, "New conversation")}
            </Button>
          }
        />
        <div className="grid min-h-[calc(100vh-12rem)] overflow-hidden rounded-lg border bg-card shadow-sm lg:grid-cols-[260px_1fr]">
          <aside className="hidden border-r bg-muted/40 p-3 lg:block">
            <Button onClick={createThread} variant="outline" className="mb-3 w-full">
              <Plus />
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
                        ? "bg-secondary text-foreground "
                        : "text-muted-foreground ") +
                      "min-w-0 flex-1 rounded-md px-3 py-2 text-sm font-semibold hover:bg-secondary"
                    }
                  >
                    <span className="block truncate">{tItem.title}</span>
                    <span className="text-[10px] font-normal">{tItem.updatedAt}</span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-h-11 min-w-11 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => removeThread(tItem.id)}
                    aria-label="Delete conversation"
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          </aside>
          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Bot />
                </span>
                <div>
                  <b className="block">{t(language, "brand_title")}</b>
                  <span className="flex items-center gap-1 text-xs text-success">
                    <span className="size-2 rounded-full bg-success" />
                    {t(language, "Mock assistant online")}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11"
                aria-label={t(language, "Read answers aloud")}
              >
                <Volume2 />
              </Button>
            </div>
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
                      className={m.role === "user" ? "bg-primary text-primary-foreground" : ""}
                    >
                      {m.role === "assistant" && (
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-primary">
                          <Bot className="size-4" />
                          {t(language, "brand_title")}
                        </div>
                      )}
                      <MessageResponse>{m.content}</MessageResponse>
                      {m.schemeIds?.length ? (
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {m.schemeIds.map((id) => {
                            const s = schemes.find((x) => x.id === id);
                            return s ? <SchemeCard key={id} scheme={s} compact /> : null;
                          })}
                        </div>
                      ) : null}
                      {m.role === "assistant" && m.confidence && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="size-4 text-success" />
                          {t(language, "Demo confidence")} {m.confidence}%
                        </div>
                      )}
                    </MessageContent>
                  </Message>
                ))}
                {loading && (
                  <Message from="assistant">
                    <MessageContent>
                      <div className="flex items-center gap-2 text-primary">
                        <Bot className="size-4" />
                        <Shimmer>{t(language, "assistant_reviewing")}</Shimmer>
                      </div>
                    </MessageContent>
                  </Message>
                )}
                <ConversationScrollButton />
              </ConversationContent>
            </Conversation>
            <div className="border-t p-4">
              <div className="mx-auto mb-3 flex max-w-3xl gap-2 overflow-x-auto pb-1">
                {localizedData.suggested.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    onClick={() => submit(q)}
                    className="min-h-11 shrink-0 rounded-full text-xs"
                  >
                    {q}
                  </Button>
                ))}
              </div>
              <PromptInput
                className="mx-auto max-w-3xl"
                accept=".pdf,.jpg,.jpeg,.png"
                onSubmit={({ text, files }) => {
                  if (files.length) toast.success(`${files.length} document attached for demo`);
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
                      tooltip={t(language, "Voice input")}
                      onClick={() => toast.info("Voice input is a demo control")}
                    >
                      <Mic />
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
