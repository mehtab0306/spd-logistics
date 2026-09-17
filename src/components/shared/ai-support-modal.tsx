"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Search, 
  MapPin, 
  PhoneCall, 
  Truck, 
  CornerDownLeft, 
  MessageSquare, 
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  actions?: {
    label: string;
    href?: string;
    onClick?: () => void;
  }[];
}

export function AiSupportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiStatus, setAiStatus] = useState<"checking" | "ready" | "unconfigured" | "unavailable">("checking");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Assalam-o-Alaikum! I am your SPD Logistics AI Assistant. How can I assist you with your freight, consignment tracking, or booking today?",
      time: "Just now",
      actions: [
        { label: "🔍 Track My Bilty" },
        { label: "🚚 Book Transport / FTL" },
        { label: "🏢 Warehouse Locations" },
        { label: "📞 Contact Management" },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkAiStatus() {
      try {
        const res = await fetch("/api/ai/chat");
        const data = await res.json();
        if (data.status === "ready") {
          setAiStatus("ready");
        } else if (data.status === "unconfigured") {
          setAiStatus("unconfigured");
        } else {
          setAiStatus("unavailable");
        }
      } catch {
        setAiStatus("unavailable");
      }
    }
    checkAiStatus();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const extractActionChips = (text: string): Message["actions"] => {
    const t = text.toLowerCase();
    const actions: NonNullable<Message["actions"]> = [];

    if (t.includes("track") || t.includes("bilty") || t.includes("consignment")) {
      actions.push({ label: "🔍 Track Consignment", href: "/tracking" });
    }
    if (t.includes("rate") || t.includes("quote") || t.includes("book") || t.includes("ftl") || t.includes("hammad")) {
      actions.push({
        label: "💬 WhatsApp Hammad (0325 2024433)",
        href: "https://wa.me/923252024433?text=Assalam-o-Alaikum%20Hammad%20Sahab,%20I%20want%20to%20inquire%20about%20freight%20booking.",
      });
    }
    if (t.includes("warehouse") || t.includes("terminal") || t.includes("karachi") || t.includes("lahore")) {
      actions.push({ label: "📍 View Terminals & Map", href: "/#map-section" });
    }
    if (t.includes("contact") || t.includes("phone") || t.includes("call") || t.includes("faisal")) {
      actions.push({ label: "📞 Call Dispatch: 0325 2024433", href: "tel:03252024433" });
    }

    return actions.length > 0 ? actions : undefined;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputMessage).trim();
    if (!messageText || isTyping) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: "user",
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Build conversation history for Groq context
      const chatHistory = nextMessages.slice(-8).map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });

      const data = await response.json();

      if (response.ok && data.success !== false && data.reply) {
        const replyText = data.reply;
        const botMsg: Message = {
          id: String(Date.now() + 1),
          sender: "bot",
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actions: extractActionChips(replyText),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errorText = data?.error || "AI Assistant is temporarily unavailable. Please try again.";
        const botMsg: Message = {
          id: String(Date.now() + 1),
          sender: "bot",
          text: errorText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actions: [
            { label: "📞 Call Dispatch: 0325 2024433", href: "tel:03252024433" },
            { label: "💬 WhatsApp: 0325 2024433", href: "https://wa.me/923252024433" },
          ],
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      const botMsg: Message = {
        id: String(Date.now() + 1),
        sender: "bot",
        text: "AI Assistant is temporarily unavailable. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: [
          { label: "📞 Call Dispatch: 0325 2024433", href: "tel:03252024433" },
          { label: "💬 WhatsApp: 0325 2024433", href: "https://wa.me/923252024433" },
        ],
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Positioned cleanly on the bottom-left to avoid colliding with WhatsApp on bottom-right) */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-spd-red to-spd-blue text-white rounded-full shadow-2xl hover:scale-105 transition-all duration-300 group border border-white/20"
          title="Chat with SPD Logistics AI Assistant"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-6 h-6" />
            <span
              className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                aiStatus === "ready"
                  ? "bg-emerald-400 animate-pulse"
                  : aiStatus === "unconfigured"
                  ? "bg-amber-400"
                  : aiStatus === "checking"
                  ? "bg-blue-400 animate-ping"
                  : "bg-slate-400"
              }`}
            ></span>
          </div>
          <div className="hidden sm:block text-left pr-1">
            <div className="flex items-center gap-1">
              <span className="text-[9px] uppercase font-bold tracking-wider opacity-90 leading-tight">AI Assistant</span>
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
            </div>
            <p className="text-xs font-black leading-tight">SPD Dispatcher</p>
          </div>
        </button>
      </div>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 left-4 sm:left-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[580px] h-[82vh] bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-spd-red to-spd-blue flex items-center justify-center text-white shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm">SPD AI Dispatcher</h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      aiStatus === "ready"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : aiStatus === "unconfigured"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-slate-700/50 text-slate-300 border-slate-600"
                    }`}
                  >
                    {aiStatus === "ready" ? "Groq AI Online" : aiStatus === "unconfigured" ? "Config Required" : "AI Offline"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Instant Freight, Rates & Bilty Support</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-sm whitespace-pre-line ${
                    m.sender === "user"
                      ? "bg-spd-blue text-white rounded-br-none"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700/80"
                  }`}
                >
                  {m.text}

                  {/* Bot Action Chips */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                      {m.actions.map((act, i) => (
                        act.href ? (
                          <a
                            key={i}
                            href={act.href}
                            target={act.href.startsWith("http") ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-[11px] font-bold text-spd-red dark:text-spd-red border border-slate-200 dark:border-slate-700 hover:bg-spd-red hover:text-white dark:hover:bg-spd-red dark:hover:text-white transition-all shadow-sm"
                          >
                            <span>{act.label}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(act.label)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-spd-blue hover:text-spd-blue transition-all shadow-sm"
                          >
                            <span>{act.label}</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          </button>
                        )
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                  {m.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-spd-red" />
                </div>
                <div className="flex gap-1 items-center bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-2xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-spd-red animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-spd-blue animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0e1422]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about bilty, rates, warehouses..."
                className="flex-1 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-spd-blue"
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim()}
                className="bg-spd-red hover:bg-spd-redHover text-white px-3.5 py-2.5 rounded-xl h-auto shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-[10px] text-center text-slate-400 mt-1.5 font-medium flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Powered by Groq AI • SPD Logistics Intelligence • Est. 1996</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
