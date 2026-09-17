"use client";

import React, { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Sparkles, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
}

export default function AiAssistantPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState<{
    state: "checking" | "ready" | "unconfigured" | "unavailable";
    label: string;
    detail?: string;
  }>({
    state: "checking",
    label: "Verifying Groq AI Engine...",
  });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Welcome to SPD AI Operations Copilot, powered by Groq AI. I can assist you with consignment tracking guidelines, nationwide corridor transit times, terminal logistics, and customer freight tariffs.",
      time: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/ai/chat");
        const data = await res.json();
        if (data.status === "ready") {
          setEngineStatus({
            state: "ready",
            label: "Groq AI Llama 3.3 Engine Ready",
          });
        } else if (data.status === "unconfigured") {
          setEngineStatus({
            state: "unconfigured",
            label: "Configuration Required: Set GROQ_API_KEY",
            detail: data.message,
          });
        } else {
          setEngineStatus({
            state: "unavailable",
            label: "Groq AI Unavailable",
            detail: data.message,
          });
        }
      } catch (err: any) {
        setEngineStatus({
          state: "unavailable",
          label: "Groq AI Disconnected",
          detail: err.message,
        });
      }
    }
    checkStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setInput("");
    setLoading(true);

    try {
      const chatHistory = nextMsgs.slice(-8).map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false && data.reply) {
        const botMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: "bot",
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const botMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: "bot",
          text: data?.error || "AI Assistant was unable to process this request. Please try again.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err: any) {
      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "bot",
        text: err?.message ? `Network Error: ${err.message}` : "AI Assistant connection failed. Please verify server internet access and try again.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <PageHeader
        title="AI Operations Assistant"
        description="Intelligent logistics copilot powered by Groq AI."
      />

      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="flex-1 rounded-2xl border bg-card flex flex-col overflow-hidden shadow-sm">
          {/* Header info */}
          <div className="px-5 py-3 border-b bg-muted/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  engineStatus.state === "ready"
                    ? "bg-emerald-500 animate-pulse"
                    : engineStatus.state === "unconfigured"
                    ? "bg-amber-500"
                    : engineStatus.state === "checking"
                    ? "bg-blue-400 animate-ping"
                    : "bg-red-500"
                }`}
              ></span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200" title={engineStatus.detail}>
                {engineStatus.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>SPD Dispatch Intelligence</span>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${
                  m.sender === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    m.sender === "user"
                      ? "bg-spd-blue text-white"
                      : "bg-spd-red text-white"
                  }`}
                >
                  {m.sender === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                    m.sender === "user"
                      ? "bg-spd-blue text-white rounded-tr-none"
                      : "bg-muted text-foreground rounded-tl-none border border-border"
                  }`}
                >
                  <p>{m.text}</p>
                  <span className={`text-[10px] mt-1.5 block ${m.sender === "user" ? "text-blue-100" : "text-muted-foreground"}`}>
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-spd-red text-white flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted p-4 rounded-2xl rounded-tl-none border border-border flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-spd-red" />
                  <span className="text-xs text-muted-foreground">Groq AI is processing your dispatch query...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 border-t bg-background flex items-center gap-2"
          >
            <Input
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loading ? "Groq AI is thinking..." : "Ask about Karachi port dispatches, FTL allocation, tariffs, or Bilty tracking..."}
              className="flex-1 rounded-xl"
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              className="shrink-0 bg-spd-blue hover:bg-spd-blueHover text-white rounded-xl gap-2 font-bold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>{loading ? "Thinking..." : "Send"}</span>
            </Button>
          </form>
        </div>

        <div className="hidden lg:flex w-72 flex-col gap-4">
          <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm">Suggested Queries</h3>
            </div>
            <div className="space-y-2">
              {[
                "Karachi to Lahore transit timeline",
                "Hawksbay warehouse terminal address",
                "How is freight calculated for FTL?",
                "Contact Managing Director Hammad Faisal",
                "How to track consignment with Bilty number?",
              ].map((query, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  onClick={() => handleSend(query)}
                  className="w-full justify-start text-xs h-auto py-2.5 px-3 whitespace-normal text-left rounded-xl hover:border-spd-blue hover:text-spd-blue transition-all"
                >
                  {query}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
