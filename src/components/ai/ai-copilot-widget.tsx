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
  RotateCcw,
  CheckCircle,
  Mic,
  MicOff,
  Check,
  Printer,
  FileText,
  AlertCircle,
  Volume2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVoiceAssistant, VoiceAssistantLanguage } from "@/hooks/use-voice-assistant";
import { saveStoredBilty, saveStoredChallan } from "@/lib/local-persistence";

interface ActionPayload {
  type: "CREATE_BILTY" | "CREATE_CHALLAN" | "ADD_CASHBOOK_TRANSACTION" | "quick_expense" | "quick_bilty";
  data: any;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  parsedAction?: ActionPayload;
}

export function AiCopilotWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionStates, setActionStates] = useState<Record<string, "pending" | "saved" | "cancelled">>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Assalam-o-Alaikum! Main Super Pak Data Wale Goods Transport Co. ka Voice AI Operations Copilot hoon. 🎤 Mic daba kar Roman Urdu, Hindi ya English mein hukum dein ya poochein: Aaj ka Profit/Loss, Party Khata, Bilty creation, ya Transit Challan.",
      time: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Voice Assistant Hook
  const {
    isListening,
    transcript,
    interimTranscript,
    language,
    isSupported,
    audioWaveData,
    setLanguage,
    toggleListening,
    stopListening,
  } = useVoiceAssistant({
    initialLanguage: "ur-PK",
    onFinalResult: (finalText) => {
      if (finalText && finalText.trim().length > 0) {
        setInput(finalText.trim());
        handleSend(finalText.trim());
      }
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading, isListening, interimTranscript]);

  // Extract structured JSON action from message if present
  const extractAction = (text: string): ActionPayload | undefined => {
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.action) {
          return { type: parsed.action, data: parsed.data || parsed };
        }
        if (parsed.type) {
          return { type: parsed.type, data: parsed.data || parsed };
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

    if (isListening) {
      stopListening();
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
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
        const parsedAction = data.action || extractAction(data.reply);
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          parsedAction,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const fallbackMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: data.error || "Maaf kijiyega, system response process karne mein dushwari hui. Barah-e-karam dobara koshish karein.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      const errorMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: "Network error: AI Assistant se connection qaim nahi ho saka. Barah-e-karam internet check karein.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Action Confirmation Handlers
  const handleConfirmBilty = (msgId: string, data: any) => {
    const biltyNo = data.biltyNumber || `SPD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBilty = {
      id: `bilty-${Date.now()}`,
      biltyNumber: biltyNo,
      consignorName: data.sender || data.consignorName || "Adamjee Dura Built",
      consigneeName: data.receiver || data.consigneeName || "Crescent Chemical",
      origin: data.origin || "Karachi Hawksbay Hub",
      destination: data.destination || "Lahore Saggian Hub",
      totalAmount: Number(data.freight || data.totalFreight) || 35000,
      freight: Number(data.freight || data.totalFreight) || 35000,
      packages: Number(data.packages) || 50,
      commodity: data.commodity || "General Cargo",
      weight: data.weight || "1500 kg",
      vehicleNumber: data.vehicleNo || data.vehicleNumber || "TLR-786",
      status: "BOOKED",
      paymentType: "TO_PAY",
      paymentStatus: "PENDING",
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    saveStoredBilty(newBilty);
    setActionStates((prev) => ({ ...prev, [msgId]: "saved" }));
  };

  const handleConfirmChallan = (msgId: string, data: any) => {
    const challanNo = data.challanNumber || `CHL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newChallan = {
      id: `chl-${Date.now()}`,
      challanNumber: challanNo,
      truckNumber: data.truckNumber || "TLR-992",
      driverName: data.driverName || "Muhammad Tariq Khan",
      driverPhone: data.driverPhone || "0300-8451290",
      origin: data.origin || "Karachi Mauripur Hub",
      destination: data.destination || "Lahore Saggian Terminal",
      totalTruckHire: Number(data.totalTruckHire) || 95000,
      advancePaid: Number(data.advancePaid) || 45000,
      balancePayable: Number(data.balancePayable) || 50000,
      status: "IN_TRANSIT",
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    saveStoredChallan(newChallan);
    setActionStates((prev) => ({ ...prev, [msgId]: "saved" }));
  };

  const handleConfirmCashbook = async (msgId: string, data: any) => {
    const txType = (data.type || "OUT").toUpperCase() === "IN" ? "CREDIT" : "DEBIT";
    const amt = Number(data.amount) || 5000;
    const category = data.category || "Transit Kharcha";
    const desc = data.description || "Voice AI Cashbook Entry";
    const party = data.party || data.partyName || "Linehaul Fleet Driver";

    try {
      const raw = localStorage.getItem("spd_cash_books");
      const books = raw ? JSON.parse(raw) : [];
      const primaryBook = books[0] || {
        id: "cb-lhr-main",
        name: "Lahore Main Cash Book",
        city: "Lahore",
        openingBalance: 150000,
        currentBalance: 150000,
        totalCredits: 0,
        totalDebits: 0,
        transactionCount: 0,
      };

      if (txType === "CREDIT") {
        primaryBook.totalCredits = (primaryBook.totalCredits || 0) + amt;
        primaryBook.currentBalance = (primaryBook.currentBalance || 0) + amt;
      } else {
        primaryBook.totalDebits = (primaryBook.totalDebits || 0) + amt;
        primaryBook.currentBalance = (primaryBook.currentBalance || 0) - amt;
      }

      primaryBook.transactionCount = (primaryBook.transactionCount || 0) + 1;
      primaryBook.updatedAt = new Date().toISOString();

      if (books.length === 0) {
        localStorage.setItem("spd_cash_books", JSON.stringify([primaryBook]));
      } else {
        books[0] = primaryBook;
        localStorage.setItem("spd_cash_books", JSON.stringify(books));
      }
    } catch {}

    try {
      await fetch("/api/admin/cash-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_TRANSACTION",
          type: txType === "CREDIT" ? "IN" : "OUT",
          amount: amt,
          category,
          description: desc,
          party,
          date: new Date().toISOString(),
        }),
      });
    } catch {}

    setActionStates((prev) => ({ ...prev, [msgId]: "saved" }));
  };

  const quickActions = [
    {
      label: "📊 Profit / Loss",
      query: "Aaj ka kitna profit loss hai? Aaj ke cash in, cash out aur net balance ka hisaab batayein.",
      icon: TrendingUp,
    },
    {
      label: "📒 Party Khata",
      query: "Hamein registered parties jaise Adamjee Dura Built, Crescent waghera ka khata aur balance batayein.",
      icon: BookOpen,
    },
    {
      label: "🚚 Active Gadiyan",
      query: "Aaj ki active linehaul gadiyan aur transit challan status report batayein.",
      icon: Truck,
    },
    {
      label: "➕ Diesel Kharcha",
      query: "5000 diesel kharcha add karne ke liye cashbook entry generate karein.",
      icon: PlusCircle,
    },
    {
      label: "📄 Nayi Bilty Banao",
      query: "Adamjee ki Crescent ke liye 45000 freight ki nayi bilty generate karein.",
      icon: FileText,
    },
  ];

  return (
    <>
      {/* Floating Trigger Pill (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-50 select-none">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open SPD Voice AI Operations Copilot"
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-red-700 via-red-800 to-slate-900 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-red-500/30 group"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
            </div>
            <div className="text-left">
              <span className="text-xs font-black tracking-wide block leading-tight flex items-center gap-1">
                SPD Voice AI Copilot
                <Mic className="w-3 h-3 text-red-300" />
              </span>
              <span className="text-[10px] text-red-200 block font-semibold leading-tight">
                Gemini 3.8 &bull; Urdu / English Voice
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform ml-0.5" />
          </button>
        )}
      </div>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[95vw] sm:w-[440px] max-w-[460px] h-[610px] max-h-[88vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-700 flex items-center justify-center text-white shadow-sm shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    SPD Voice AI Copilot
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 flex items-center gap-1">
                  <span>Voice Operations ERP</span>
                  <span>&bull;</span>
                  <span className="text-emerald-400 font-bold">{language === "ur-PK" ? "Urdu" : language === "hi-IN" ? "Hindi" : "English"}</span>
                </p>
              </div>
            </div>

            {/* Language Selector & Window Controls */}
            <div className="flex items-center gap-1">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as VoiceAssistantLanguage)}
                className="bg-slate-800 text-[10px] text-slate-200 font-semibold px-2 py-1 rounded-md border border-slate-700 focus:outline-hidden"
                title="Select Voice Language"
              >
                <option value="ur-PK">Urdu (اردو)</option>
                <option value="hi-IN">Hindi (हिंदी)</option>
                <option value="en-US">English</option>
              </select>

              <button
                onClick={() => {
                  setMessages([
                    {
                      id: "welcome-reset",
                      sender: "bot",
                      text: "Chat cleared. 🎤 Mic daba kar poochein: Aaj ka profit/loss, kisi party ka khata, bilty creation, ya challan issue karein.",
                      time: "Just now",
                    },
                  ]);
                  setActionStates({});
                }}
                title="Clear Chat History"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (isListening) stopListening();
                  setIsOpen(false);
                }}
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
                    disabled={loading || isListening}
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
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs bg-slate-100/50 dark:bg-slate-950/40">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              const currentAction = m.parsedAction;
              const cardStatus = actionStates[m.id] || "pending";

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-3 shadow-xs space-y-2 ${
                      isUser
                        ? "bg-red-700 text-white rounded-br-xs"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-bl-xs"
                    }`}
                  >
                    {/* Message Body */}
                    <div className="whitespace-pre-wrap leading-relaxed font-sans font-medium">
                      {m.text}
                    </div>

                    {/* ACTION CONFIRMATION CARDS */}
                    {currentAction && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                        
                        {/* 1. BILTY CONFIRMATION CARD */}
                        {(currentAction.type === "CREATE_BILTY" || currentAction.type === "quick_bilty") && (
                          <div className="rounded-xl p-3 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-red-800 dark:text-red-300 text-[11px] flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                Bilty Booking: {currentAction.data.biltyNumber || "New Bilty"}
                              </span>
                              {cardStatus === "saved" && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> SAVED IN SYSTEM
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] space-y-1 text-slate-700 dark:text-slate-300">
                              <div className="grid grid-cols-2 gap-1 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                                <div><strong className="text-slate-500">Sender:</strong> {currentAction.data.sender || "Adamjee Dura Built"}</div>
                                <div><strong className="text-slate-500">Receiver:</strong> {currentAction.data.receiver || "Crescent Chemical"}</div>
                                <div><strong className="text-slate-500">Route:</strong> {currentAction.data.origin || "Karachi"} &rarr; {currentAction.data.destination || "Lahore"}</div>
                                <div><strong className="text-slate-500">Freight:</strong> PKR {Number(currentAction.data.freight || 0).toLocaleString()}</div>
                              </div>
                            </div>

                            {cardStatus === "pending" && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirmBilty(m.id, currentAction.data)}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold h-7 rounded-lg gap-1 shadow-xs"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Confirm &amp; Save Bilty</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push("/admin/bilty/new")}
                                  className="h-7 px-2 text-[10px] font-bold text-slate-600"
                                >
                                  Edit Form
                                </Button>
                              </div>
                            )}

                            {cardStatus === "saved" && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <Button
                                  size="sm"
                                  onClick={() => router.push("/admin/bilty")}
                                  className="flex-1 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold h-7 rounded-lg gap-1 shadow-xs"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Open in All Bookings</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. CHALLAN MANIFEST CONFIRMATION CARD */}
                        {currentAction.type === "CREATE_CHALLAN" && (
                          <div className="rounded-xl p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-blue-800 dark:text-blue-300 text-[11px] flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5" />
                                Challan Manifest: {currentAction.data.challanNumber || "New Challan"}
                              </span>
                              {cardStatus === "saved" && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> ACTIVE IN TRANSIT
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] space-y-1 text-slate-700 dark:text-slate-300">
                              <div className="grid grid-cols-2 gap-1 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                <div><strong className="text-slate-500">Truck:</strong> {currentAction.data.truckNumber || "TLR-992"}</div>
                                <div><strong className="text-slate-500">Driver:</strong> {currentAction.data.driverName || "Tariq Khan"}</div>
                                <div><strong className="text-slate-500">Total Hire:</strong> PKR {Number(currentAction.data.totalTruckHire || 0).toLocaleString()}</div>
                                <div><strong className="text-slate-500">Advance:</strong> PKR {Number(currentAction.data.advancePaid || 0).toLocaleString()}</div>
                              </div>
                            </div>

                            {cardStatus === "pending" && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirmChallan(m.id, currentAction.data)}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold h-7 rounded-lg gap-1 shadow-xs"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Confirm &amp; Issue Challan</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push("/admin/challan")}
                                  className="h-7 px-2 text-[10px] font-bold text-slate-600"
                                >
                                  Open Challans
                                </Button>
                              </div>
                            )}

                            {cardStatus === "saved" && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <Button
                                  size="sm"
                                  onClick={() => router.push("/admin/challan-in-transit")}
                                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold h-7 rounded-lg gap-1 shadow-xs"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Print Manifest &amp; Track</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. CASHBOOK VOUCHER CONFIRMATION CARD */}
                        {(currentAction.type === "ADD_CASHBOOK_TRANSACTION" || currentAction.type === "quick_expense") && (
                          <div className="rounded-xl p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1">
                                <PlusCircle className="w-3.5 h-3.5" />
                                Cash Book Voucher ({currentAction.data.type === "IN" ? "Cash In / Aamad" : "Cash Out / Kharcha"})
                              </span>
                              {cardStatus === "saved" && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> SAVED IN CASHBOOK
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] space-y-1 text-slate-700 dark:text-slate-300">
                              <div className="grid grid-cols-2 gap-1 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                <div><strong className="text-slate-500">Category:</strong> {currentAction.data.category || "Transit Expense"}</div>
                                <div><strong className="text-slate-500">Amount:</strong> PKR {Number(currentAction.data.amount || 0).toLocaleString()}</div>
                                <div className="col-span-2"><strong className="text-slate-500">Party / Head:</strong> {currentAction.data.party || currentAction.data.partyName || "Linehaul Fleet"}</div>
                              </div>
                            </div>

                            {cardStatus === "pending" && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirmCashbook(m.id, currentAction.data)}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold h-7 rounded-lg gap-1 shadow-xs"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Confirm &amp; Save Voucher</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push("/admin/cash-books")}
                                  className="h-7 px-2 text-[10px] font-bold text-slate-600"
                                >
                                  View Books
                                </Button>
                              </div>
                            )}

                            {cardStatus === "saved" && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <Button
                                  size="sm"
                                  onClick={() => router.push("/admin/cash-books")}
                                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold h-7 rounded-lg gap-1 shadow-xs"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Open Day Cash Book</span>
                                </Button>
                              </div>
                            )}
                          </div>
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

            {/* Live Listening Feedback Banner */}
            {isListening && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900/60 animate-in fade-in space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>
                    <span className="text-[11px] font-black text-red-700 dark:text-red-400">
                      Sun raha hoon... (Voice Listening Active)
                    </span>
                  </div>

                  {/* Audio Wave Equalizer Bars */}
                  <div className="flex items-end gap-1 h-5 px-2 bg-red-100 dark:bg-red-900/50 rounded-md">
                    {audioWaveData.map((val, idx) => (
                      <span
                        key={idx}
                        style={{ height: `${Math.max(15, val)}%` }}
                        className="w-1 bg-red-600 dark:bg-red-400 rounded-full transition-all duration-75"
                      />
                    ))}
                  </div>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-200 italic font-medium bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-red-200/50">
                  {interimTranscript || transcript ? (
                    <span>&ldquo;{interimTranscript || transcript}&rdquo;</span>
                  ) : (
                    <span className="text-slate-400">Hukum dein: e.g. &ldquo;Aaj ka profit kitna hai?&rdquo; ya &ldquo;Adamjee ka khata check karo&rdquo;</span>
                  )}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 max-w-[75%]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                <span className="text-xs text-slate-500 font-semibold animate-pulse">
                  Gemini calculations aur operations check kar raha hai...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input & Mic Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center gap-2"
          >
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "Stop Voice Listening" : "Start Voice Assistant (Urdu/Hindi/English)"}
              className={`h-10 w-10 p-0 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                isListening
                  ? "bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4 text-red-600" />
              )}
            </button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Bolte rahein... audio sun raha hoon..." : "Bol kar ya likh kar hukum dein (Profit, Bilty, Khata)..."}
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
