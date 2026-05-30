import { useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUIStore } from "@/store";
import { getChatResponse } from "@/services/novaService";
import { NovaThinkingDots } from "@/components/nova/NovaThinkingDots";

interface Message {
  role: "user" | "nova";
  content: string;
}

export function NovaChatPanel({ step = "problem" }: { step?: string }) {
  const isOpen = useUIStore((state) => state.isNovaChatOpen);
  const closeNovaChat = useUIStore((state) => state.closeNovaChat);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "nova",
      content: "Observation:\nI am ready to coach this CAPA step.\n\nRecommendation:\nAsk for scoring, RCA depth, verification evidence, or audit readiness help.",
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  if (!isOpen) return null;

  const sendMessage = async () => {
    if (!draft.trim()) return;
    const userMessage = draft.trim();
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
      <div className="border-t p-4">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask Nova about this step..."
        />
        <Button className="mt-2 w-full" onClick={sendMessage}>
          <Send className="mr-2 h-4 w-4" />
          Ask Nova
        </Button>
      </div>
    </aside>
  );
}

