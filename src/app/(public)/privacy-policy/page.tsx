import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  Database, 
  Bot, 
  Cookie, 
  UserCheck, 
  Phone, 
  Mail, 
  Truck, 
  AlertCircle, 
  Calendar, 
  CheckCircle2,
  Building2,
  ExternalLink,
  Info
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Privacy Policy | ${APP_NAME} - Super Pak Data Goods Transport Co.`,
  description: 'Official Privacy Policy of Super Pak Data Goods Transport Co. (SPD Logistics). Transparent information on how we collect, use, and safeguard your cargo, tracking, and account data.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 17, 2026";

  const sections = [
    { id: "introduction", title: "1. Introduction" },
    { id: "information-collected", title: "2. Information We Collect" },
    { id: "how-we-use", title: "3. How We Use Information" },
    { id: "communications", title: "4. Communication & WhatsApp" },
    { id: "security", title: "5. Data Storage & Security" },
    { id: "retention", title: "6. Data Retention" },
    { id: "third-parties", title: "7. Third-Party Services" },
    { id: "ai-assistant", title: "8. AI Customer Assistant" },
    { id: "cookies", title: "9. Cookies & Tokens" },
    { id: "user-rights", title: "10. Your Rights & Access" },
    { id: "children", title: "11. Minors' Privacy" },
    { id: "policy-changes", title: "12. Changes to This Policy" },
    { id: "contact", title: "13. Contact & Executive In-Charge" },
  ];

  return (
    <div className="flex flex-col min-h-screen py-10 md:py-16">
      <div className="container max-w-6xl px-4 md:px-6 mx-auto">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950 text-white rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-800 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/20 text-red-400 font-semibold text-xs tracking-wide uppercase mb-4 border border-red-500/30">
              <ShieldCheck className="w-4 h-4 text-red-400" />
              Official Legal Document
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-blue-400">Policy</span>
            </h1>
            
            <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6">
              Super Pak Data Goods Transport Co. (operating as <strong>{APP_NAME}</strong>) is committed to protecting the privacy, confidentiality, and security of all commercial cargo records, tracking credentials, and customer personal information.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-red-400" />
                Effective Date: <strong>{lastUpdated}</strong>
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-400" />
                Jurisdiction: <strong>Islamic Republic of Pakistan</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar / Quick Navigation */}
          <aside className="lg:col-span-4 order-2 lg:order-1">
            <div className="sticky top-24 bg-white dark:bg-slate-900/90 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Table of Contents
              </h2>
              <nav className="space-y-1 text-sm">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>Looking for terms of freight carriage? See our <Link href="/terms" className="text-blue-500 hover:underline font-medium">Terms & Conditions</Link>.</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Body */}
          <main className="lg:col-span-8 order-1 lg:order-2 space-y-10 text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">
            
            {/* Section 1: Introduction */}
            <section id="introduction" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-primary">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  1. Introduction & Operational Scope
                </h2>
              </div>
              <p className="mb-4">
                <strong>Super Pak Data Goods Transport Co.</strong> (hereinafter referred to as &ldquo;SPD Logistics&rdquo;, &ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) has been a trusted goods transport and freight logistics provider in Pakistan since 1996. Our operations include nationwide road freight forwarding, consignment (bilty) issuance, warehouse storage, real-time shipment tracking, customer and driver portal services, and automated cargo dispatch coordination.
              </p>
              <p>
                This Privacy Policy describes our practices regarding the collection, storage, use, and disclosure of information gathered when you visit our website, utilize our tracking platform, generate or receive commercial bilties, communicate with our customer support teams, or log into our digital portals.
              </p>
            </section>

            {/* Section 2: Information We Collect */}
            <section id="information-collected" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-secondary">
                  <Database className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  2. Information We Collect
                </h2>
              </div>
              <p className="mb-4">
                SPD Logistics collects only the minimum necessary information required to facilitate legitimate road transportation, cargo delivery, billing reconciliation, and regulatory compliance under Pakistani commercial transport laws.
              </p>
              
              <div className="space-y-4 my-6">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    A. Consignment & Bilty Details
                  </h3>
                  <p className="text-sm">
                    When cargo is booked, we record shipper (sender) and consignee (receiver) full names, business names, mobile telephone numbers, physical delivery addresses, origin city, destination city, CNIC numbers (where required for cargo manifest verification), package descriptions, item count, weight, and declared goods categories.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    B. Contact & Inquiry Submissions
                  </h3>
                  <p className="text-sm">
                    When you contact us via the public website contact form, we collect your name, email address, phone number, subject, and the inquiry message. These submissions are forwarded to our authorized administrative desk (<code className="text-xs bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">superpakdatawale@gmail.com</code>) to respond to your request.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    C. Portal Account & Authentication Credentials
                  </h3>
                  <p className="text-sm">
                    For authorized staff, drivers, and corporate customers, we maintain login identifiers, email addresses, and cryptographic password hashes. Passwords are never stored in plain text and are secured using one-way bcrypt hashing algorithms.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    D. Financial & Transaction Ledgers
                  </h3>
                  <p className="text-sm">
                    We maintain operational freight charges, payment status records (Paid, To-Pay, or Credit terms), bank transfer reference numbers, and cash book ledgers. <strong>We do not process or store credit or debit card numbers on our servers.</strong>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    E. Technical & Audit Logs
                  </h3>
                  <p className="text-sm">
                    Our servers record standard technical telemetry including IP addresses, browser user-agents, request timestamps, and internal system audit logs (such as bilty creation, payment logging, and status transitions) to prevent fraud and ensure operational traceability.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: How We Use Information */}
            <section id="how-we-use" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                  <Truck className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  3. How We Use Your Information
                </h2>
              </div>
              <p className="mb-4">Information gathered by SPD Logistics is utilized solely for lawful commercial logistics operations:</p>
              <ul className="space-y-3 pl-2">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span><strong>Freight Execution & Delivery:</strong> Generating authentic printed bilties, routing consignments to designated transit hubs, and ensuring delivery to authorized receivers.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span><strong>Shipment Visibility:</strong> Powering the online tracking system so senders and receivers can monitor transit milestones (Booked, In Transit, At Warehouse, Out for Delivery, Delivered) using unique Tracking IDs or Bilty Numbers.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span><strong>Accounting & Billing:</strong> Maintaining accurate accounts receivable, accounts payable, cash book entries, and freight payment reconciliation.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span><strong>System Auditing & Security:</strong> Logging administrative operations to preserve an immutable audit trail of consignment edits, cancellations, and status updates.</span>
                </li>
              </ul>
            </section>

            {/* Section 4: Communication & WhatsApp */}
            <section id="communications" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-secondary">
                  <Phone className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  4. Communication, Email & WhatsApp Channels
                </h2>
              </div>
              <p className="mb-4">
                To keep supply chain stakeholders updated in real time, SPD Logistics utilizes official communication channels:
              </p>
              <div className="grid md:grid-cols-2 gap-4 my-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Official Email Inquiries
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                    Website contact inquiries and corporate quotations are dispatched via secure SMTP to <code className="text-xs text-primary font-semibold">superpakdatawale@gmail.com</code>. We do not sell your email address to third-party marketers.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-2">
                    <Phone className="w-4 h-4 text-green-500" />
                    Direct WhatsApp Coordination
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                    For expedited booking and vehicle dispatch, direct WhatsApp click-to-chat links route customers directly to executive management under <strong>Hammad Faisal Bhatti</strong> at <span className="font-semibold text-slate-900 dark:text-white">0325 2024433</span>.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 italic mt-2">
                Note: WhatsApp communications are subject to Meta&rsquo;s end-to-end encryption and terms of service. Please do not transmit sensitive personal financial details over messaging platforms.
              </p>
            </section>

            {/* Section 5: Data Storage & Security */}
            <section id="security" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-primary">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  5. Data Storage, Architecture & Security
                </h2>
              </div>
              <p className="mb-4">
                We implement robust physical, electronic, and managerial safeguards to protect your personal and commercial data:
              </p>
              <ul className="space-y-3 pl-2">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span><strong>Cryptographic Password Protection:</strong> All system passwords are salted and hashed using bcrypt. No Company employee or administrator can view your raw plaintext password.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span><strong>Secure Cookie Authentication:</strong> Login sessions use signed JSON Web Tokens (JWT) stored in secure <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">HttpOnly</code>, <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">SameSite</code> cookies (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">spd_token</code>) to mitigate cross-site scripting (XSS) and session hijacking risks.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span><strong>Role-Based Access Control (RBAC):</strong> Operational access is segmented strictly across five distinct roles: Super Admin, Admin, Staff, Driver, and Customer. Users access only the modules and records authorized for their role.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span><strong>Database Integrity:</strong> Relational data is managed via Prisma ORM with parameterised queries, preventing SQL injection vulnerabilities.</span>
                </li>
              </ul>
            </section>

            {/* Section 6: Data Retention */}
            <section id="retention" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  6. Data Retention Policies
                </h2>
              </div>
              <p className="mb-4">
                Consignment records, delivery receipts, and bilty logs are retained for statutory record-keeping periods mandated by commercial transportation, taxation, and freight carriage laws in Pakistan (typically a minimum of five years from the completion of the consignment).
              </p>
              <p>
                Customer portal account records remain active until an account is formally decommissioned. Contact form inquiries are archived for operational customer service tracking and periodic quality audits.
              </p>
            </section>

            {/* Section 7: Third-Party Services */}
            <section id="third-parties" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  7. Third-Party Service Providers
                </h2>
              </div>
              <p className="mb-4">
                SPD Logistics does not sell, rent, or trade your personal or cargo information to commercial brokers or advertisers. We partner with reputable technical service providers under strict data privacy boundaries:
              </p>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm">
                  <strong>Cloud & Infrastructure:</strong> Hosting providers supporting server execution and encrypted database backups.
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm">
                  <strong>Transactional Email (Nodemailer / SMTP):</strong> Used solely to forward website contact messages to Company inboxes.
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm">
                  <strong>AI Natural Language Processing (Groq API):</strong> Powers our customer assistance interface under strict non-retention parameters (see Section 8).
                </div>
              </div>
            </section>

            {/* Section 8: AI Customer Assistant */}
            <section id="ai-assistant" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Bot className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  8. AI Customer Assistant & Automated Processing
                </h2>
              </div>
              <p className="mb-4">
                Our public website features an interactive AI Customer Support Assistant powered by <strong>Groq Cloud API (Llama-3 architecture)</strong>:
              </p>
              <ul className="space-y-2.5 text-sm pl-2 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">&bull;</span>
                  <span><strong>Scope of Processing:</strong> Only the immediate question typed by the user into the chat window is sent to the AI service to generate a conversational response regarding SPD Logistics services, cities served, or tracking instructions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">&bull;</span>
                  <span><strong>No Access to Private Ledgers:</strong> The AI Assistant has zero direct access to internal database tables, customer bank records, staff credentials, or confidential cash books.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">&bull;</span>
                  <span><strong>Informational Advice Only:</strong> AI outputs are provided for guidance and do not constitute formal transportation commitments or binding freight rate quotes. Official rates are confirmed only via printed bilties issued at our booking centers.</span>
                </li>
              </ul>
            </section>

            {/* Section 9: Cookies & Tracking Technologies */}
            <section id="cookies" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-secondary">
                  <Cookie className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  9. Cookies & Local Storage Usage
                </h2>
              </div>
              <p className="mb-4">
                We believe in zero bloat and zero intrusive tracking. Our website utilizes only essential technical cookies and local browser storage:
              </p>
              <div className="overflow-x-auto my-4">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                      <th className="p-3 font-semibold text-slate-900 dark:text-white">Identifier</th>
                      <th className="p-3 font-semibold text-slate-900 dark:text-white">Type</th>
                      <th className="p-3 font-semibold text-slate-900 dark:text-white">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="p-3 font-mono text-xs text-primary">spd_token</td>
                      <td className="p-3 text-xs">HTTP-only Cookie</td>
                      <td className="p-3 text-xs">Encrypted JWT session token for authenticated user sessions. Expires upon logout.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-xs text-primary">theme</td>
                      <td className="p-3 text-xs">Local Storage</td>
                      <td className="p-3 text-xs">Remembers your preference between Dark Mode and Light Mode.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-xs text-primary">sidebar_state</td>
                      <td className="p-3 text-xs">Local Storage</td>
                      <td className="p-3 text-xs">Maintains admin navigation sidebar collapsed/expanded state.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">
                We do not deploy cross-site advertising pixels or sell tracking cookies to third-party ad networks.
              </p>
            </section>

            {/* Section 10: Your Rights & Access */}
            <section id="user-rights" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  10. Your Rights & Data Access
                </h2>
              </div>
              <p className="mb-4">
                As a customer or commercial partner of SPD Logistics, you have the right to:
              </p>
              <ul className="space-y-2 pl-2 text-sm">
                <li>&bull; Request confirmation and review of personal contact information held on file.</li>
                <li>&bull; Request correction or updating of outdated consignor or consignee contact phone numbers.</li>
                <li>&bull; Request termination and deactivation of portal login accounts.</li>
              </ul>
              <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs md:text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>
                  <strong>Legal Exception:</strong> Once a commercial Bilty is issued and cargo is in transit, historical consignment records and bill of lading documents cannot be expunged or altered retroactively, as they constitute mandatory commercial records under Pakistani transport regulations and carrier liability laws.
                </span>
              </div>
            </section>

            {/* Section 11: Minors' Privacy */}
            <section id="children" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  11. Minors&rsquo; Privacy
                </h2>
              </div>
              <p>
                Our commercial freight forwarding and logistics platform is intended exclusively for businesses, shippers, consignees, and adult individuals capable of entering legally binding commercial contracts (age 18 and older). We do not knowingly collect or solicit personal information from minors.
              </p>
            </section>

            {/* Section 12: Policy Changes */}
            <section id="policy-changes" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-secondary">
                  <FileText className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  12. Changes to This Privacy Policy
                </h2>
              </div>
              <p>
                We may periodically update this Privacy Policy to reflect operational enhancements, new software features, or regulatory updates. Any changes will be published directly on this page with an updated &ldquo;Effective Date&rdquo;. Continued use of our website or logistics services following publication signifies acceptance of the revised policy.
              </p>
            </section>

            {/* Section 13: Contact Information */}
            <section id="contact" className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">
                    13. Executive In-Charge & Contact Information
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400">
                    Direct oversight for privacy inquiries and data requests
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                <div className="space-y-3 text-sm">
                  <div className="text-xs uppercase tracking-wider text-red-400 font-bold">
                    Executive Leadership
                  </div>
                  <div className="font-bold text-base text-white">
                    Hammad Faisal Bhatti
                  </div>
                  <div className="text-slate-300 text-xs">
                    Managing Director / Owner
                  </div>
                  <div className="text-slate-400 text-xs">
                    Super Pak Data Goods Transport Co. (Est. 1996)
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="text-xs uppercase tracking-wider text-blue-400 font-bold">
                    Official Communication
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-red-400 shrink-0" />
                    <a 
                      href="mailto:superpakdatawale@gmail.com"
                      className="text-slate-200 hover:text-white hover:underline break-all text-xs md:text-sm font-mono"
                    >
                      superpakdatawale@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-400 shrink-0" />
                    <a 
                      href="https://wa.me/923252024433" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-200 hover:text-white hover:underline text-xs md:text-sm font-mono"
                    >
                      +92 325 2024433 / 0325 2024433
                    </a>
                  </div>
                  <div className="text-slate-400 text-xs pt-1">
                    Head Office: Goods Transport Hub, Lahore, Punjab, Pakistan
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap justify-between items-center gap-4 text-xs text-slate-400">
                <span>&copy; 2026 Super Pak Data Goods Transport Co. All Rights Reserved.</span>
                <Link 
                  href="/terms"
                  className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                >
                  Read Terms & Conditions &rarr;
                </Link>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
