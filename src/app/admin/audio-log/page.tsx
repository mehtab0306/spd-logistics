"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/utils";
import {
  Mic,
  Square,
  Play,
  Pause,
  Upload,
  Sparkles,
  Trash2,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileAudio,
  Radio,
  Clock,
  Truck,
  Package,
  MapPin,
  RefreshCw,
} from "lucide-react";

interface AudioLogItem {
  id: string;
  title: string;
  category: string;
  audioUrl: string;
  duration: number;
  fileSize: number;
  mimeType: string;
  biltyNumber?: string | null;
  driverName?: string | null;
  vehicleNumber?: string | null;
  warehouse: string;
  transcription?: string | null;
  notes?: string | null;
  recordedBy?: string | null;
  createdAt: string;
}

export default function AudioLogPage() {
  const [logs, setLogs] = useState<AudioLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedWarehouse, setSelectedWarehouse] = useState("ALL");

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "DISPATCH",
    warehouse: "LAHORE",
    biltyNumber: "",
    driverName: "",
    vehicleNumber: "",
    notes: "",
    transcription: "",
  });

  // Audio Playback in List
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/audio-log");
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setLogs(data.data);
        }
      }
    } catch (err: any) {
      console.error("Error loading audio logs:", err);
      setFeedback({ type: "error", message: err.message || "Failed to load audio logs." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Recording Controls
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setIsPaused(false);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setFeedback({
        type: "error",
        message: "Microphone permission denied or unavailable. You can also upload pre-recorded audio files below.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setIsPaused(false);
    setRecordDuration(0);
    setRecordedAudioBlob(null);
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedAudioUrl(null);
    setSelectedFile(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      resetRecording();
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setRecordedAudioUrl(url);
      if (!formData.title) {
        setFormData((prev) => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, ""),
        }));
      }
    }
  };

  const handleTranscribe = async () => {
    const fileToTranscribe = selectedFile || (recordedAudioBlob ? new File([recordedAudioBlob], "recording.webm", { type: "audio/webm" }) : null);
    if (!fileToTranscribe) {
      setFeedback({ type: "error", message: "Please record or select an audio file first." });
      return;
    }

    setTranscribing(true);
    setFeedback(null);

    try {
      const fd = new FormData();
      fd.append("file", fileToTranscribe);

      const res = await fetch("/api/admin/audio-log/transcribe", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (res.ok && data.success && data.text) {
        setFormData((prev) => ({ ...prev, transcription: data.text }));
        setFeedback({ type: "success", message: "Speech successfully transcribed via Groq Whisper AI!" });
      } else {
        setFeedback({
          type: "info",
          message: data.error || "Groq Whisper speech-to-text requires GROQ_API_KEY configured in server .env.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "info",
        message: err.message || "Transcription requires Groq API key configuration.",
      });
    } finally {
      setTranscribing(false);
    }
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFeedback({ type: "error", message: "Audio Log title or subject is required." });
      return;
    }

    const audioSource = selectedFile || (recordedAudioBlob ? new File([recordedAudioBlob], "recording.webm", { type: "audio/webm" }) : null);
    if (!audioSource && !recordedAudioUrl) {
      setFeedback({ type: "error", message: "Please record a voice memo or select an audio file to save." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("category", formData.category);
      fd.append("warehouse", formData.warehouse);
      if (formData.biltyNumber) fd.append("biltyNumber", formData.biltyNumber);
      if (formData.driverName) fd.append("driverName", formData.driverName);
      if (formData.vehicleNumber) fd.append("vehicleNumber", formData.vehicleNumber);
      if (formData.notes) fd.append("notes", formData.notes);
      if (formData.transcription) fd.append("transcription", formData.transcription);
      fd.append("duration", String(recordDuration || 30));

      if (audioSource) {
        fd.append("file", audioSource);
      } else {
        fd.append("audioUrl", "/spd.mp4");
      }

      const res = await fetch("/api/admin/audio-log", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save Audio Log");
      }

      setFeedback({ type: "success", message: "Audio Log saved and permanently registered in system!" });
      resetRecording();
      setFormData({
        title: "",
        category: "DISPATCH",
        warehouse: "LAHORE",
        biltyNumber: "",
        driverName: "",
        vehicleNumber: "",
        notes: "",
        transcription: "",
      });
      fetchLogs();
    } catch (err: any) {
      console.error("Save audio log error:", err);
      setFeedback({ type: "error", message: err.message || "Failed to save audio log." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this Audio Log?")) return;

    try {
      const res = await fetch(`/api/admin/audio-log?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs((prev) => prev.filter((l) => l.id !== id));
        if (currentlyPlayingId === id && activeAudioRef.current) {
          activeAudioRef.current.pause();
          setCurrentlyPlayingId(null);
        }
        setFeedback({ type: "success", message: "Audio Log deleted successfully." });
      } else {
        throw new Error(data.error || "Failed to delete Audio Log");
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete audio log." });
    }
  };

  const togglePlayAudio = (id: string, url: string) => {
    if (currentlyPlayingId === id && activeAudioRef.current) {
      if (activeAudioRef.current.paused) {
        activeAudioRef.current.play();
      } else {
        activeAudioRef.current.pause();
        setCurrentlyPlayingId(null);
      }
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }

    const audio = new Audio(url);
    activeAudioRef.current = audio;
    setCurrentlyPlayingId(id);

    audio.onended = () => {
      setCurrentlyPlayingId(null);
    };

    audio.onerror = () => {
      setCurrentlyPlayingId(null);
      setFeedback({ type: "error", message: "Could not play audio stream." });
    };

    audio.play().catch(() => {
      setCurrentlyPlayingId(null);
    });
  };

  const filteredLogs = logs.filter((l) => {
    if (selectedCategory !== "ALL" && l.category !== selectedCategory) return false;
    if (selectedWarehouse !== "ALL" && l.warehouse !== selectedWarehouse) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        l.title.toLowerCase().includes(s) ||
        (l.biltyNumber && l.biltyNumber.toLowerCase().includes(s)) ||
        (l.driverName && l.driverName.toLowerCase().includes(s)) ||
        (l.vehicleNumber && l.vehicleNumber.toLowerCase().includes(s)) ||
        (l.transcription && l.transcription.toLowerCase().includes(s)) ||
        (l.notes && l.notes.toLowerCase().includes(s))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Audio Log & Voice Dispatch Memos"
        description="Operational voice memos, driver check-in logs, terminal audio records, and AI speech transcriptions."
      />

      {/* Top Notification Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : feedback.type === "error"
              ? "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
              : "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : feedback.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFeedback(null)}
            className="h-6 px-2 text-[11px] font-bold"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl p-4 border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-spd-red/10 text-spd-red">
              <FileAudio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Total Audio Logs</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{logs.length}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl p-4 border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Dispatch Memos</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {logs.filter((l) => l.category === "DISPATCH").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl p-4 border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Driver Check-ins</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {logs.filter((l) => l.category === "DRIVER").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl p-4 border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Terminal Reports</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {logs.filter((l) => l.category === "TERMINAL").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Studio Card: Audio Recording & Submission */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-spd-red" />
                Audio Dispatch Studio & Voice Memo Recorder
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Record directly from microphone or upload audio notes from drivers and field dispatchers.
              </CardDescription>
            </div>
            <Badge variant="outline" className="w-fit font-mono text-[10px]">
              LOGISTICS VOICE ENGINE
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Recorder Controls Bar */}
          <div className="p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              {!isRecording ? (
                <Button
                  type="button"
                  onClick={startRecording}
                  className="bg-spd-red hover:bg-spd-redHover text-white font-bold rounded-xl shadow-md gap-2 h-11 px-6 text-xs"
                >
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Start Live Recording</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={stopRecording}
                  className="bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md gap-2 h-11 px-6 text-xs"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop & Save Clip ({recordDuration}s)</span>
                </Button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.wav,.mp3,.webm,.ogg,.m4a"
                onChange={handleFileUpload}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl font-bold gap-2 h-11 px-5 text-xs border-slate-300 dark:border-slate-600"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Upload Audio File</span>
              </Button>

              {(recordedAudioUrl || selectedFile) && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetRecording}
                  className="rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600"
                >
                  Clear Audio
                </Button>
              )}
            </div>

            {/* Live Recording Status / Preview Player */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {isRecording && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-black animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <span>Recording Active: {recordDuration}s</span>
                </div>
              )}

              {recordedAudioUrl && !isRecording && (
                <div className="flex items-center gap-2">
                  <audio src={recordedAudioUrl} controls className="h-9 max-w-[240px] sm:max-w-[280px]" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={transcribing}
                    onClick={handleTranscribe}
                    className="rounded-xl h-9 text-xs font-bold gap-1.5 bg-white dark:bg-slate-900 shadow-xs border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400"
                  >
                    {transcribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>AI Transcribe</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Form */}
          <form onSubmit={handleSaveLog} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Audio Memo Title / Subject *
                </Label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Lahore Departure Briefing — Container #TK-4431"
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Category *
                </Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="DISPATCH">Dispatch Instruction</option>
                  <option value="DRIVER">Driver Check-in</option>
                  <option value="TERMINAL">Terminal Report</option>
                  <option value="INCIDENT">Route / Highway Incident</option>
                  <option value="DELIVERY">Delivery Confirmation</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Terminal / Warehouse *
                </Label>
                <select
                  value={formData.warehouse}
                  onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="LAHORE">Lahore Main Terminal</option>
                  <option value="KARACHI">Karachi Port Terminal</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Linked Bilty # (Optional)
                </Label>
                <Input
                  value={formData.biltyNumber}
                  onChange={(e) => setFormData({ ...formData, biltyNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. SPD-LHR-2026-9001"
                  className="rounded-xl h-10 text-xs font-mono uppercase font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Driver Name (Optional)
                </Label>
                <Input
                  value={formData.driverName}
                  onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  placeholder="e.g. Muhammad Tariq"
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Vehicle # (Optional)
                </Label>
                <Input
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. TK-4431"
                  className="rounded-xl h-10 text-xs font-mono uppercase font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Operational Notes & Dispatch Summary
                </Label>
                <Textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add operational notes or dispatch context regarding this audio record..."
                  className="rounded-xl text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Speech Transcription (AI Powered)
                  </Label>
                  <span className="text-[10px] text-slate-400 font-medium">Groq Whisper Engine</span>
                </div>
                <Textarea
                  rows={3}
                  value={formData.transcription}
                  onChange={(e) => setFormData({ ...formData, transcription: e.target.value })}
                  placeholder="Transcription text will appear here automatically when 'AI Transcribe' is clicked..."
                  className="rounded-xl text-xs resize-none font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={saving || (!recordedAudioUrl && !selectedFile)}
                className="bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-6"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Save Audio Log to System</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audio by title, bilty #, driver, notes..."
              className="pl-9 rounded-xl h-10 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <option value="ALL">All Categories</option>
            <option value="DISPATCH">Dispatch</option>
            <option value="DRIVER">Driver</option>
            <option value="TERMINAL">Terminal</option>
            <option value="INCIDENT">Incident</option>
            <option value="DELIVERY">Delivery</option>
          </select>

          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <option value="ALL">All Warehouses</option>
            <option value="LAHORE">Lahore</option>
            <option value="KARACHI">Karachi</option>
          </select>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchLogs}
            className="rounded-xl h-10 w-10 shrink-0"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Audio Logs List */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-spd-red mb-3" />
          <p className="text-xs text-slate-500 font-semibold">Loading Audio Logs...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="No Audio Logs Found"
          description="Record a voice memo above or clear your search filters to view logs."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLogs.map((log) => {
            const isPlaying = currentlyPlayingId === log.id;

            return (
              <Card
                key={log.id}
                className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Button
                        type="button"
                        size="icon"
                        onClick={() => togglePlayAudio(log.id, log.audioUrl)}
                        className={`rounded-2xl h-11 w-11 shrink-0 shadow-sm ${
                          isPlaying
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 animate-pulse"
                            : "bg-spd-red hover:bg-spd-redHover text-white"
                        }`}
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </Button>

                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                          {log.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTime(log.createdAt)}</span>
                          <span>•</span>
                          <span>{log.duration || 30}s</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold ${
                          log.category === "DISPATCH"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                            : log.category === "DRIVER"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : log.category === "INCIDENT"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                        }`}
                      >
                        {log.category}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {log.warehouse}
                      </Badge>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-300">
                    {log.biltyNumber && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[11px]">
                        <Package className="w-3 h-3 text-spd-red" />
                        <span>Bilty: {log.biltyNumber}</span>
                      </span>
                    )}
                    {log.driverName && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px]">
                        <Truck className="w-3 h-3 text-slate-500" />
                        <span>{log.driverName}</span>
                      </span>
                    )}
                    {log.vehicleNumber && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                        <span>{log.vehicleNumber}</span>
                      </span>
                    )}
                  </div>

                  {/* Notes / Transcription Preview */}
                  {log.transcription && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                      <p className="font-bold text-[10px] uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Transcription</span>
                      </p>
                      <p className="italic">&ldquo;{log.transcription}&rdquo;</p>
                    </div>
                  )}

                  {log.notes && !log.transcription && (
                    <p className="text-xs text-slate-500 line-clamp-2">{log.notes}</p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Logged by {log.recordedBy || "System Admin"}
                  </span>

                  <div className="flex items-center gap-2">
                    <a href={log.audioUrl} download={`${log.title}.mp4`}>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-1 rounded-lg">
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(log.id)}
                      className="h-7 px-2 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1 rounded-lg"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
