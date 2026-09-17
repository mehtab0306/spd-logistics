"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCheck,
  Trash2,
  Package,
  CreditCard,
  ArrowUpRight,
  Users,
  UserCog,
  Mail,
  Info,
  ExternalLink,
  Check,
  RefreshCw,
  Clock,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return date.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "BILTY":
      return <Package className="h-5 w-5 text-spd-red" />;
    case "PAYMENT":
      return <CreditCard className="h-5 w-5 text-emerald-600" />;
    case "PAYABLE":
      return <ArrowUpRight className="h-5 w-5 text-amber-600" />;
    case "CUSTOMER":
      return <Users className="h-5 w-5 text-spd-blue" />;
    case "DRIVER":
      return <UserCog className="h-5 w-5 text-indigo-600" />;
    case "CONTACT":
      return <Mail className="h-5 w-5 text-rose-600" />;
    default:
      return <Info className="h-5 w-5 text-slate-600" />;
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionInProgress, setActionInProgress] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/notifications?filter=${filter}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
        if (typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const notifyUpdated = () => {
    window.dispatchEvent(new CustomEvent("spd-notifications-updated"));
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        notifyUpdated();
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setActionInProgress(true);
      const res = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        setUnreadCount(0);
        notifyUpdated();
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setActionInProgress(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        const deletedItem = notifications.find((item) => item.id === id);
        if (deletedItem && !deletedItem.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        setNotifications((prev) => prev.filter((item) => item.id !== id));
        notifyUpdated();
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const clearReadNotifications = async () => {
    try {
      setActionInProgress(true);
      const res = await fetch("/api/admin/notifications?clearRead=true", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.filter((item) => !item.isRead));
        notifyUpdated();
      }
    } catch (err) {
      console.error("Failed to clear read notifications:", err);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Alerts"
        description="Real-time operational alerts, bilty updates, payments, and system events."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={markAllAsRead}
              disabled={actionInProgress}
              className="bg-spd-red hover:bg-red-700 text-white gap-1.5"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All as Read
            </Button>
          )}
          {notifications.some((n) => n.isRead) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearReadNotifications}
              disabled={actionInProgress}
              className="text-muted-foreground hover:text-destructive gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Clear Read
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Filter Tabs & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              filter === "unread"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 bg-spd-red text-white text-[10px] font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilter("read")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === "read"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Read
          </button>
        </div>

        <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
          <span>Total: {notifications.length}</span>
          <span>&bull;</span>
          <span className="text-spd-red font-semibold">{unreadCount} unread</span>
        </div>
      </div>

      {/* Notification Stream */}
      {loading && notifications.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-spd-red" />
          <p className="text-sm font-medium">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
          description={
            filter === "unread"
              ? "All caught up! You have read all system alerts."
              : "System events such as new bilties, payments, and customer inquiries will appear here automatically."
          }
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`group flex items-start justify-between gap-4 p-4 rounded-xl border transition-all duration-200 ${
                item.isRead
                  ? "bg-card/40 hover:bg-card border-border/40 opacity-80 hover:opacity-100"
                  : "bg-card border-spd-red/30 shadow-sm hover:border-spd-red/60"
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    item.isRead
                      ? "bg-muted text-muted-foreground"
                      : "bg-spd-red/10 text-spd-red ring-1 ring-spd-red/20"
                  }`}
                >
                  {getNotificationIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={`text-sm tracking-tight ${
                        item.isRead ? "font-semibold text-foreground/90" : "font-bold text-foreground"
                      }`}
                    >
                      {item.title}
                    </h4>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase tracking-wider font-semibold">
                      {item.type}
                    </Badge>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-spd-red shrink-0 animate-pulse" />
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed break-words">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(item.createdAt)}
                    </span>

                    {item.link && (
                      <Link
                        href={item.link}
                        className="font-medium text-spd-blue hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1 hover:underline"
                      >
                        <span>View Details</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                {!item.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(item.id)}
                    title="Mark as read"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNotification(item.id)}
                  title="Delete notification"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
