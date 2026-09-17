"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AdminNavbar } from "@/components/layout/admin-navbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-0">
        <AdminNavbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
