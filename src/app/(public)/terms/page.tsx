import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  FileCheck2, 
  Truck, 
  AlertTriangle, 
  Scale, 
  ShieldAlert, 
  CreditCard, 
  Clock, 
  PackageX, 
  FileText, 
  Bot, 
  Building2, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle2,
  Info
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Terms & Conditions of Carriage | ${APP_NAME} - Super Pak Data Goods Transport Co.`,
  description: 'Official Terms & Conditions and Conditions of Carriage for Super Pak Data Goods Transport Co. (SPD Logistics). Comprehensive guidelines on bilty issuance, freight rates, claims, and transit terms.',
};

export default function TermsAndConditionsPage() {
  const effectiveDate = "September 17, 2026";

  const termsSections = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "services", title: "2. Services & Operations" },
    { id: "bilty-booking", title: "3. Booking & Bilty Terms" },
    { id: "customer-responsibilities", title: "4. Shipper Responsibilities" },
    { id: "freight-payments", title: "5. Freight Charges & Carrier's Lien" },
    { id: "tracking-delivery", title: "6. Tracking & Delivery Timelines" },
    { id: "prohibited-goods", title: "7. Prohibited & Hazardous Goods" },
    { id: "claims-procedure", title: "8. Loss, Damage & Claims" },
    { id: "force-majeure", title: "9. Force Majeure & Liability" },
    { id: "portal-accounts", title: "10. Portal & System Security" },
    { id: "ai-disclaimer", title: "11. AI Assistant Disclaimer" },
    { id: "intellectual-property", title: "12. Intellectual Property" },
    { id: "governing-law", title: "13. Governing Law (Pakistan)" },
    { id: "modifications", title: "14. Amendments" },
    { id: "contact-management", title: "15. Executive Management" },
  ];

  return (
    <div className="flex flex-col min-h-screen py-10 md:py-16">
      <div className="container max-w-6xl px-4 md:px-6 mx-auto">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-red-950 text-white rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-800 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold text-xs tracking-wide uppercase mb-4 border border-blue-500/30">
              <Scale className="w-4 h-4 text-blue-400" />
              Contract of Carriage & Terms of Service
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Terms & <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-blue-400">Conditions</span>
            </h1>
            
            <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6">
              Standard trading conditions, conditions of carriage, and digital portal terms governing all road freight services, consignment notes (bilties), and cargo shipments with <strong>Super Pak Data Goods Transport Co. ({APP_NAME})</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-red-400" />
                Effective Date: <strong>{effectiveDate}</strong>
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-400" />
                Carrier: <strong>Super Pak Data Goods Transport Co.</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Table of Contents Sidebar */}
          <aside className="lg:col-span-4 order-2 lg:order-1">
            <div className="sticky top-24 bg-white dark:bg-slate-900/90 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Table of Contents
              </h2>
              <nav className="space-y-1 text-sm max-h-[70vh] overflow-y-auto pr-1">
                {termsSections.map((sec) => (
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
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Looking for our data handling rules? Read our <Link href="/privacy-policy" className="text-primary hover:underline font-medium">Privacy Policy</Link>.</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Terms Content */}
          <main className="lg:col-span-8 order-1 lg:order-2 space-y-10 text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">
            
            {/* 1. Acceptance */}
            <section id="acceptance" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-primary">
                  <Scale className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  1. Acceptance of Terms
                </h2>
              </div>
              <p className="mb-3">
                These Terms & Conditions constitute a legally binding agreement between the shipper/consignor, consignee, or user of our digital services (&ldquo;Customer&rdquo;, &ldquo;you&rdquo;) and <strong>Super Pak Data Goods Transport Co.</strong> (&ldquo;SPD Logistics&rdquo;, &ldquo;Carrier&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;).
              </p>
              <p>
                By tendering goods for transport, booking a consignment, receiving or signing a Bilty (consignment note), or accessing our tracking platform or portal, you irrevocably accept and agree to be bound by these Terms. If you do not agree to these Terms, you must refrain from booking shipments with SPD Logistics.
              </p>
            </section>

            {/* 2. Services */}
            <section id="services" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-secondary">
                  <Truck className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  2. Scope of Logistics Services
                </h2>
              </div>
              <p className="mb-3">
                SPD Logistics provides commercial road freight carriage across designated routes and metropolitan hubs in Pakistan. Services include:
              </p>
              <ul className="grid sm:grid-cols-2 gap-3 my-4 text-sm">
                <li className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                  <strong>Full Truckload (FTL) Freight:</strong> Dedicated vehicles for industrial and bulk cargo.
                </li>
                <li className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                  <strong>Less Than Truckload (LTL):</strong> Groupage and partial load consignment forwarding.
                </li>
                <li className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                  <strong>Warehouse & Hub Dispatch:</strong> Secure cargo consolidation and hub transit.
                </li>
                <li className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                  <strong>Digital Consignments & Tracking:</strong> Unique bilty generation and real-time status telemetry.
                </li>
              </ul>
              <p className="text-xs text-slate-500">
                The Carrier reserves the right to employ verified subcontractors or authorized vehicle fleets to execute transportation without prior notice to the Shipper.
              </p>
            </section>

            {/* 3. Bilty & Booking */}
            <section id="bilty-booking" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  3. Booking & Consignment Note (Bilty) Terms
                </h2>
              </div>
              <p className="mb-4">
                The issuance of a printed or digital <strong>Bilty (Goods Receipt / Consignment Note)</strong> by an authorized SPD Logistics booking representative constitutes <em>prima facie</em> evidence of the receipt of goods as described by the Shipper:
              </p>
              <ul className="space-y-3 pl-2 text-sm">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span><strong>Accuracy of Declarations:</strong> The Shipper warrants that all details supplied—including sender/receiver legal names, active contact numbers, destination address, piece counts, weight, and nature of contents—are strictly accurate and complete.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span><strong>Condition of Cargo:</strong> Receipt of goods is acknowledged in apparent good exterior order and condition, unless specific exceptions or package defects are noted on the face of the Bilty at the time of intake.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span><strong>Right of Physical Inspection:</strong> SPD Logistics reserves the right, under applicable transport laws, to open and inspect any consignment without prior consent if there is reasonable suspicion of misdeclared contents, dangerous substances, or illegal cargo.</span>
                </li>
              </ul>
            </section>

            {/* 4. Shipper Responsibilities */}
            <section id="customer-responsibilities" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  4. Shipper & Customer Responsibilities
                </h2>
              </div>
              <p className="mb-4">
                Shippers are exclusively responsible for preparing and packaging cargo adequately for long-distance highway transport across varying terrain in Pakistan:
              </p>
              <div className="space-y-3 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <strong>Industrial Packaging:</strong> Cargo must be packaged, strapped, crated, or boxed to withstand the ordinary risks of road transportation, vehicle vibration, and manual/mechanical handling.
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <strong>Legible Labeling:</strong> Packages must display clear markings matching the Consignment Bilty number and destination station.
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <strong>Statutory Tax Compliance:</strong> Shippers are responsible for providing all required sales tax invoices, delivery challans, and commercial documentation required by excise and taxation authorities.
                </div>
              </div>
            </section>

            {/* 5. Freight Payments & Lien */}
            <section id="freight-payments" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-primary">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  5. Freight Charges, Billing Terms & Carrier&rsquo;s Lien
                </h2>
              </div>
              <p className="mb-4">
                Freight rates are calculated based on gross weight, volumetric dimensions, destination distance, and handling requirements:
              </p>
              <div className="grid md:grid-cols-3 gap-3 my-4 text-xs md:text-sm">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">Paid (Advance)</div>
                  Freight is paid in full by the Consignor at the booking terminal prior to dispatch.
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">To-Pay (Destination)</div>
                  Freight is payable by the Consignee prior to physical discharge and handover of goods.
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">Credit (Corporate Ledger)</div>
                  Reserved for verified commercial clients billed on periodic invoice terms.
                </div>
              </div>
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs md:text-sm text-red-900 dark:text-red-300">
                <strong>General Carrier&rsquo;s Lien:</strong> SPD Logistics retains a statutory general lien over all consigned goods in its possession for unpaid freight, demurrage, warehousing, and handling charges. If payment is refused or overdue beyond 30 days, the Carrier reserves the right to auction or dispose of goods to recover outstanding debts in accordance with Pakistani commercial law.
              </div>
            </section>

            {/* 6. Tracking & Delivery */}
            <section id="tracking-delivery" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-secondary">
                  <Clock className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  6. Shipment Tracking & Delivery Disclaimers
                </h2>
              </div>
              <p className="mb-3">
                Our digital tracking system reports transit milestones in real time as consignments are processed through transit stations.
              </p>
              <ul className="space-y-2 text-sm pl-2 mb-3">
                <li>&bull; <strong>Estimated Transit Times:</strong> Delivery timeframes quoted by dispatch or displayed on tracking portals are operational estimates, not guaranteed delivery deadlines.</li>
                <li>&bull; <strong>Highway & Checkpoint Delays:</strong> Highway conditions, motorway closures, severe weather, regional checkpoints, and official customs/tax verifications may affect delivery schedules without fault to the Carrier.</li>
                <li>&bull; <strong>Consignee Presentation:</strong> Consignees must present valid identification and original Bilty copy (or authorized SMS verification) to claim freight at destination terminals.</li>
              </ul>
            </section>

            {/* 7. Prohibited Goods */}
            <section id="prohibited-goods" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-primary">
                  <PackageX className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  7. Prohibited & Restricted Cargo
                </h2>
              </div>
              <p className="mb-4">
                SPD Logistics strictly prohibits the tender, transport, or storage of the following items:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs md:text-sm">
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                  &bull; Explosives, munitions, fireworks & detonators
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                  &bull; Unlicensed firearms, weapons & tactical gear
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                  &bull; Narcotics, illegal drugs & contraband substances
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                  &bull; Corrosive, radioactive & toxic chemical agents
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                  &bull; Stolen property, contraband currency & bullion
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                  &bull; Any cargo prohibited under Federal or Provincial laws of Pakistan
                </div>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-4 font-semibold">
                Tendering prohibited goods is an illegal offense. Shippers will be held fully liable for all fines, damages, vehicle seizures, and criminal prosecutions resulting from non-compliance.
              </p>
            </section>

            {/* 8. Loss & Claims */}
            <section id="claims-procedure" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  8. Loss, Damage & Formal Claims Procedure
                </h2>
              </div>
              <p className="mb-4">
                In the event of cargo loss, transit shortage, or visible exterior damage:
              </p>
              <ol className="space-y-3 pl-2 text-sm list-decimal list-inside">
                <li>
                  <strong>Delivery Copy Endorsement:</strong> Any visible exterior packaging damage or package shortage must be explicitly endorsed in writing on the delivery copy of the Bilty in the presence of the delivery agent at the time of delivery.
                </li>
                <li>
                  <strong>7-Day Written Claim Notice:</strong> A formal written claim notice, accompanied by original Bilty copy, commercial purchase invoice, and photo evidence, must be submitted to executive management within <strong>seven (7) calendar days</strong> of cargo arrival.
                </li>
                <li>
                  <strong>No Clean Receipt Claims:</strong> Claims submitted after unconditional signature on delivery documents (&ldquo;clean receipt&rdquo;) cannot be entertained under carrier liability laws.
                </li>
              </ol>
            </section>

            {/* 9. Force Majeure */}
            <section id="force-majeure" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Scale className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  9. Force Majeure & Limitation of Carrier Liability
                </h2>
              </div>
              <p className="mb-3">
                SPD Logistics shall not be liable for any transit delay, loss, non-delivery, or cargo damage caused directly or indirectly by events beyond its reasonable operational control (<strong>Force Majeure</strong>):
              </p>
              <p className="text-sm mb-3">
                Force Majeure includes, but is not limited to: Acts of God, torrential monsoons, river floods, landslides, earthquakes, highway blockades, civil unrest, strikes, riots, terrorism, highway collisions caused by third parties, fire not caused by Carrier negligence, or official state regulatory seizures.
              </p>
              <p className="text-sm">
                Under no circumstances shall the Carrier be liable for indirect, incidental, or consequential damages, including loss of business profit, market delays, or loss of commercial contracts.
              </p>
            </section>

            {/* 10. Portal & System Security */}
            <section id="portal-accounts" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-secondary">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  10. Digital Portal & Account Security
                </h2>
              </div>
              <p className="mb-3">
                Authorized users of our Admin, Staff, Customer, and Driver portals must maintain strict confidentiality of their assigned credentials:
              </p>
              <ul className="space-y-2 text-sm pl-2">
                <li>&bull; You are responsible for all actions executed under your authenticated session.</li>
                <li>&bull; Sharing credentials or attempting unauthorized escalation of administrative privileges is strictly prohibited and subject to immediate account revocation and legal recourse.</li>
                <li>&bull; We reserve the right to suspend or terminate accounts that breach security protocols.</li>
              </ul>
            </section>

            {/* 11. AI Assistant Disclaimer */}
            <section id="ai-disclaimer" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Bot className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  11. AI Customer Support Assistant Disclaimer
                </h2>
              </div>
              <p className="mb-3">
                The interactive AI Assistant accessible on this website is an automated customer assistance tool powered by third-party natural language models (Groq Cloud API):
              </p>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs md:text-sm space-y-2">
                <p>
                  &bull; <strong>Non-Binding Information:</strong> Responses generated by the AI assistant regarding freight tariffs, delivery dates, or service availability are purely informative and do not form binding carriage commitments.
                </p>
                <p>
                  &bull; <strong>Official Confirmation:</strong> Legally binding freight rates and consignment conditions are established solely through official printed bilties signed by authorized SPD Logistics booking staff.
                </p>
              </div>
            </section>

            {/* 12. Intellectual Property */}
            <section id="intellectual-property" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-primary">
                  <Scale className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  12. Intellectual Property
                </h2>
              </div>
              <p>
                The names <strong>SPD Logistics</strong>, <strong>Super Pak Data Goods Transport Co.</strong>, associated logos, portal software, database architectures, bilty templates, graphic banners, and website code are the exclusive intellectual property of Super Pak Data Goods Transport Co. Unauthorized reproduction, scraping, reverse-engineering, or commercial imitation is strictly prohibited under Pakistani intellectual property statutes.
              </p>
            </section>

            {/* 13. Governing Law */}
            <section id="governing-law" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-secondary">
                  <Scale className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  13. Governing Law & Exclusive Jurisdiction
                </h2>
              </div>
              <p className="mb-3">
                These Terms & Conditions, all contracts of carriage, and any disputes arising from cargo transportation or website use shall be governed by, construed, and enforced in accordance with the <strong>laws of the Islamic Republic of Pakistan</strong> (including the Carriers Act and commercial code).
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Any legal action, suit, or proceeding arising hereunder shall be subject to the exclusive jurisdiction of the competent courts of Lahore, Punjab, Pakistan.
              </p>
            </section>

            {/* 14. Amendments */}
            <section id="modifications" className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  14. Amendments to Terms
                </h2>
              </div>
              <p>
                SPD Logistics reserves the unilateral right to amend, update, or replace these Terms & Conditions at any time. Revised versions will become effective immediately upon being posted on this website with an updated Effective Date. Shippers are encouraged to review these Terms periodically.
              </p>
            </section>

            {/* 15. Contact / Executive Leadership */}
            <section id="contact-management" className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">
                    15. Executive Management & Contact
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400">
                    For carriage contracts, rate inquiries, and formal notices
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                <div className="space-y-3 text-sm">
                  <div className="text-xs uppercase tracking-wider text-red-400 font-bold">
                    Carriage Authority & Leadership
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
                    Official Inquiries & Claims
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
                  href="/privacy-policy"
                  className="text-red-400 hover:text-red-300 font-medium inline-flex items-center gap-1"
                >
                  &larr; View Privacy Policy
                </Link>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
