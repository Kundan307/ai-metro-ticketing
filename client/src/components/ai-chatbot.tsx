import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircleIcon, SendIcon, XIcon, BotIcon, UserIcon, TrashIcon,
  Loader2Icon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/components/language-provider";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  action?: string;
}

const INITIAL_SUGGESTIONS = [
  "Next train timing",
  "Plan a route",
  "Book a ticket to Indiranagar",
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
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
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
                className="text-[11px] px-2.5 py-1 rounded-full border border-primary/25 text-primary bg-primary/5 cursor-pointer transition-colors hover:bg-primary/15"
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
      content: "Hello! I'm your SmartAI Metro Assistant. I can help you find routes, check timings, or book tickets. Type a message below to get started!",
      suggestions: INITIAL_SUGGESTIONS,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [conversationState, setConversationState] = useState<{
    intent?: string;
    sourceStation?: { id: number; name: string };
    destStation?: { id: number; name: string };
    passengers?: number;
  }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/assistant", { 
        message: trimmed,
        conversationState,
        isVoice: false
      });
      const data = await res.json();
      
      const botMsg: ChatMessage = {
        role: "assistant",
        content: data.reply,
        suggestions: data.suggestions ?? [],
        action: data.action,
      };
      
      setMessages((prev) => [...prev, botMsg]);
      setConversationState(data.nextState || {});
      
      if (!isOpen) setHasUnread(true);
      
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearChat() {
    setConversationState({});
    setMessages([{
      role: "assistant",
      content: "Chat cleared! How can I help you today?",
      suggestions: INITIAL_SUGGESTIONS,
    }]);
  }

  const messageCount = messages.filter((m) => m.role === "user").length;

  return (
    <>
      <button
        className="fixed bottom-5 right-5 z-50 group hover:scale-105 transition-transform"
        style={{ display: isOpen ? "none" : "block" }}
        onClick={() => setIsOpen(true)}
        data-testid="button-chatbot-open"
      >
        <div className="relative">
          <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <MessageCircleIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive border-2 border-background animate-pulse" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
          style={{ width: "360px", height: "540px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-primary flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <BotIcon className="w-4 h-4 text-white" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight text-white shadow-sm">
                  SmartAI Assistant
                </p>
                <div className="flex items-center gap-1 mt-0.5 text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 opacity-80" />
                  <span className="text-[10px] leading-tight">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-white/80">
              {messageCount > 0 && (
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Clear chat"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 bg-secondary/5">
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

          <div className="flex items-center gap-2 px-3 py-3 border-t bg-card flex-shrink-0 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 text-sm rounded-xl bg-muted/40 border-border/60 min-h-[40px]"
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="h-10 w-10 rounded-xl flex-shrink-0 bg-primary text-primary-foreground"
            >
              {isLoading ? (
                 <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                 <SendIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

