import React from "react";
import prisma from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Users, Printer, Download, Eye, TrendingUp, Building2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      transactions: {
        orderBy: { date: "desc" },
      },
    },
  });

  const totalReceivable = accounts.reduce((acc, a) => {
    const latestTx = a.transactions[0];
    return acc + (latestTx ? latestTx.balance : a.openingBalance);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Customer Ledgers & Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            General ledgers, debit/credit postings, running balances, and customer statements.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Total Outstanding Portfolio</p>
            <p className="text-lg font-black text-amber-400 mt-0.5">{formatCurrency(totalReceivable)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="text-xs font-bold">Account # & Name</TableHead>
              <TableHead className="text-xs font-bold">Linked Customer</TableHead>
              <TableHead className="text-xs font-bold">Opening Balance</TableHead>
              <TableHead className="text-xs font-bold">Total Vouchers</TableHead>
              <TableHead className="text-xs font-bold">Current Running Balance</TableHead>
              <TableHead className="text-xs font-bold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((a) => {
              const latestBalance = a.transactions[0] ? a.transactions[0].balance : a.openingBalance;

              return (
                <TableRow key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <TableCell>
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{a.accountName}</p>
                      <p className="text-[10px] font-mono text-slate-400">{a.accountNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-bold text-spd-blue">
                      {a.customer?.companyName || a.customer?.name || "General Client"}
                    </p>
                    <p className="text-[10px] text-slate-400">{a.customer?.city || "Station"} &bull; {a.customer?.phone || "No phone"}</p>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(a.openingBalance)}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900 dark:text-white">
                    {a.transactions.length} entries
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-black ${
                        latestBalance > 0 ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {formatCurrency(latestBalance)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/customers`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs font-bold text-spd-blue hover:bg-blue-50 dark:hover:bg-blue-950/50 gap-1 rounded-xl"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Ledger</span>
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
