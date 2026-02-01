import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, User, ArrowUp, Plus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  confidence?: "high" | "medium" | "low";
}

interface DataChatProps {
  analysisId: number;
  dataContext: string;
  className?: string;
}

export function DataChat({ analysisId, dataContext, className }: DataChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Extract column names from context for source detection
  const columns = dataContext.match(/Columns: ([^,]+(?:, [^,]+)*)/)?.[1]?.split(", ") || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/data-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          message: userMessage,
          context: dataContext,
          history: messages.slice(-6),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      let assistantMessage = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantMessage += parsed.content;
                
                // Detect which columns were referenced
                const usedColumns = columns.filter(col => 
                  assistantMessage.toLowerCase().includes(col.toLowerCase())
                );
                
                // Estimate confidence based on response length and specificity
                let confidence: "high" | "medium" | "low" = "medium";
                if (assistantMessage.length > 200 && usedColumns.length > 0) {
                  confidence = "high";
                } else if (assistantMessage.length < 50 || assistantMessage.includes("cannot") || assistantMessage.includes("don't have")) {
                  confidence = "low";
                }

                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                    sources: usedColumns.slice(0, 3),
                    confidence,
                  };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered an issue processing your request. Please try rephrasing your question.",
          confidence: "low",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Context-aware suggestions based on the data
  const suggestions = [
    "What patterns stand out in this data?",
    "Summarize the key metrics",
    "Are there any outliers I should know about?",
    "What would you recommend investigating further?",
  ];

  const hasValue = input.trim().length > 0;

  const confidenceColors = {
    high: "text-emerald-600 dark:text-emerald-400",
    medium: "text-amber-600 dark:text-amber-400", 
    low: "text-slate-500 dark:text-slate-400",
  };

  return (
    <Card className={cn("flex flex-col h-[520px] overflow-hidden", className)}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b">
        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div>
          <span className="text-[14px] font-medium">Data Assistant</span>
          <p className="text-[11px] text-muted-foreground">Ask analytical questions about your data</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center px-4"
            >
              <p className="text-[13px] text-muted-foreground mb-4">
                Ask a question to explore your data
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {suggestions.map((s, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(s)}
                    className="rounded-full text-[12px] h-8"
                    data-testid={`suggestion-${i}`}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
                <div className="max-w-[80%]">
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed",
                      msg.role === "user"
                        ? "bg-foreground text-background rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    )}
                  >
                    {msg.content || (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="text-[13px] text-muted-foreground">Analyzing...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Source and confidence indicators for assistant messages */}
                  {msg.role === "assistant" && msg.content && (
                    <div className="flex items-center gap-3 mt-1.5 px-1">
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Info className="w-3 h-3" />
                          <span>Based on: {msg.sources.join(", ")}</span>
                        </div>
                      )}
                      {msg.confidence && (
                        <span className={cn(
                          "text-[10px] font-medium uppercase tracking-wider",
                          confidenceColors[msg.confidence]
                        )}>
                          {msg.confidence} confidence
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-background" />
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-4">
        <div className="flex flex-col rounded-[28px] p-2 shadow-sm transition-colors bg-secondary/50 dark:bg-secondary/30 border">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your data..."
            disabled={isLoading}
            className="w-full resize-none border-0 bg-transparent px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus:ring-0 focus-visible:outline-none min-h-[40px]"
            data-testid="input-chat"
          />
          
          <div className="flex items-center justify-between px-1 pt-1">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none"
              data-testid="button-attach"
            >
              <Plus className="h-5 w-5" />
              <span className="sr-only">Attach file</span>
            </button>
            
            <button
              type="button"
              onClick={sendMessage}
              disabled={!hasValue || isLoading}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all focus-visible:outline-none",
                hasValue && !isLoading
                  ? "bg-foreground text-background hover:opacity-80"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              data-testid="button-send-chat"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              )}
              <span className="sr-only">Send message</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
