import { useMemo, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUIStore } from "@/store";
import { getChatPrompts, getChatResponse } from "@/services/novaService";
import { NovaThinkingDots } from "@/components/nova/NovaThinkingDots";

interface Message {
  role: "user" | "nova";
  content: string;
}

export function NovaChatPanel() {
  const isOpen = useUIStore((state) => state.isNovaChatOpen);
  const closeNovaChat = useUIStore((state) => state.closeNovaChat);
  const novaChatContext = useUIStore((state) => state.novaChatContext);
  const step = novaChatContext.step ?? "problem";
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "nova",
      content:
        "Observation:\nI am ready to coach this CAPA step.\n\nRecommendation:\nClick a suggested prompt below, or ask about scoring, RCA depth, verification evidence, or audit readiness.",
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const quickPrompts = useMemo(() => getChatPrompts(step), [step]);

  if (!isOpen) return null;

  const sendMessage = async (text?: string) => {
    const userMessage = (text ?? draft).trim();
    if (!userMessage) return;
    setDraft("");
    setMessages((current) => [...current, { role: "user", content: userMessage }]);
    setIsThinking(true);
    const response = await getChatResponse(step, userMessage);
    setMessages((current) => [...current, { role: "nova", content: response }]);
    setIsThinking(false);
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l bg-background shadow-lg">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2 font-semibold text-nova">
          <Sparkles className="h-4 w-4" />
          Ask Nova
        </div>
        <Button variant="ghost" size="icon" onClick={closeNovaChat}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded border p-3 text-sm whitespace-pre-line ${
              message.role === "nova" ? "bg-nova/5 text-foreground" : "bg-muted/50"
            }`}
          >
            {message.content}
          </div>
        ))}
        {isThinking && (
          <div className="rounded border border-nova/20 bg-nova/5 p-3 text-sm text-nova">
            Nova is analyzing... <NovaThinkingDots />
          </div>
        )}
      </div>

      <div className="border-t p-4 space-y-3">
        {quickPrompts.length > 0 && messages.length <= 1 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Suggested prompts</div>
            <div className="flex flex-col gap-1.5">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className="rounded border bg-muted/30 px-3 py-2 text-left text-xs hover:border-nova/40 hover:bg-nova/5 hover:text-nova transition-colors"
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendMessage();
            }
          }}
          placeholder="Ask Nova about this step..."
          rows={3}
        />
        <Button className="w-full" onClick={() => sendMessage()}>
          <Send className="mr-2 h-4 w-4" />
          Ask Nova
        </Button>
      </div>
    </aside>
  );
}
