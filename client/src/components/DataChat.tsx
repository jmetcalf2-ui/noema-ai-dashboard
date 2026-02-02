import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, User, ArrowUp, Plus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

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
                
                const usedColumns = columns.filter(col => 
                  assistantMessage.toLowerCase().includes(col.toLowerCase())
                );
                
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
    <div className={cn("flex flex-col h-full min-h-[600px]", className)}>
      <div className="flex items-center gap-2.5 px-6 py-4 border-b bg-background">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-[15px] font-medium">Data Assistant</span>
          <p className="text-[12px] text-muted-foreground">Ask analytical questions about your data</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center px-4 py-12"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-5">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2">Ask a question about your data</h3>
              <p className="text-[14px] text-muted-foreground mb-6 max-w-md">
                I can help you explore patterns, find insights, and understand your dataset better.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {suggestions.map((s, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(s)}
                    className="rounded-full text-[13px] h-9"
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
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={cn("max-w-[85%]", msg.role === "user" ? "max-w-[75%]" : "")}>
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl text-[14px] leading-relaxed",
                      msg.role === "user"
                        ? "bg-foreground text-background rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    )}
                  >
                    {msg.content ? (
                      msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-headings:my-3 prose-headings:font-medium">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="text-[14px] leading-relaxed">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc pl-4 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="text-[14px]">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                              h1: ({ children }) => <h3 className="text-[15px] font-semibold mt-4 mb-2">{children}</h3>,
                              h2: ({ children }) => <h4 className="text-[15px] font-semibold mt-3 mb-2">{children}</h4>,
                              h3: ({ children }) => <h5 className="text-[14px] font-semibold mt-3 mb-1">{children}</h5>,
                              code: ({ children }) => <code className="bg-background/50 px-1.5 py-0.5 rounded text-[13px]">{children}</code>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="text-[13px] text-muted-foreground">Analyzing...</span>
                      </div>
                    )}
                  </div>
                  
                  {msg.role === "assistant" && msg.content && (
                    <div className="flex items-center gap-3 mt-2 px-1">
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Info className="w-3 h-3" />
                          <span>Based on: {msg.sources.join(", ")}</span>
                        </div>
                      )}
                      {msg.confidence && (
                        <span className={cn(
                          "text-[11px] font-medium uppercase tracking-wider",
                          confidenceColors[msg.confidence]
                        )}>
                          {msg.confidence} confidence
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-background" />
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t bg-background">
        <div className="flex flex-col rounded-2xl p-2 shadow-sm transition-colors bg-secondary/50 dark:bg-secondary/30 border">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your data..."
            disabled={isLoading}
            className="w-full resize-none border-0 bg-transparent px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus:ring-0 focus-visible:outline-none min-h-[44px]"
            data-testid="input-chat"
          />
          
          <div className="flex items-center justify-between px-1 pt-1">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none"
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
                "flex h-9 w-9 items-center justify-center rounded-full transition-all focus-visible:outline-none",
                hasValue && !isLoading
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90"
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
    </div>
  );
}
