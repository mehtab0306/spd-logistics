"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Sparkles,
  X,
  Send,
  Loader2,
  TrendingUp,
  BookOpen,
  Truck,
  PlusCircle,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  parsedAction?: {
    type: "quick_expense" | "quick_bilty";
    data: any;
  };
}

export function AiCopilotWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Assalam-o-Alaikum! Main Super Pak Data Wale Goods Transport Co. ka AI Business Copilot hoon. Aaj ka Profit/Loss, Cash In/Out, kisi party ka khata, ya quick expense entry ke baray mein poochhein.",
      time: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  // Extract structured JSON action from message if present
  const extractAction = (text: string) => {
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.type === "quick_expense" || parsed.type === "quick_bilty") {
          return { type: parsed.type, data: parsed };
        }
      }
    } catch {}
    return undefined;
  };

  // Gather live client storage context
  const getLiveContext = () => {
    if (typeof window === "undefined") return {};

    try {
      const todayStr = new Date().toISOString().slice(0, 10);

      const rawCash =
        localStorage.getItem("spd_cash_books") ||
        localStorage.getItem("spd_local_cash_books") ||
        localStorage.getItem("cash_books");
      const cashBooks: any[] = rawCash ? JSON.parse(rawCash) : [];

      let todayCashIn = 0;
      let todayCashOut = 0;

      for (const entry of cashBooks) {
        const entryDate = entry.date ? entry.date.slice(0, 10) : "";
        const amt = Number(entry.amount) || 0;
        const isEntryToday = !entryDate || entryDate === todayStr;

        if (isEntryToday) {
          const type = (entry.type || entry.entryType || "").toUpperCase();
          if (type === "IN" || type === "CREDIT" || type === "RECEIPT") {
            todayCashIn += amt;
          } else {
            todayCashOut += amt;
          }
        }
      }

      const rawBilties =
        localStorage.getItem("spd_bilties") ||
        localStorage.getItem("spd_local_bilties") ||
        localStorage.getItem("bilties");
      const bilties: any[] = rawBilties ? JSON.parse(rawBilties) : [];

      const rawCusts =
        localStorage.getItem("spd_customers") ||
        localStorage.getItem("customers");
      const customers: any[] = rawCusts ? JSON.parse(rawCusts) : [];

      const rawChallans =
        localStorage.getItem("spd_challans") ||
        localStorage.getItem("challans");
      const challans: any[] = rawChallans ? JSON.parse(rawChallans) : [];

      return {
        todayCashIn,
        todayCashOut,
        cashBooks: cashBooks.slice(0, 20),
        bilties: bilties.slice(0, 20),
        customers: customers.slice(0, 25),
        challans: challans.slice(0, 15),
      };
    } catch (err) {
      console.warn("Could not read local context for AI:", err);
      return {};
    }
  };

  const handleSend = async (customQuery?: string) => {
    const text = (customQuery || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const context = getLiveContext();

      const chatHistory = messages.slice(-6).map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          messages: [...chatHistory, { role: "user", content: text }],
          context,
        }),
      });

      const data = await res.json();

      if (data.success && data.reply) {
        const botMsg: Message = {
          id: String(Date.now() + 1),
          sender: "bot",
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          parsedAction: extractAction(data.reply),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const fallbackMsg: Message = {
          id: String(Date.now() + 1),
          sender: "bot",
          text: data.error || "Maaf kijiyega, system response process karne mein dushwari hui. Barah-e-karam dobara koshish karein.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: "bot",
        text: "Network error: AI Assistant se connection qaim nahi ho saka. Barah-e-karam internet check karein.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      label: "📊 Aaj ka Profit / Loss",
      query: "Aaj ka kitna profit loss hai? Aaj ke cash in, cash out aur net balance ka hisaab batayein.",
      icon: TrendingUp,
    },
    {
      label: "📒 Party Khata Check",
      query: "Hamein registered parties jaise Adamjee Dura Built, Crescent waghera ka khata aur balance batayein.",
      icon: BookOpen,
    },
    {
      label: "🚚 Active Gadiyan & Challan",
      query: "Aaj ki active linehaul gadiyan aur challan ki status report batayein.",
      icon: Truck,
    },
    {
      label: "➕ Quick Kharcha Add",
      query: "5000 diesel kharcha add karne ke liye quick expense entry structure generate karein.",
      icon: PlusCircle,
    },
  ];

  return (
    <>
      {/* Floating Trigger Pill (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-50 select-none">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open SPD AI Copilot"
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-red-700 via-red-800 to-slate-900 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-red-500/30 group"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
            </div>
            <div className="text-left">
              <span className="text-xs font-black tracking-wide block leading-tight">
                SPD AI Copilot
              </span>
              <span className="text-[10px] text-red-200 block font-semibold leading-tight">
                Gemini 3.8 &bull; Finance &amp; Khata
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform ml-0.5" />
          </button>
        )}
      </div>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[95vw] sm:w-[420px] max-w-[440px] h-[580px] max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-700 flex items-center justify-center text-white shadow-sm shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    SPD AI Business Copilot
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Super Pak Data &bull; Roman Urdu / English
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: "welcome-reset",
                      sender: "bot",
                      text: "Chat cleared. Poochein: Aaj ka profit/loss, kisi party ka khata, ya quick kharcha entry.",
                      time: "Just now",
                    },
                  ])
                }
                title="Clear Chat History"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close AI Copilot"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Chips Bar */}
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800/80 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max">
              {quickActions.map((qa, i) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSend(qa.query)}
                    disabled={loading}
                    className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300 transition-all shadow-2xs whitespace-nowrap active:scale-95"
                  >
                    <Icon className="w-3 h-3 text-red-600" />
                    <span>{qa.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-slate-100/50 dark:bg-slate-950/40">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-xs space-y-1.5 ${
                      isUser
                        ? "bg-red-700 text-white rounded-br-xs"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-bl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed font-sans font-medium">
                      {m.text}
                    </div>

                    {/* Pre-fill Action Buttons if AI returned JSON instructions */}
                    {m.parsedAction && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        {m.parsedAction.type === "quick_expense" && (
                          <Button
                            size="sm"
                            onClick={() => router.push("/admin/cash-books/new")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold h-7 rounded-lg gap-1.5 w-full shadow-2xs"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Cash Book Form Mein Add Karein</span>
                          </Button>
                        )}
                        {m.parsedAction.type === "quick_bilty" && (
                          <Button
                            size="sm"
                            onClick={() => router.push("/admin/bilty/new")}
                            className="bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold h-7 rounded-lg gap-1.5 w-full shadow-2xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Bilty Booking Form Kholein</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {m.time}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 max-w-[70%]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                <span className="text-xs text-slate-500 font-semibold animate-pulse">
                  Gemini calculations kar raha hai...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Poochein: Aaj ka profit kitna hai, party khata..."
              disabled={loading}
              className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 font-medium"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-10 w-10 p-0 rounded-xl bg-red-700 hover:bg-red-800 text-white shrink-0 shadow-md"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

export default AiCopilotWidget;
