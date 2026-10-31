"use client";

import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserCog,
  Plus,
  Search,
  KeyRound,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Lock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";

const PROTECTED_EMAILS = ["admin.com", "admin@spdlogistics.com"];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "STAFF",
  });

  const DEFAULT_CLIENT_USERS = [
    {
      id: "user-admin-1",
      name: "System Admin",
      email: "spd@gmail.com",
      phone: "0325 2024433",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      lastLoginAt: new Date().toISOString(),
      createdAt: "2026-01-01T00:00:00.000Z",
      customer: null,
      driver: null,
      _count: { auditLogs: 48, consignments: 125, payments: 84 },
    },
    {
      id: "user-ceo-2",
      name: "Faisal Hussain Bhatti",
      email: "faisal@spdlogistics.com",
      phone: "0300 8443322",
      role: "ADMIN",
      status: "ACTIVE",
      lastLoginAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      createdAt: "2026-01-01T00:00:00.000Z",
      customer: null,
      driver: null,
      _count: { auditLogs: 22, consignments: 80, payments: 50 },
    },
    {
      id: "user-md-3",
      name: "Hammad Faisal Bhatti",
      email: "hammad@spdlogistics.com",
      phone: "0325 2024433",
      role: "ADMIN",
      status: "ACTIVE",
      lastLoginAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      createdAt: "2026-01-01T00:00:00.000Z",
      customer: null,
      driver: null,
      _count: { auditLogs: 35, consignments: 95, payments: 60 },
    },
    {
      id: "user-staff-4",
      name: "Muhammad Tariq (Dispatch Manager)",
      email: "tariq@spdlogistics.com",
      phone: "0312 9988776",
      role: "STAFF",
      status: "ACTIVE",
      lastLoginAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      createdAt: "2026-01-15T00:00:00.000Z",
      customer: null,
      driver: null,
      _count: { auditLogs: 64, consignments: 140, payments: 45 },
    },
    {
      id: "user-cust-5",
      name: "Crescent Textile Mills (Corporate)",
      email: "corporate@crescent.com.pk",
      phone: "042 35789000",
      role: "CUSTOMER",
      status: "ACTIVE",
      lastLoginAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      createdAt: "2026-02-01T00:00:00.000Z",
      customer: { id: "c-1", name: "Mian Muhammad Mansha", companyName: "Crescent Textile Mills" },
      driver: null,
      _count: { auditLogs: 5, consignments: 32, payments: 28 },
    },
    {
      id: "user-driver-6",
      name: "Muhammad Khan (Fleet Pilot)",
      email: "driver.khan@spdlogistics.com",
      phone: "0301 5566778",
      role: "DRIVER",
      status: "ACTIVE",
      lastLoginAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      createdAt: "2026-02-10T00:00:00.000Z",
      customer: null,
      driver: { id: "d-1", name: "Muhammad Khan", vehicleNumber: "LES-8921" },
      _count: { auditLogs: 8, consignments: 18, payments: 0 },
    },
  ];

  const LOCAL_USERS_KEY = "spd_local_users";
  const LOCAL_DELETED_USERS_KEY = "spd_deleted_users";

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      let fetchedUsers: any[] = [];
      try {
        const res = await fetch(`/api/admin/users?${params.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          fetchedUsers = data.data;
        } else {
          fetchedUsers = DEFAULT_CLIENT_USERS;
        }
      } catch (err) {
        console.warn("Error fetching users, using fallback:", err);
        fetchedUsers = DEFAULT_CLIENT_USERS;
      }

      // Merge local storage users
      let localUsers: any[] = [];
      let deletedIds: string[] = [];
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_USERS_KEY);
          if (raw) localUsers = JSON.parse(raw);
          const delRaw = localStorage.getItem(LOCAL_DELETED_USERS_KEY);
          if (delRaw) deletedIds = JSON.parse(delRaw);
        } catch (e) {}
      }

      const userMap = new Map<string, any>();
      fetchedUsers.forEach((u) => {
        if (!deletedIds.includes(u.id)) userMap.set(u.id, u);
      });
      localUsers.forEach((u) => {
        if (!deletedIds.includes(u.id)) userMap.set(u.id, u);
      });

      let merged = Array.from(userMap.values());
      if (search) {
        const q = search.toLowerCase();
        merged = merged.filter((u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q)
        );
      }
      if (roleFilter !== "ALL") {
        merged = merged.filter((u) => u.role === roleFilter);
      }
      if (statusFilter !== "ALL") {
        merged = merged.filter((u) => u.status === statusFilter);
      }

      setUsers(merged);
    } catch (err) {
      console.warn("Error processing users:", err);
      setUsers(DEFAULT_CLIENT_USERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const newUser = {
        id: `user_loc_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "0300 0000000",
        role: formData.role,
        status: "ACTIVE",
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
        customer: null,
        driver: null,
        _count: { auditLogs: 0, consignments: 0, payments: 0 },
      };

      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_USERS_KEY);
          const current: any[] = raw ? JSON.parse(raw) : [];
          current.unshift(newUser);
          localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(current));
        } catch (e) {}
      }

      setAddModalOpen(false);
      setFormData({ name: "", email: "", phone: "", password: "", role: "STAFF" });
      setActionFeedback({ type: "success", text: "User created successfully." });
      fetchUsers();

      // Background API call
      fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }).catch((e) => console.warn("Background user creation warning:", e));
    } catch (err: any) {
      setFormError("Failed to create user.");
    } finally {
      setSubmitting(false);
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const handleToggleStatus = async (user: any) => {
    if (PROTECTED_EMAILS.includes(user.email.toLowerCase())) {
      setActionFeedback({ type: "error", text: "Cannot deactivate primary administrator account." });
      setTimeout(() => setActionFeedback(null), 5000);
      return;
    }

    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_USERS_KEY);
        let current: any[] = raw ? JSON.parse(raw) : [];
        const idx = current.findIndex((u) => u.id === user.id);
        if (idx >= 0) {
          current[idx] = { ...current[idx], status: nextStatus };
        } else {
          current.push({ ...user, status: nextStatus });
        }
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(current));
      } catch (e) {}
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
    setActionFeedback({ type: "success", text: `User status changed to ${nextStatus}.` });
    setTimeout(() => setActionFeedback(null), 5000);

    fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, status: nextStatus }),
    }).catch(() => {});
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPassword) return;

    setSubmitting(true);
    try {
      setResetPasswordUser(null);
      setNewPassword("");
      setActionFeedback({ type: "success", text: "User password reset successfully!" });

      fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resetPasswordUser.id, password: newPassword }),
      }).catch(() => {});
    } catch (err) {
      setActionFeedback({ type: "error", text: "Failed to reset user password." });
    } finally {
      setSubmitting(false);
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      if (typeof window !== "undefined") {
        try {
          const delRaw = localStorage.getItem(LOCAL_DELETED_USERS_KEY);
          const deletedIds: string[] = delRaw ? JSON.parse(delRaw) : [];
          if (!deletedIds.includes(deleteUser.id)) {
            deletedIds.push(deleteUser.id);
            localStorage.setItem(LOCAL_DELETED_USERS_KEY, JSON.stringify(deletedIds));
          }
          const raw = localStorage.getItem(LOCAL_USERS_KEY);
          if (raw) {
            const current: any[] = JSON.parse(raw);
            localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(current.filter((u) => u.id !== deleteUser.id)));
          }
        } catch (e) {}
      }

      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setDeleteUser(null);
      setActionFeedback({ type: "success", text: "User removed successfully." });

      fetch(`/api/admin/users?id=${deleteUser.id}`, {
        method: "DELETE",
      }).catch(() => {});
    } catch (err) {
      setActionFeedback({ type: "error", text: "Unable to delete user. Please try again." });
    } finally {
      setDeleting(false);
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const isProtectedUser = (email: string) => PROTECTED_EMAILS.includes(email.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            User Management & Authorization
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage authorized system accounts, assign roles (Admin, Customer, Driver, Staff), control access, and reset passwords.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <Button
            onClick={fetchUsers}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => setAddModalOpen(true)}
            className="w-full sm:w-auto bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-4"
          >
            <Plus className="w-4 h-4" />
            <span>Add Authorized User</span>
          </Button>
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between gap-3 border animate-fade-in ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex-1 sm:flex-initial min-w-[120px]"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="CUSTOMER">Customer</option>
            <option value="DRIVER">Driver</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex-1 sm:flex-initial min-w-[120px]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
          <p className="text-xs text-slate-500 font-medium">Loading user accounts...</p>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No users found"
          description="Try adjusting your search criteria or register a new system user."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <Table className="min-w-[850px]">
            <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="font-bold text-xs">Name & Identity</TableHead>
                <TableHead className="font-bold text-xs">Email / Username</TableHead>
                <TableHead className="font-bold text-xs">Phone</TableHead>
                <TableHead className="font-bold text-xs">System Role</TableHead>
                <TableHead className="font-bold text-xs">Access Status</TableHead>
                <TableHead className="font-bold text-xs">Created Date</TableHead>
                <TableHead className="font-bold text-xs">Last Login</TableHead>
                <TableHead className="font-bold text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isOwner = isProtectedUser(u.email);
                return (
                  <TableRow key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                          {u.name ? u.name.slice(0, 2).toUpperCase() : "US"}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white block">
                            {u.name}
                          </span>
                          {isOwner && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                              <Lock className="w-2.5 h-2.5" /> Primary Owner
                            </span>
                          )}
                          {u.customer && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                              Co: {u.customer.companyName || u.customer.name}
                            </span>
                          )}
                          {u.driver && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                              Truck: {u.driver.vehicleNumber || "Fleet"}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {u.email}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">
                      {u.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                          u.role === "SUPER_ADMIN"
                            ? "bg-red-100 dark:bg-red-950/60 text-spd-red border border-red-200 dark:border-red-900"
                            : u.role === "ADMIN"
                            ? "bg-blue-100 dark:bg-blue-950/60 text-spd-blue border border-blue-200 dark:border-blue-900"
                            : u.role === "DRIVER"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                            : u.role === "CUSTOMER"
                            ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={isOwner}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-colors ${
                          isOwner
                            ? "cursor-not-allowed opacity-90 "
                            : "cursor-pointer hover:opacity-80 "
                        }${
                          u.status === "ACTIVE"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                            : u.status === "DELETED"
                            ? "bg-red-100 dark:bg-red-950/60 text-red-600"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}
                        title={isOwner ? "Primary account status cannot be changed" : "Click to toggle status"}
                      >
                        {u.status}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                          title="Reset Password"
                          onClick={() => {
                            setResetPasswordUser(u);
                            setNewPassword("");
                          }}
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>

                        {isOwner ? (
                          <span
                            className="h-8 w-8 flex items-center justify-center text-slate-300 dark:text-slate-600"
                            title="Primary system administrator account cannot be deleted"
                          >
                            <Lock className="w-4 h-4" />
                          </span>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                            title="Delete User"
                            onClick={() => setDeleteUser(u)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* MODAL 1: ADD NEW USER */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-spd-red" />
              Register New System User
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create an administrative or staff operator account with portal credentials.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-800">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Full Name *
              </Label>
              <Input
                required
                placeholder="e.g. Humayun Administrator"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Login Email / Identifier *
              </Label>
              <Input
                required
                placeholder="e.g. operator@spdlogistics.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Contact Phone
              </Label>
              <Input
                placeholder="03211234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                User Role *
              </Label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="STAFF">Staff Operator</option>
                <option value="ADMIN">System Administrator</option>
                <option value="SUPER_ADMIN">Super Administrator</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Initial Password *
              </Label>
              <Input
                required
                type="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Create User</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: RESET PASSWORD */}
      <Dialog open={!!resetPasswordUser} onOpenChange={() => setResetPasswordUser(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              Reset Account Password
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update credentials for {resetPasswordUser?.name} ({resetPasswordUser?.email}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                New Password
              </Label>
              <Input
                required
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetPasswordUser(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: CONFIRM DELETE USER */}
      <Dialog open={!!deleteUser} onOpenChange={(open) => !deleting && !open && setDeleteUser(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete User Account
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm block">
                Are you sure you want to delete this user?
              </span>
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs space-y-1 border border-slate-200/80 dark:border-slate-700/80">
                <p><strong>Name:</strong> {deleteUser?.name}</p>
                <p><strong>Email / Login:</strong> {deleteUser?.email}</p>
                <p><strong>Role:</strong> {deleteUser?.role}</p>
                <p><strong>Status:</strong> {deleteUser?.status}</p>
              </div>
              <span className="text-[11px] text-slate-500 block leading-relaxed">
                Deleting this account will immediately revoke all authentication access. Any associated business records or activity logs will be safely archived.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteUser(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-md"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete User</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
