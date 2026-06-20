import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { CHAT_SYSTEM_PROMPT } from "@/lib/chat-system-prompt";

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as ChatRequestBody;
          if (!Array.isArray(messages) || messages.length === 0) {
            return new Response("Messages are required", { status: 400 });
          }

          // Abuse caps: limit message count and total payload size.
          const MAX_MESSAGES = 20;
          const MAX_PER_MESSAGE_CHARS = 2000;
          const MAX_TOTAL_CHARS = 12000;

          // Keep only the last N turns so old history can't accumulate cost.
          const trimmed = (messages as UIMessage[]).slice(-MAX_MESSAGES);

          let totalChars = 0;
          for (const m of trimmed) {
            if (!m || !Array.isArray((m as UIMessage).parts)) {
              return new Response("Invalid message format", { status: 400 });
            }
            for (const p of (m as UIMessage).parts) {
              if (p.type === "text") {
                if (typeof p.text !== "string") {
                  return new Response("Invalid message text", { status: 400 });
                }
                if (p.text.length > MAX_PER_MESSAGE_CHARS) {
                  return new Response("Message too long", { status: 413 });
                }
                totalChars += p.text.length;
              }
            }
          }
          if (totalChars > MAX_TOTAL_CHARS) {
            return new Response("Conversation too long", { status: 413 });
          }

          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            return new Response("Missing LOVABLE_API_KEY", { status: 500 });
          }

          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");

          const result = streamText({
            model,
            system: CHAT_SYSTEM_PROMPT,
            messages: await convertToModelMessages(trimmed),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: trimmed,
          });
        } catch (err) {
          console.error("[/api/chat] error", err);
          return new Response("Chat error", { status: 500 });
        }
      },
    },
  },
});
