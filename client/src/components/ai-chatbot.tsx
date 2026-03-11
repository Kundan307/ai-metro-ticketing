import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircleIcon, SendIcon, XIcon, BotIcon, UserIcon, SparklesIcon, TrashIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/components/language-provider";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

const INITIAL_SUGGESTIONS = [
  "Next train timing",
  "Platform info",
  "Plan a route",
  "Crowd levels now",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 inline-block animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg, onSuggestion }: { msg: ChatMessage; onSuggestion: (s: string) => void }) {
  const isUser = msg.role === "user";
  const lines = msg.content.split("\n");

  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center mt-1">
          <BotIcon className="w-3 h-3 text-primary" />
        </div>
      )}
      <div className={`flex flex-col gap-1.5 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted/80 text-foreground rounded-tl-sm"
          }`}
        >
          {lines.map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} className="h-1.5" />;
            const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-");
            const isNumbered = /^\d+\./.test(trimmed);
            if (isBullet || isNumbered) {
              return (
                <div key={i} className="flex gap-1.5 mt-0.5">
                  <span className="flex-shrink-0 mt-0.5 opacity-60 text-xs">{isBullet ? "•" : trimmed.match(/^\d+\./)?.[0]}</span>
                  <span>{isBullet ? trimmed.slice(1).trim() : trimmed.replace(/^\d+\.\s*/, "")}</span>
                </div>
              );
            }
            return <p key={i} className={i > 0 ? "mt-0.5" : ""}>{trimmed}</p>;
          })}
        </div>
        {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {msg.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestion(s)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-primary/25 text-primary bg-primary/5 cursor-pointer transition-colors"
                style={{ lineHeight: 1.4 }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center mt-1">
          <UserIcon className="w-3 h-3 text-primary" />
        </div>
      )}
    </div>
  );
}

export function AIChatbot() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: t("chatbot.greeting"),
      suggestions: INITIAL_SUGGESTIONS,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/chatbot", { message: trimmed });
      const data = await res.json();
      const botMsg: ChatMessage = {
        role: "assistant",
        content: data.reply,
        suggestions: data.suggestions ?? [],
      };
      setMessages((prev) => [...prev, botMsg]);
      if (!isOpen) setHasUnread(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearChat() {
    setMessages([{
      role: "assistant",
      content: t("chatbot.greeting"),
      suggestions: INITIAL_SUGGESTIONS,
    }]);
  }

  const messageCount = messages.filter((m) => m.role === "user").length;

  return (
    <>
      <button
        className="fixed bottom-5 right-5 z-50 group"
        style={{ display: isOpen ? "none" : "block" }}
        onClick={() => setIsOpen(true)}
        data-testid="button-chatbot-open"
        aria-label="Open metro assistant"
      >
        <div className="relative">
          <div className="w-13 h-13 rounded-full bg-primary flex items-center justify-center shadow-lg w-[52px] h-[52px] transition-transform group-hover:scale-105">
            <MessageCircleIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-destructive border-2 border-background" />
          )}
          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Metro Assistant
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
          style={{ width: "360px", height: "520px" }}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-card flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BotIcon className="w-4 h-4 text-primary" />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-chart-2 border border-background" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight" data-testid="text-chatbot-title">
                  {t("chatbot.title")}
                </p>
                <p className="text-[10px] text-chart-2 leading-tight">Online · Namma Metro</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messageCount > 0 && (
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-lg text-muted-foreground cursor-pointer"
                  aria-label="Clear chat"
                  data-testid="button-chatbot-clear"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground cursor-pointer"
                aria-label="Close chat"
                data-testid="button-chatbot-close"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                onSuggestion={(s) => sendMessage(s)}
              />
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start" data-testid="chat-loading">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center mt-1">
                  <BotIcon className="w-3 h-3 text-primary" />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-muted/80">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center gap-2 px-3 py-3 border-t bg-card flex-shrink-0">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chatbot.placeholder")}
              disabled={isLoading}
              className="flex-1 text-sm h-9 rounded-xl bg-muted/40 border-border/60"
              data-testid="input-chatbot-message"
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="h-9 w-9 rounded-xl flex-shrink-0"
              data-testid="button-chatbot-send"
            >
              <SendIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
