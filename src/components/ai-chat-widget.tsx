import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageCircle, Send, Sparkles, X, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { getWhatsAppUrl, trackWhatsAppClick } from "@/lib/whatsapp";

const SUGGESTIONS = [
  "How much is Pro?",
  "Can I pay from outside Nigeria?",
  "How do refunds work?",
];

const GREETING =
  "Hi! I'm the Career Boost Assistant 👋\n\nI can help with **pricing, payments, refunds, and how Career Boost works**. What would you like to know?";

function getMessageText(message: UIMessage): string {
  return message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
}

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, status]);

  useEffect(() => {
    if (open && !isBusy) inputRef.current?.focus();
  }, [open, isBusy]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("careerboost:open-chat", handler);
    return () => window.removeEventListener("careerboost:open-chat", handler);
  }, []);

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    setInput("");
    await sendMessage({ text: trimmed });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Career Boost Assistant"
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-elegant transition-all duration-300 hover:scale-110 hover:shadow-xl sm:bottom-6 sm:right-6 animate-fade-in"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary">
            <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-auto sm:bottom-6 sm:right-6 animate-fade-in">
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden border bg-background shadow-2xl sm:h-[600px] sm:max-h-[85vh] sm:w-[400px] sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b bg-gradient-to-br from-primary to-primary-glow px-4 py-3 text-primary-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15 backdrop-blur">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-sm font-bold leading-tight">Career Boost Assistant</div>
            <div className="text-[11px] text-primary-foreground/80">AI support · replies in seconds</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="rounded-full p-1.5 transition-colors hover:bg-primary-foreground/15"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-muted/20 px-3 py-4 space-y-3">
          {/* Greeting */}
          <AssistantBubble>
            <ReactMarkdown>{GREETING}</ReactMarkdown>
          </AssistantBubble>

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => submit(q)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {messages.map((m) => {
            const text = getMessageText(m);
            if (m.role === "user") {
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground shadow-sm">
                    {text}
                  </div>
                </div>
              );
            }
            return (
              <AssistantBubble key={m.id}>
                <ReactMarkdown>{text}</ReactMarkdown>
              </AssistantBubble>
            );
          })}

          {status === "submitted" && (
            <AssistantBubble>
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
              </span>
            </AssistantBubble>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Something went wrong. Please try again, or message us on WhatsApp.
            </div>
          )}
        </div>

        {/* Escalation footer */}
        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsAppClick("chat_widget_escalation")}
          className="border-t bg-background px-4 py-2 text-center text-[11px] text-muted-foreground transition-colors hover:bg-muted"
        >
          Still need a human?{" "}
          <span className="font-semibold text-[#25D366]">Chat with us on WhatsApp →</span>
        </a>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(input);
          }}
          className="flex items-end gap-2 border-t bg-background p-3"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit(input);
              }
            }}
            rows={1}
            placeholder="Ask anything about Career Boost…"
            disabled={isBusy}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 max-h-32"
          />
          <button
            type="submit"
            disabled={!input.trim() || isBusy}
            aria-label="Send message"
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all",
              "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-background px-3.5 py-2 text-sm text-foreground shadow-sm border prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-1 prose-a:text-primary">
        {children}
      </div>
    </div>
  );
}
