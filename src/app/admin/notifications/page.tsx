"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Phone,
  MessageSquare,
  Building,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
} from "lucide-react";

export interface ContactMessageData {
  id: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  createdAt: string;
  status: "NEW" | "IN_REVIEW" | "RESOLVED";
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
  contactData?: ContactMessageData;
}

const LOCAL_READ_IDS_KEY = "spd_notifications_read_ids";
const LOCAL_DELETED_IDS_KEY = "spd_notifications_deleted_ids";
const LOCAL_CONTACT_STATUSES_KEY = "spd_contact_message_statuses";
const LOCAL_CONTACT_INQUIRIES_KEY = "spd_contact_inquiries";

const SEED_NOTIFICATIONS: NotificationItem[] = [];

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
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "contact">("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Contact Message Detail Modal
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageData | null>(null);
  const [activeNotifIdForModal, setActiveNotifIdForModal] = useState<string | null>(null);

  // Read LocalStorage Helpers
  const getReadIds = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LOCAL_READ_IDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const getDeletedIds = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LOCAL_DELETED_IDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const getContactStatuses = (): Record<string, "NEW" | "IN_REVIEW" | "RESOLVED"> => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(LOCAL_CONTACT_STATUSES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const getLocalInquiries = (): any[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LOCAL_CONTACT_INQUIRIES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const notifyNavbar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("spd-notifications-updated"));
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const readIds = getReadIds();
      const deletedIds = getDeletedIds();
      const contactStatuses = getContactStatuses();

      let apiList: NotificationItem[] = [];
      try {
        const res = await fetch(`/api/admin/notifications?filter=all`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          apiList = data.data;
        }
      } catch (e) {
        console.warn("API notifications fetch failed, using fallback/seed:", e);
      }

      // Convert stored contact inquiries into notifications
      const localInquiries = getLocalInquiries();
      const inquiryNotifs: NotificationItem[] = localInquiries.map((inq: any) => ({
        id: inq.id || `inq-${Date.now()}`,
        type: "CONTACT",
        title: `New Inquiry from ${inq.name || "Customer"}`,
        message: `${inq.subject || "Freight Inquiry"}: "${inq.message || "Cargo request"}" (Phone: ${inq.phone || "N/A"})`,
        isRead: false,
        link: "#contact-inquiry",
        createdAt: inq.createdAt || new Date().toISOString(),
        contactData: {
          id: inq.id,
          name: inq.name || "Customer",
          phone: inq.phone || "N/A",
          email: inq.email || "spdgoodstransport@gmail.com",
          company: inq.company || "Direct Freight Client",
          subject: inq.subject || "Freight Transport Inquiry",
          message: inq.message || "General cargo inquiry",
          createdAt: inq.createdAt || new Date().toISOString(),
          status: contactStatuses[inq.id] || inq.status || "NEW",
        },
      }));

      // Combine API list, inquiry notifications, and seed notifications
      const combinedMap = new Map<string, NotificationItem>();

      // 1. Add seed notifications first
      for (const s of SEED_NOTIFICATIONS) {
        combinedMap.set(s.id, { ...s });
      }

      // 2. Add inquiry notifications
      for (const inq of inquiryNotifs) {
        combinedMap.set(inq.id, inq);
      }

      // 3. Add API notifications (overriding or supplementing)
      for (const apiItem of apiList) {
        combinedMap.set(apiItem.id, apiItem);
      }

      // Convert map to array and apply read/deleted overrides from localStorage
      let list: NotificationItem[] = Array.from(combinedMap.values())
        .filter((item) => !deletedIds.includes(item.id))
        .map((item) => {
          const isRead = readIds.includes(item.id) ? true : item.isRead;
          let contactData = item.contactData;

          // If it's a contact notification without contactData, synthesize one
          if (item.type === "CONTACT" && !contactData) {
            const raw = item.message || "";
            const phoneMatch = raw.match(/Phone:\s*([^\)]+)/i);
            const phone = phoneMatch ? phoneMatch[1].trim() : "0325 2024433";
            const nameMatch = item.title.replace(/^New Inquiry from\s*/i, "").trim();
            const senderName = nameMatch || "Customer";

            contactData = {
              id: item.id,
              name: senderName,
              phone: phone,
              email: "spdgoodstransport@gmail.com",
              company: "National Freight Customer",
              subject: item.title,
              message: item.message,
              createdAt: item.createdAt,
              status: contactStatuses[item.id] || "NEW",
            };
          } else if (contactData) {
            contactData = {
              ...contactData,
              status: contactStatuses[contactData.id] || contactStatuses[item.id] || contactData.status || "NEW",
            };
          }

          return {
            ...item,
            isRead,
            contactData,
          };
        });

      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(list);
      const unread = list.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark single as read
  const markAsRead = async (id: string) => {
    try {
      const readIds = getReadIds();
      if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem(LOCAL_READ_IDS_KEY, JSON.stringify(readIds));
      }

      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      notifyNavbar();

      fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setActionInProgress(true);
      const readIds = getReadIds();
      for (const n of notifications) {
        if (!readIds.includes(n.id)) {
          readIds.push(n.id);
        }
      }
      localStorage.setItem(LOCAL_READ_IDS_KEY, JSON.stringify(readIds));

      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      notifyNavbar();

      fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setActionInProgress(false);
    }
  };

  // Delete single notification
  const deleteNotification = async (id: string) => {
    try {
      const deletedIds = getDeletedIds();
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem(LOCAL_DELETED_IDS_KEY, JSON.stringify(deletedIds));
      }

      const deletedItem = notifications.find((item) => item.id === id);
      if (deletedItem && !deletedItem.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      notifyNavbar();

      fetch(`/api/admin/notifications?id=${id}`, {
        method: "DELETE",
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      setActionInProgress(true);
      const deletedIds = getDeletedIds();
      for (const n of notifications) {
        if (!deletedIds.includes(n.id)) {
          deletedIds.push(n.id);
        }
      }
      localStorage.setItem(LOCAL_DELETED_IDS_KEY, JSON.stringify(deletedIds));

      setNotifications([]);
      setUnreadCount(0);
      notifyNavbar();

      fetch("/api/admin/notifications?clearRead=true", {
        method: "DELETE",
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to clear all notifications:", err);
    } finally {
      setActionInProgress(false);
    }
  };

  // Open Contact Inquiry Modal
  const openContactModal = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    setActiveNotifIdForModal(item.id);
    setSelectedMessage(item.contactData || null);
  };

  // Update Contact Status (NEW, IN_REVIEW, RESOLVED)
  const updateContactStatus = (status: "NEW" | "IN_REVIEW" | "RESOLVED") => {
    if (!selectedMessage) return;
    const targetId = selectedMessage.id || activeNotifIdForModal || "";
    const statuses = getContactStatuses();
    statuses[targetId] = status;
    localStorage.setItem(LOCAL_CONTACT_STATUSES_KEY, JSON.stringify(statuses));

    setSelectedMessage({ ...selectedMessage, status });

    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === targetId || n.contactData?.id === targetId) {
          return {
            ...n,
            contactData: n.contactData ? { ...n.contactData, status } : undefined,
          };
        }
        return n;
      })
    );
  };

  // Filtered Notifications list
  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.isRead);
    if (filter === "read") return notifications.filter((n) => n.isRead);
    if (filter === "contact") return notifications.filter((n) => n.type === "CONTACT");
    return notifications;
  }, [notifications, filter]);

  const contactInquiriesCount = useMemo(() => {
    return notifications.filter((n) => n.type === "CONTACT").length;
  }, [notifications]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Alerts"
        description="Real-time operational alerts, bilty updates, payments, fleet driver assignments, and customer inquiries."
      >
        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            disabled={loading}
            className="rounded-xl text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={markAllAsRead}
              disabled={actionInProgress}
              className="bg-spd-red hover:bg-red-700 text-white gap-1.5 rounded-xl text-xs font-bold shadow-md shadow-spd-red/20"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All as Read
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllNotifications}
              disabled={actionInProgress}
              className="rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Filter Tabs & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl flex-wrap">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              filter === "all"
                ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              filter === "unread"
                ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 bg-spd-red text-white text-[10px] font-black rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilter("read")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              filter === "read"
                ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Read
          </button>
          <button
            type="button"
            onClick={() => setFilter("contact")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              filter === "contact"
                ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-rose-500" />
            <span>Contact Inquiries</span>
            {contactInquiriesCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full">
                {contactInquiriesCount}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
          <span>Active: {notifications.length}</span>
          <span>&bull;</span>
          <span className="text-spd-red font-bold">{unreadCount} unread</span>
        </div>
      </div>

      {/* Notification Stream */}
      {loading && notifications.length === 0 ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-spd-red" />
          <p className="text-xs font-bold text-slate-500">Loading live operational alerts...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={
            filter === "unread"
              ? "All Caught Up!"
              : filter === "contact"
              ? "No Contact Inquiries"
              : "No notifications"
          }
          description={
            filter === "unread"
              ? "You have acknowledged all recent operational alerts and consignment updates."
              : filter === "contact"
              ? "Customer freight inquiries submitted through the contact portal will be listed here."
              : "System notifications such as new bilties, vouchers, and fleet updates will appear here."
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => {
            const isContact = item.type === "CONTACT";
            const contactStatus = item.contactData?.status || "NEW";

            return (
              <div
                key={item.id}
                className={`group flex items-start justify-between gap-3 p-4 rounded-2xl border transition-all duration-200 ${
                  item.isRead
                    ? "bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800/80 opacity-90 hover:opacity-100"
                    : "bg-white dark:bg-slate-900 border-spd-red/30 shadow-sm hover:border-spd-red/60 ring-1 ring-spd-red/10"
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      item.isRead
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        : "bg-spd-red/10 text-spd-red ring-1 ring-spd-red/20"
                    }`}
                  >
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm tracking-tight ${
                          item.isRead
                            ? "font-semibold text-slate-700 dark:text-slate-200"
                            : "font-black text-slate-950 dark:text-white"
                        }`}
                      >
                        {item.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold rounded-lg border-slate-200 dark:border-slate-700"
                      >
                        {item.type}
                      </Badge>
                      {isContact && (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            contactStatus === "RESOLVED"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                              : contactStatus === "IN_REVIEW"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          }`}
                        >
                          {contactStatus === "RESOLVED"
                            ? "Resolved"
                            : contactStatus === "IN_REVIEW"
                            ? "In Review"
                            : "New Inquiry"}
                        </span>
                      )}
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-spd-red shrink-0 animate-pulse" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words font-medium">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-4 pt-1.5 text-[11px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(item.createdAt)}
                      </span>

                      {isContact ? (
                        <button
                          onClick={() => openContactModal(item)}
                          className="font-bold text-rose-600 dark:text-rose-400 inline-flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Inquiry & Reply</span>
                        </button>
                      ) : item.link ? (
                        <Link
                          href={item.link}
                          className="font-bold text-spd-blue hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1 hover:underline"
                        >
                          <span>View Details</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  {isContact && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openContactModal(item)}
                      className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hidden sm:inline-flex"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Respond</span>
                    </Button>
                  )}

                  {!item.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(item.id)}
                      title="Mark as read"
                      className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(item.id)}
                    title="Delete notification"
                    className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONTACT INQUIRY & MESSAGE VIEW TEMPLATE MODAL */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-xl rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                    Freight Customer Inquiry
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Official dispatch message received via SPD portal
                  </DialogDescription>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`text-xs font-black px-3 py-1 rounded-full ${
                  selectedMessage?.status === "RESOLVED"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                    : selectedMessage?.status === "IN_REVIEW"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                }`}
              >
                {selectedMessage?.status === "RESOLVED"
                  ? "✓ Resolved"
                  : selectedMessage?.status === "IN_REVIEW"
                  ? "⏳ In Review"
                  : "★ New Inquiry"}
              </span>
            </div>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4 pt-2">
              {/* Sender Details Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Sender Name
                    </span>
                    <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-spd-blue" />
                      {selectedMessage.name}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Company / Organization
                    </span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {selectedMessage.company || "Commercial Freight Client"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Contact Phone / WhatsApp
                    </span>
                    <a
                      href={`tel:${selectedMessage.phone}`}
                      className="text-xs font-bold text-spd-red hover:underline flex items-center gap-1.5 mt-0.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {selectedMessage.phone}
                    </a>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Email Address
                    </span>
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-xs font-bold text-spd-blue hover:underline flex items-center gap-1.5 mt-0.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {selectedMessage.email}
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">Subject: <strong className="text-slate-800 dark:text-slate-200">{selectedMessage.subject}</strong></span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedMessage.createdAt).toLocaleString("en-PK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>

              {/* Message Body Block */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Full Inquiry Message:
                </span>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Status Toggling Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Update Ticket Status:
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={selectedMessage.status === "NEW" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateContactStatus("NEW")}
                    className={`rounded-xl text-xs font-bold ${
                      selectedMessage.status === "NEW"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    ★ Mark New
                  </Button>
                  <Button
                    type="button"
                    variant={selectedMessage.status === "IN_REVIEW" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateContactStatus("IN_REVIEW")}
                    className={`rounded-xl text-xs font-bold ${
                      selectedMessage.status === "IN_REVIEW"
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    ⏳ In Review
                  </Button>
                  <Button
                    type="button"
                    variant={selectedMessage.status === "RESOLVED" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateContactStatus("RESOLVED")}
                    className={`rounded-xl text-xs font-bold ${
                      selectedMessage.status === "RESOLVED"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    ✓ Resolved
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {selectedMessage && (
              <div className="flex items-center justify-between w-full flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                  className="rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  {/* WhatsApp Quick Reply */}
                  {selectedMessage.phone && (
                    <a
                      href={`https://wa.me/${selectedMessage.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Assalam-o-Alaikum ${selectedMessage.name}, thank you for contacting Super Pak Data Goods Transport Co. Regarding your freight inquiry: "${selectedMessage.subject}" - our dispatch department is ready to assist you.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Reply WhatsApp</span>
                    </a>
                  )}

                  {/* Email Quick Reply */}
                  <a
                    href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                      `Re: ${selectedMessage.subject} - SPD Logistics Dispatch`
                    )}&body=${encodeURIComponent(
                      `Dear ${selectedMessage.name},\n\nThank you for reaching out to Super Pak Data Goods Transport Co. (SPD Logistics).\n\nIn response to your inquiry regarding:\n"${selectedMessage.message}"\n\nOur operations team has reviewed your freight requirements...\n\nWarm regards,\nSPD Logistics Central Dispatch\nspdgoodstransport@gmail.com\n0325 2024433 / 0300 2024433`
                    )}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-spd-blue hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reply via Email</span>
                  </a>
                </div>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
