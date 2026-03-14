import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MicIcon, MicOffIcon, XIcon, BotIcon, UserIcon,
  Volume2Icon, Loader2Icon, PhoneCallIcon,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

interface VoiceMessage {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

interface VoiceState {
  intent?: string;
  sourceStation?: { id: number; name: string };
  destStation?: { id: number; name: string };
  passengers?: number;
  paymentMethod?: string;
  awaitingConfirmation?: boolean;
}

type AssistantStatus = "idle" | "listening" | "processing" | "speaking";

// Check for Web Speech API
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function VoiceAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [conversationState, setConversationState] = useState<VoiceState>({});
  const [transcript, setTranscript] = useState("");
  const [isSupported] = useState(!!SpeechRecognition);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(window.speechSynthesis);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current.cancel();
  }, []);

  const speak = useCallback((text: string) => {
    stopSpeaking();
    // Strip emojis and markdown for cleaner TTS
    const clean = text
      .replace(/[\u2600-\u27BF]/g, "")
      .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, "")
      .replace(/[•\-]/g, ",")
      .replace(/\n+/g, ". ");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    // Prefer an English voice
    const voices = synthRef.current.getVoices();
    const english = voices.find(
      (v) => v.lang.startsWith("en") && v.name.includes("Google")
    ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];
    if (english) utterance.voice = english;

    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    synthRef.current.speak(utterance);
  }, [stopSpeaking]);

  const sendToServer = useCallback(
    async (text: string) => {
      setStatus("processing");
      setMessages((prev) => [...prev, { role: "user", content: text }]);

      try {
        const res = await apiRequest("POST", "/api/voice-book", {
          message: text,
          conversationState,
        });
        const data = await res.json();

        const botMsg: VoiceMessage = {
          role: "assistant",
          content: data.reply,
          suggestions: data.suggestions ?? [],
        };
        setMessages((prev) => [...prev, botMsg]);
        setConversationState(data.nextState || {});

        // Refresh user data if a ticket was booked
        if (data.action === "booked") {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
        }

        speak(data.reply);
      } catch {
        const errorMsg: VoiceMessage = {
          role: "assistant",
          content: "Sorry, I had trouble processing that. Please try again.",
        };
        setMessages((prev) => [...prev, errorMsg]);
        setStatus("idle");
      }
    },
    [conversationState, speak]
  );

  const startListening = useCallback(() => {
    if (!isSupported) return;
    stopListening();
    stopSpeaking();
    setTranscript("");

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setStatus("listening");
    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript(final || interim);
    };
    recognition.onend = () => {
      setStatus("idle");
      // If we got a result, send it
      setTranscript((t) => {
        if (t.trim()) sendToServer(t.trim());
        return "";
      });
    };
    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech") {
        console.error("Speech recognition error:", e.error);
      }
      setStatus("idle");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, stopListening, stopSpeaking, sendToServer]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      stopSpeaking();
      sendToServer(suggestion);
    },
    [stopSpeaking, sendToServer]
  );

  const handleClose = useCallback(() => {
    stopListening();
    stopSpeaking();
    setIsOpen(false);
    setStatus("idle");
  }, [stopListening, stopSpeaking]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (messages.length === 0) {
      const greeting: VoiceMessage = {
        role: "assistant",
        content:
          "Hello! I'm your Namma Metro voice assistant. 🎙️\n\nTap the microphone and speak to book tickets, check timings, or get metro info.\n\nOr tap a suggestion below to get started!",
        suggestions: ["Book a ticket", "Train timings", "Crowd levels"],
      };
      setMessages([greeting]);
    }
  }, [messages.length]);

  const resetChat = useCallback(() => {
    stopListening();
    stopSpeaking();
    setConversationState({});
    setMessages([
      {
        role: "assistant",
        content:
          "Chat cleared! Tap the mic and tell me what you'd like to do.",
        suggestions: ["Book a ticket", "Train timings", "Crowd levels"],
      },
    ]);
    setStatus("idle");
  }, [stopListening, stopSpeaking]);

  // Show only for logged-in users
  if (!user || user.role !== "user") return null;

  return (
    <>
      {/* FAB — Mic button */}
      <button
        className="fixed bottom-10 left-80 z-50 group"
        style={{ display: isOpen ? "none" : "block" }}
        onClick={handleOpen}
        aria-label="Open voice assistant"
        data-testid="button-voice-open"
      >
        <div className="relative">
          <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
            <MicIcon className="w-5 h-5 text-white" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Voice Assistant
          </span>
        </div>
      </button>

      {/* Voice Assistant Panel */}
      {isOpen && (
        <div
          className="fixed bottom-32 left-80 z-50 flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
          style={{ width: "370px", height: "540px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-gradient-to-r from-violet-600 to-fuchsia-500 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <PhoneCallIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight text-white">
                  Voice Assistant
                </p>
                <p className="text-[10px] leading-tight text-white/70">
                  {status === "listening"
                    ? "🎙️ Listening..."
                    : status === "processing"
                    ? "⏳ Processing..."
                    : status === "speaking"
                    ? "🔊 Speaking..."
                    : "● Ready"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 1 && (
                <button
                  onClick={resetChat}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white cursor-pointer"
                  aria-label="Reset"
                  data-testid="button-voice-reset"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-white/70 hover:text-white cursor-pointer"
                aria-label="Close voice assistant"
                data-testid="button-voice-close"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {!isSupported && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                Your browser doesn't support speech recognition. Try Chrome or
                Edge for voice features.
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role !== "user" && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center mt-1">
                    <BotIcon className="w-3 h-3 text-violet-600" />
                  </div>
                )}
                <div
                  className={`flex flex-col gap-1.5 max-w-[80%] ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-violet-600 text-white rounded-tr-sm"
                        : "bg-muted/80 text-foreground rounded-tl-sm"
                    }`}
                  >
                    {msg.content.split("\n").map((line, j) => {
                      const trimmed = line.trim();
                      if (!trimmed) return <div key={j} className="h-1.5" />;
                      const isBullet =
                        trimmed.startsWith("•") || trimmed.startsWith("-");
                      if (isBullet)
                        return (
                          <div key={j} className="flex gap-1.5 mt-0.5">
                            <span className="flex-shrink-0 mt-0.5 opacity-60 text-xs">
                              •
                            </span>
                            <span>{trimmed.slice(1).trim()}</span>
                          </div>
                        );
                      return (
                        <p key={j} className={j > 0 ? "mt-0.5" : ""}>
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>
                  {msg.role === "assistant" &&
                    msg.suggestions &&
                    msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {msg.suggestions.map((s, k) => (
                          <button
                            key={k}
                            onClick={() => handleSuggestionClick(s)}
                            className="text-[11px] px-2.5 py-1 rounded-full border border-violet-500/25 text-violet-600 bg-violet-500/5 cursor-pointer transition-colors hover:bg-violet-500/15"
                            style={{ lineHeight: 1.4 }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center mt-1">
                    <UserIcon className="w-3 h-3 text-violet-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Processing indicator */}
            {status === "processing" && (
              <div className="flex gap-2 justify-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center mt-1">
                  <BotIcon className="w-3 h-3 text-violet-600" />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-muted/80">
                  <div className="flex items-center gap-1 px-1 py-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 inline-block animate-bounce"
                        style={{
                          animationDelay: `${i * 0.15}s`,
                          animationDuration: "0.8s",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Live transcript */}
          {transcript && status === "listening" && (
            <div className="px-4 py-2 border-t bg-violet-50 dark:bg-violet-950/30 text-sm text-violet-700 dark:text-violet-300 italic">
              "{transcript}"
            </div>
          )}

          {/* Mic controls */}
          <div className="flex items-center justify-center gap-3 px-4 py-4 border-t bg-card flex-shrink-0">
            {status === "speaking" && (
              <Button
                size="icon"
                variant="outline"
                onClick={stopSpeaking}
                className="h-10 w-10 rounded-full"
                data-testid="button-voice-stop-speak"
              >
                <Volume2Icon className="w-4 h-4" />
              </Button>
            )}

            <button
              onClick={
                status === "listening" ? stopListening : startListening
              }
              disabled={
                !isSupported || status === "processing"
              }
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                status === "listening"
                  ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
                  : "bg-gradient-to-br from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 shadow-lg shadow-violet-500/20"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              data-testid="button-voice-mic"
              aria-label={
                status === "listening" ? "Stop listening" : "Start listening"
              }
            >
              {status === "processing" ? (
                <Loader2Icon className="w-6 h-6 text-white animate-spin" />
              ) : status === "listening" ? (
                <>
                  <MicOffIcon className="w-6 h-6 text-white relative z-10" />
                  {/* Animated pulse rings */}
                  <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-50" />
                  <span
                    className="absolute rounded-full border-2 border-red-300 animate-ping opacity-30"
                    style={{
                      inset: "-6px",
                      animationDelay: "0.3s",
                    }}
                  />
                </>
              ) : (
                <MicIcon className="w-6 h-6 text-white" />
              )}
            </button>

            {status === "listening" && (
              <div className="text-xs text-muted-foreground animate-pulse">
                Listening...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
