"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Megaphone,
  Search,
  Plus,
  Phone,
  MessageSquare,
  Building2,
  Calendar,
  Send,
  CheckCircle2,
  Clock,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Copy,
  ExternalLink,
  Trash2,
  Edit,
  Truck,
  Sparkles,
  Filter,
} from "lucide-react";
import { PAKISTAN_CITIES } from "@/lib/constants";
import {
  getStoredMarketingLeads,
  saveStoredMarketingLead,
  removeStoredMarketingLead,
} from "@/lib/local-persistence";

interface MarketingLead {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  city: string;
  industry: string;
  estimatedMonthlyVolume?: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL_SENT" | "WON" | "LOST";
  notes?: string;
  assignedTo?: string;
  nextFollowUpDate?: string;
  createdAt: string;
  updatedAt?: string;
}

const LEAD_STATUS_CONFIG = {
  NEW: { label: "New Lead", color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300" },
  CONTACTED: { label: "Contacted", color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300" },
  QUALIFIED: { label: "Qualified", color: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300" },
  PROPOSAL_SENT: { label: "Proposal Sent", color: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300" },
  WON: { label: "Won / Customer", color: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300" },
  LOST: { label: "Lost / Closed", color: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300" },
};

const INDUSTRY_OPTIONS = [
  "General Cargo",
  "Textile & Garments",
  "FMCG & Food Products",
  "Pharmaceuticals",
  "Electronics & Appliances",
  "Automotive & Spare Parts",
  "Chemicals & Fertilizers",
  "Heavy Machinery & Hardware",
  "E-commerce & Distribution",
  "Plastics & Packaging",
  "Other / Trader",
];

const CAMPAIGN_TEMPLATES = [
  {
    id: "camp-khi-lhr-container",
    title: "Karachi — Lahore Container Freight Express",
    category: "Container Logistics",
    audience: "Industrial manufacturers, importers, FMCG traders",
    message: `Salam {name}! SPD Logistics provides direct 24-Hours Urgent Container, Mazda & Train freight service from Karachi to Lahore & countrywide. 

✅ Plot #9 Hawksbay Truck Stand Karachi to Saggian Bypass Lahore
✅ Daily guaranteed dispatch & live digital shipment tracking
✅ Competitive commercial freight rates & corporate billing
✅ Safe, insured cargo handling for commercial goods

For special freight booking rates or contract enquiries, reply here or call our Karachi dispatch desk: 021-32351333 / 0300-2024433.`,
  },
  {
    id: "camp-urgent-mazda",
    title: "Urgent 24-Hour Mazda Transport Corridor",
    category: "Urgent Freight",
    audience: "Textile mills, urgent parcel shippers, spare parts suppliers",
    message: `Salam {name}! Need guaranteed urgent cargo delivery within 24 hours between Karachi, Lahore and Punjab stations?

SPD Logistics Mazda express dispatch operates 7 days a week:
🚚 Dedicated Mazda trucks for urgent goods
📦 Same-day loading from Hawksbay Truck Stand Karachi
📍 Immediate delivery at Lahore, Gujranwala, Faisalabad & Multan
📋 Official Bilty & door receipt documentation

Book your next load with SPD Logistics: Tel 0325-2024433 / 0301-8264433.`,
  },
  {
    id: "camp-textile-industrial",
    title: "Industrial & Textile Bulk Freight Package",
    category: "Bulk Commercial",
    audience: "Yarn distributors, cloth merchants, export processing units",
    message: `Respected {name},

SPD Logistics is offering specialized volume freight solutions for textile, yarn, and manufacturing units. We provide reliable containerized freight movement between Karachi port hubs and all major Punjab industrial corridors.

⭐ Dedicated fleet support with seasoned transport brokers
⭐ Professional tally sheet, bilty, and commercial invoice management
⭐ Clean digital ledgers and monthly billing facilities

Let us know your regular monthly tonnage and we will quote you our best volume tariff! Call 0300-2024433 or email superpakdatawale@gmail.com.`,
  },
  {
    id: "camp-festive-rates",
    title: "Special Seasonal Freight Rate Offer",
    category: "Promotional Offer",
    audience: "Retail distributors, wholesalers, commodity traders",
    message: `Salam {name}! SPD Logistics is proud to announce discounted commercial freight rates for seasonal and bulk consignments.

Save on your line-haul transport costs between Karachi and Punjab stations while experiencing 100% reliable tracking, professional handling, and 24-hour delivery commitment.

Get your freight quote in 5 minutes! Reply to this message with your cargo details (goods type, weight/packages, destination) and our logistics team will get back to you immediately.`,
  },
];

export default function MarketingPage() {
  const [leads, setLeads] = useState<MarketingLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("pipeline");

  // Lead modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<MarketingLead | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    city: "Karachi",
    industry: "General Cargo",
    estimatedMonthlyVolume: "",
    status: "NEW" as MarketingLead["status"],
    notes: "",
    nextFollowUpDate: "",
  });

  // WhatsApp Composer
  const [targetPhone, setTargetPhone] = useState("");
  const [targetName, setTargetName] = useState("");
  const [messageBody, setMessageBody] = useState(CAMPAIGN_TEMPLATES[0].message);
  const [copiedStatus, setCopiedStatus] = useState(false);

  // Load leads
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/marketing");
      if (res.ok) {
        const json = await res.json();
        if (json.leads && json.leads.length > 0) {
          setLeads(json.leads);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not fetch server marketing leads, reading local:", e);
    }

    // Fallback to local persistence
    const local = getStoredMarketingLeads();
    setLeads(local);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingLead(null);
    setFormData({
      companyName: "",
      contactPerson: "",
      phone: "",
      email: "",
      city: "Karachi",
      industry: "General Cargo",
      estimatedMonthlyVolume: "",
      status: "NEW",
      notes: "",
      nextFollowUpDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (lead: MarketingLead) => {
    setEditingLead(lead);
    setFormData({
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      phone: lead.phone,
      email: lead.email || "",
      city: lead.city,
      industry: lead.industry,
      estimatedMonthlyVolume: lead.estimatedMonthlyVolume || "",
      status: lead.status,
      notes: lead.notes || "",
      nextFollowUpDate: lead.nextFollowUpDate || "",
    });
    setIsAddModalOpen(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.phone.trim()) {
      alert("Please provide both Company Name and Phone number.");
      return;
    }

    const payload: MarketingLead = {
      id: editingLead ? editingLead.id : `lead-${Date.now()}`,
      companyName: formData.companyName.trim(),
      contactPerson: formData.contactPerson.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      city: formData.city,
      industry: formData.industry,
      estimatedMonthlyVolume: formData.estimatedMonthlyVolume.trim(),
      status: formData.status,
      notes: formData.notes.trim(),
      nextFollowUpDate: formData.nextFollowUpDate,
      createdAt: editingLead ? editingLead.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save locally
    saveStoredMarketingLead(payload);

    // Save on server
    try {
      if (editingLead) {
        await fetch("/api/admin/marketing", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "lead", ...payload }),
        });
      } else {
        await fetch("/api/admin/marketing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead: payload }),
        });
      }
    } catch (e) {
      console.warn("Server save error:", e);
    }

    setIsAddModalOpen(false);
    fetchLeads();
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to remove this lead?")) return;
    removeStoredMarketingLead(id);
    try {
      await fetch(`/api/admin/marketing?id=${encodeURIComponent(id)}&type=lead`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn("Server delete error:", e);
    }
    fetchLeads();
  };

  const handleQuickStatusChange = async (id: string, newStatus: MarketingLead["status"]) => {
    const target = leads.find((l) => l.id === id);
    if (!target) return;
    const updated = { ...target, status: newStatus, updatedAt: new Date().toISOString() };
    saveStoredMarketingLead(updated);
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
    try {
      await fetch("/api/admin/marketing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: "lead", status: newStatus }),
      });
    } catch (e) {}
  };

  const handleLaunchWhatsApp = (phone: string, name?: string, customMsg?: string) => {
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "92" + clean.substring(1);
    } else if (!clean.startsWith("92") && clean.length === 10) {
      clean = "92" + clean;
    }
    const finalMsg = (customMsg || messageBody).replace("{name}", name || "Valued Client");
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(finalMsg)}`;
    window.open(url, "_blank");
  };

  const handleSelectTemplateForComposer = (templateText: string) => {
    setMessageBody(templateText);
    setActiveTab("composer");
  };

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !searchTerm ||
        lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
      const matchesCity = cityFilter === "ALL" || lead.city.toLowerCase() === cityFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [leads, searchTerm, statusFilter, cityFilter]);

  // Metrics
  const todayStr = new Date().toISOString().split("T")[0];
  const metrics = useMemo(() => {
    return {
      totalLeads: leads.length,
      activeProspects: leads.filter((l) =>
        ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT"].includes(l.status)
      ).length,
      wonCustomers: leads.filter((l) => l.status === "WON").length,
      followUpsDue: leads.filter(
        (l) =>
          l.nextFollowUpDate &&
          l.nextFollowUpDate <= todayStr &&
          l.status !== "WON" &&
          l.status !== "LOST"
      ).length,
    };
  }, [leads, todayStr]);

  const followUpLeads = useMemo(() => {
    return leads.filter(
      (l) =>
        l.nextFollowUpDate &&
        l.nextFollowUpDate <= todayStr &&
        l.status !== "WON" &&
        l.status !== "LOST"
    );
  }, [leads, todayStr]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Marketing & Growth CRM"
          description="Customer Acquisition Pipeline, Commercial Outreach & WhatsApp Logistics Campaigns"
        />
        <Button
          onClick={handleOpenAdd}
          className="bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add New Lead
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <Megaphone className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">Total registered transport prospects</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{metrics.activeProspects}</div>
            <p className="text-xs text-muted-foreground mt-1">Prospects currently in negotiation</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted Clients</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{metrics.wonCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">Regular transport clients won</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Follow-Ups Due</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{metrics.followUpsDue}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled callbacks due today</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-muted/70 p-1">
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="composer" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> WhatsApp Outreach
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Campaign Offers
          </TabsTrigger>
          <TabsTrigger value="followups" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Reminders ({metrics.followUpsDue})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PIPELINE / LEADS DIRECTORY */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search company, contact, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <select
                    className="h-9 px-3 rounded-md border border-input bg-background text-xs font-medium"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="NEW">New Lead</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSAL_SENT">Proposal Sent</option>
                    <option value="WON">Won / Customer</option>
                    <option value="LOST">Lost</option>
                  </select>
                  <select
                    className="h-9 px-3 rounded-md border border-input bg-background text-xs font-medium"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                  >
                    <option value="ALL">All Cities</option>
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-md border-t overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-semibold">Company / Client</TableHead>
                      <TableHead className="font-semibold">Contact & Phone</TableHead>
                      <TableHead className="font-semibold">City & Sector</TableHead>
                      <TableHead className="font-semibold">Est. Monthly Volume</TableHead>
                      <TableHead className="font-semibold">Pipeline Status</TableHead>
                      <TableHead className="font-semibold">Next Follow-Up</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No leads found matching current filters. Click &ldquo;Add New Lead&rdquo; to register transport prospects.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => {
                        const statusConfig = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.NEW;
                        return (
                          <TableRow key={lead.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">
                              <div>{lead.companyName}</div>
                              {lead.email && (
                                <div className="text-xs text-muted-foreground">{lead.email}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-semibold text-foreground">
                                {lead.contactPerson || "—"}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <Phone className="h-3 w-3" />
                                <span>{lead.phone}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-xs">{lead.city}</div>
                              <div className="text-xs text-muted-foreground">{lead.industry}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-semibold">
                                {lead.estimatedMonthlyVolume || "Standard Load"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <select
                                className={`text-xs px-2 py-1 rounded-md border font-medium ${statusConfig.color}`}
                                value={lead.status}
                                onChange={(e) =>
                                  handleQuickStatusChange(
                                    lead.id,
                                    e.target.value as MarketingLead["status"]
                                  )
                                }
                              >
                                <option value="NEW">New Lead</option>
                                <option value="CONTACTED">Contacted</option>
                                <option value="QUALIFIED">Qualified</option>
                                <option value="PROPOSAL_SENT">Proposal Sent</option>
                                <option value="WON">Won / Customer</option>
                                <option value="LOST">Lost</option>
                              </select>
                            </TableCell>
                            <TableCell>
                              {lead.nextFollowUpDate ? (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-sm font-medium ${
                                    lead.nextFollowUpDate <= todayStr &&
                                    lead.status !== "WON" &&
                                    lead.status !== "LOST"
                                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {lead.nextFollowUpDate}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  title="Send WhatsApp"
                                  onClick={() =>
                                    handleLaunchWhatsApp(lead.phone, lead.contactPerson || lead.companyName)
                                  }
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  title="Edit Lead"
                                  onClick={() => handleOpenEdit(lead)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  title="Delete Lead"
                                  onClick={() => handleDeleteLead(lead.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: WHATSAPP COMPOSER */}
        <TabsContent value="composer" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  Direct WhatsApp Outreach Composer
                </CardTitle>
                <CardDescription>
                  Draft and dispatch personalized transport offers directly to client WhatsApp numbers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Select Existing Lead (Optional)
                  </label>
                  <select
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    onChange={(e) => {
                      const sel = leads.find((l) => l.id === e.target.value);
                      if (sel) {
                        setTargetPhone(sel.phone);
                        setTargetName(sel.contactPerson || sel.companyName);
                      }
                    }}
                  >
                    <option value="">-- Choose from Lead Directory --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.companyName} ({l.phone}) - {l.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Client Contact Name
                    </label>
                    <Input
                      placeholder="e.g. Tariq Mehmood"
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Phone Number (Mobile / WhatsApp)
                    </label>
                    <Input
                      placeholder="e.g. 03001234567"
                      value={targetPhone}
                      onChange={(e) => setTargetPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Message Body (Supports {'{name}'} placeholder)
                  </label>
                  <textarea
                    rows={8}
                    className="w-full rounded-md border border-input bg-background p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary font-mono text-xs leading-relaxed"
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={() => handleLaunchWhatsApp(targetPhone, targetName, messageBody)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" /> Open in WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        messageBody.replace("{name}", targetName || "Valued Client")
                      );
                      setCopiedStatus(true);
                      setTimeout(() => setCopiedStatus(false), 2000);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {copiedStatus ? "Copied!" : "Copy Text"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live WhatsApp Bubble Preview */}
            <Card className="bg-slate-50 dark:bg-slate-900 border">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <ExternalLink className="h-4 w-4" /> Live Mobile Message Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col justify-center items-center py-6">
                <div className="w-full max-w-sm rounded-2xl bg-emerald-700 text-white p-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-emerald-600/60 pb-2 mb-2 text-xs">
                    <span className="font-bold">SPD Logistics • Outreach</span>
                    <span>To: {targetPhone || "+92 300 0000000"}</span>
                  </div>
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-foreground p-3 text-xs leading-relaxed whitespace-pre-wrap shadow-inner">
                    {messageBody.replace("{name}", targetName || "Valued Client")}
                  </div>
                  <div className="text-right text-[10px] text-emerald-200 mt-1">
                    Just now • Direct Official Transport
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: CAMPAIGN TEMPLATES */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CAMPAIGN_TEMPLATES.map((camp) => (
              <Card key={camp.id} className="border shadow-xs hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs font-semibold text-primary">
                      {camp.category}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-primary hover:text-primary flex items-center gap-1 h-7 px-2"
                      onClick={() => handleSelectTemplateForComposer(camp.message)}
                    >
                      <Send className="h-3.5 w-3.5" /> Use in Composer
                    </Button>
                  </div>
                  <CardTitle className="text-base mt-2">{camp.title}</CardTitle>
                  <CardDescription className="text-xs">
                    Target: {camp.audience}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-muted/60 p-3 text-xs font-mono whitespace-pre-wrap max-h-44 overflow-y-auto border text-muted-foreground leading-relaxed">
                    {camp.message}
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs flex items-center gap-1.5 h-8"
                      onClick={() => {
                        navigator.clipboard.writeText(camp.message);
                        alert("Campaign template copied to clipboard!");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: FOLLOW-UP REMINDERS */}
        <TabsContent value="followups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-rose-500" />
                Follow-Ups Due Today & Overdue
              </CardTitle>
              <CardDescription>
                Clients requiring follow-up phone calls or proposals today to close transport bookings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {followUpLeads.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  🎉 No overdue follow-ups! All active transport leads are up to date.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact & Phone</TableHead>
                        <TableHead>Scheduled Date</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {followUpLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-semibold">{lead.companyName}</TableCell>
                          <TableCell>
                            <div>{lead.contactPerson}</div>
                            <div className="text-xs text-muted-foreground">{lead.phone}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-rose-100 text-rose-800 border-rose-300">
                              {lead.nextFollowUpDate}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                            {lead.notes || "No notes"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                onClick={() =>
                                  handleLaunchWhatsApp(
                                    lead.phone,
                                    lead.contactPerson || lead.companyName
                                  )
                                }
                              >
                                <MessageSquare className="h-3.5 w-3.5 mr-1" /> WhatsApp
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => handleQuickStatusChange(lead.id, "CONTACTED")}
                              >
                                Mark Contacted
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ADD / EDIT LEAD MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Edit Lead Details" : "Add New Transport Lead"}</DialogTitle>
            <DialogDescription>
              Register client freight requirements and track sales outreach.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveLead} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Company / Trader Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Al-Raziq Fabrics"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Contact Person
                </label>
                <Input
                  placeholder="e.g. Imran Sheikh"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Phone / Mobile *
                </label>
                <Input
                  required
                  placeholder="0300-1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="info@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">City</label>
                <select
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                >
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Industry</label>
                <select
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                >
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Monthly Volume / Freight
                </label>
                <Input
                  placeholder="e.g. 20 Tons / 5 Mazdas"
                  value={formData.estimatedMonthlyVolume}
                  onChange={(e) => setFormData({ ...formData, estimatedMonthlyVolume: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Pipeline Status
                </label>
                <select
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as MarketingLead["status"] })
                  }
                >
                  <option value="NEW">New Lead</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="PROPOSAL_SENT">Proposal Sent</option>
                  <option value="WON">Won / Customer</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Next Follow-Up Date
              </label>
              <Input
                type="date"
                value={formData.nextFollowUpDate}
                onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Notes</label>
              <Input
                placeholder="Special transport terms, goods type, or discount requested..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white font-semibold">
                {editingLead ? "Save Changes" : "Create Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
