/**
 * SPD Logistics — Official Commercial Services Data
 * Super Pak Data Goods Transport Co. (Est. 1996)
 */

export interface ServiceFleetOption {
  type: string;
  payload: string;
  volume: string;
  bestFor: string;
}

export interface ServiceRouteMatrixItem {
  corridor: string;
  transitTime: string;
  frequency: string;
  departureTerminals: string;
}

export interface ServiceItem {
  slug: string;
  title: string;
  subtitle: string;
  shortDesc: string;
  badge: string;
  colorTheme: "red" | "blue";
  iconName: "Package" | "Truck" | "FileText" | "MapPin" | "Warehouse" | "Building2";
  fleetOptions: ServiceFleetOption[];
  features: string[];
  routeMatrix: ServiceRouteMatrixItem[];
  whatsappMessage: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
}

export const SPD_SERVICES: Record<string, ServiceItem> = {
  "full-truck-load": {
    slug: "full-truck-load",
    title: "Full Truck Load (FTL)",
    subtitle: "Dedicated Fleet Allocation & Direct Industrial Transit",
    badge: "Dedicated Fleet",
    colorTheme: "red",
    iconName: "Package",
    shortDesc:
      "Dedicated vehicle allocation for direct factory-to-warehouse bulk shipments, offering exclusive payload security and non-stop point-to-point routing.",
    fleetOptions: [
      {
        type: "22-Wheeler Long Trailer",
        payload: "55 to 65 Metric Tons",
        volume: "85 to 110 CBM",
        bestFor: "Bulk raw materials, industrial steel coils, import containers, and heavy machinery.",
      },
      {
        type: "10-Wheeler Heavy Truck",
        payload: "25 to 30 Metric Tons",
        volume: "45 to 60 CBM",
        bestFor: "FMCG cartons, textile bales, chemicals, plastic resins, and commercial consignments.",
      },
      {
        type: "Mazda T3500 / Shehzore Express",
        payload: "5 to 8 Metric Tons",
        volume: "20 to 30 CBM",
        bestFor: "Urgent factory replenishment, localized distribution, and mid-capacity city transit.",
      },
    ],
    features: [
      "Exclusive vehicle reservation with GPS-monitored corridor routing.",
      "Direct factory floor loading to consignee warehouse unloading with zero intermediate transshipment.",
      "Comprehensive digital bilty generation with 4-sheet legal documentation.",
      "Strict cargo seal verification, axle weight compliance, and weighbridge certifications.",
      "Priority linehaul departure with 24/7 operations room tracking.",
    ],
    routeMatrix: [
      {
        corridor: "Karachi ↔ Lahore",
        transitTime: "24 – 30 Hours",
        frequency: "Continuous Daily Departures",
        departureTerminals: "Hawksbay & Mauripur (KHI) → Badami Bagh & Saggian (LHR)",
      },
      {
        corridor: "Karachi ↔ Rawalpindi / Islamabad",
        transitTime: "36 – 42 Hours",
        frequency: "Daily Scheduled Convoys",
        departureTerminals: "Hawksbay (KHI) → I-11/4 Wholesale Market (RWP)",
      },
      {
        corridor: "Karachi ↔ Faisalabad / Multan",
        transitTime: "22 – 28 Hours",
        frequency: "Daily Industrial Service",
        departureTerminals: "Karachi Port Hub → Nishatabad (FSD) / Chowk Kumharan (MUX)",
      },
      {
        corridor: "Lahore ↔ Peshawar / KPK Hubs",
        transitTime: "12 – 16 Hours",
        frequency: "Daily Night Departures",
        departureTerminals: "Saggian Hub (LHR) → Ring Road Terminal (PEW)",
      },
    ],
    whatsappMessage:
      "Assalam-o-Alaikum, I want to book a Full Truck Load (FTL) with SPD Logistics. Please provide fleet availability and freight quotation.",
    primaryActionLabel: "Book FTL Truck",
    primaryActionHref: "/contact?service=ftl",
    secondaryActionLabel: "Instant Bilty Booking",
    secondaryActionHref: "/admin/bilty/new",
  },

  "goods-transportation": {
    slug: "goods-transportation",
    title: "Goods Transportation",
    subtitle: "Nationwide Inter-City Scheduled Freight Network",
    badge: "Nationwide Network",
    colorTheme: "blue",
    iconName: "Truck",
    shortDesc:
      "Reliable and timely inter-city transportation for industrial, commercial, and wholesale goods connecting all major economic zones nationwide.",
    fleetOptions: [
      {
        type: "Scheduled Linehaul Convoys",
        payload: "Multi-party consolidated loads",
        volume: "Part-load & Full-load capacity",
        bestFor: "Daily commercial merchandise, wholesale consignments, and general merchandise.",
      },
      {
        type: "Containerized Fleet",
        payload: "Weatherproof 40ft & 20ft Boxes",
        volume: "Sealed cargo protection",
        bestFor: "High-value pharmaceuticals, electronics, carton goods, and moisture-sensitive cargo.",
      },
    ],
    features: [
      "Guaranteed daily evening departures connecting North and South trade corridors.",
      "Standardized pallet handling, weight scale verification, and parcel tagging.",
      "Formal transport contract, carrier risk mitigation, and verified driver crew assignments.",
      "Door-to-door pickup and delivery network covering 40+ commercial cities.",
      "Consignment progress visibility from booking through arrival at terminal.",
    ],
    routeMatrix: [
      {
        corridor: "Karachi ↔ Gujranwala / Sialkot",
        transitTime: "30 – 36 Hours",
        frequency: "Daily Industrial Runs",
        departureTerminals: "Karachi Hubs → G.T. Road Gujranwala & Daska Road Sialkot",
      },
      {
        corridor: "Lahore ↔ Multan / Bahawalpur",
        transitTime: "8 – 12 Hours",
        frequency: "Twice Daily",
        departureTerminals: "Saggian Bypass (LHR) → Khanewal Road (MUX)",
      },
      {
        corridor: "Karachi ↔ Quetta & Balochistan",
        transitTime: "24 – 32 Hours",
        frequency: "Tri-Weekly Linehaul",
        departureTerminals: "Hawksbay (KHI) → Sariab Road (QTA)",
      },
    ],
    whatsappMessage:
      "Assalam-o-Alaikum, I need goods transportation for commercial merchandise with SPD Logistics. Please share tariffs and transit schedule.",
    primaryActionLabel: "Inquire Freight Tariffs",
    primaryActionHref: "/contact?service=goods-transport",
    secondaryActionLabel: "View Terminals",
    secondaryActionHref: "/#map-section",
  },

  "bilty-booking": {
    slug: "bilty-booking",
    title: "Bilty Booking & Consignment Note",
    subtitle: "Instant 4-Sheet Digital Documentation & Legal Proof of Transport",
    badge: "Instant Issuance",
    colorTheme: "red",
    iconName: "FileText",
    shortDesc:
      "Quick and accurate consignment booking with computerized bilty generation, formal freight receipts, and verified dispatch paperwork.",
    fleetOptions: [
      {
        type: "4-Sheet Multi-Tab Dossier",
        payload: "Digital & A4 Physical Print",
        volume: "100% Tax Compliant",
        bestFor: "Shipper Copy, Consignee Copy, Driver Copy, and Accounts/FBR Ledger Copy.",
      },
      {
        type: "QR Code Dynamic Tracking",
        payload: "Direct Vector SVG",
        volume: "Mobile Camera Instant Scan",
        bestFor: "Instant status lookup at terminal gates, weighbridges, and consignee godowns.",
      },
    ],
    features: [
      "Complete 4-sheet dossier architecture (Booking Sheet, Bilty Consignment Note, Freight Bill, Sales Tax Invoice).",
      "Automatic Sales Tax (15% GST) and WHT calculation according to commercial regulations.",
      "Unique sequential Bilty Numbering (`SPD-LHR-YYYY-XXXX` and `SPD-KHI-YYYY-XXXX`).",
      "Single-click 4-Sheet multi-tab Excel export (`.xlsx`) and high-density A4 portrait printing.",
      "Confidentiality toggle: Option to hide freight amounts on driver copies for contract security.",
    ],
    routeMatrix: [
      {
        corridor: "Central Booking — Lahore",
        transitTime: "Instant Issue (0ms)",
        frequency: "24/7 Operations Counter",
        departureTerminals: "Badami Bagh Goods / Saggian Bypass Station",
      },
      {
        corridor: "Central Booking — Karachi",
        transitTime: "Instant Issue (0ms)",
        frequency: "24/7 Operations Counter",
        departureTerminals: "Hawksbay Transport Nagar / Mauripur Station",
      },
    ],
    whatsappMessage:
      "Assalam-o-Alaikum, I want to book a consignment and generate an SPD Bilty. Please assist me with the booking process.",
    primaryActionLabel: "Book Bilty Online",
    primaryActionHref: "/admin/bilty/new",
    secondaryActionLabel: "Track Existing Bilty",
    secondaryActionHref: "/tracking",
  },

  "shipment-tracking": {
    slug: "shipment-tracking",
    title: "Shipment Tracking & Transit Milestones",
    subtitle: "Live Consignment Visibility via Bilty Number or QR Scanner",
    badge: "Real-Time Status",
    colorTheme: "blue",
    iconName: "MapPin",
    shortDesc:
      "Live status updates and transparent milestone tracking by entering your official Bilty Number or Tracking ID on our portal.",
    fleetOptions: [
      {
        type: "Automated QR Camera Scanner",
        payload: "Zero-Click Lookup",
        volume: "Real-Time Cloud Synced",
        bestFor: "Instant verification on mobile devices without typing tracking codes.",
      },
      {
        type: "Milestone Event Timeline",
        payload: "Status History",
        volume: "Audit Logging",
        bestFor: "Booked → Dispatch Challan → In-Transit Linehaul → Terminal Arrival → Proof of Delivery.",
      },
    ],
    features: [
      "Dynamic URL tracking: `spd-logistics-live.netlify.app/tracking?id=SPD-XXX`.",
      "Instant query resolution with zero page reload latency.",
      "Detailed particulars display: Sender, Receiver, Commodity, Weights, Route, and Vehicle Number.",
      "One-click WhatsApp tracking card sharing to consignees and accounts departments.",
      "Proof of Delivery (POD) image verification for delivered consignments.",
    ],
    routeMatrix: [
      {
        corridor: "Live GPS Tracking Hub",
        transitTime: "Sub-second Query",
        frequency: "Real-Time 24/7/365",
        departureTerminals: "All Pakistani Transshipment Depots & Linehaul Corridors",
      },
    ],
    whatsappMessage:
      "Assalam-o-Alaikum, I need tracking assistance for my consignment with SPD Logistics.",
    primaryActionLabel: "Open Tracking Portal",
    primaryActionHref: "/tracking",
    secondaryActionLabel: "WhatsApp Tracking Bot",
    secondaryActionHref: "https://wa.me/923252024433?text=Track%20my%20SPD%20Bilty",
  },

  "warehouse-services": {
    slug: "warehouse-services",
    title: "Warehouse & Holding Facilities",
    subtitle: "Dual Commercial Terminal Warehousing in Karachi & Lahore",
    badge: "Secure Storage",
    colorTheme: "red",
    iconName: "Warehouse",
    shortDesc:
      "Secure storage, sorting, cross-docking, and cargo holding at our dual commercial facilities in Karachi (Hawksbay) and Central Lahore.",
    fleetOptions: [
      {
        type: "Karachi Maritime Hub",
        payload: "Hawksbay Transport Nagar",
        volume: "35,000+ sq. ft Covered Facility",
        bestFor: "Import de-stuffing, port staging, customs holding, and South corridor dispatch.",
      },
      {
        type: "Lahore Distribution Terminal",
        payload: "Saggian Bypass Commercial Zone",
        volume: "25,000+ sq. ft Secure Depot",
        bestFor: "Central Punjab cross-docking, wholesale storage, and North distribution.",
      },
    ],
    features: [
      "24/7 CCTV surveillance, perimeter security, and fire protection systems.",
      "Forklift, crane lifter, and skilled labour handling for heavy industrial cargo.",
      "Cross-docking operations: transfer freight from linehaul trailers directly onto local distribution trucks.",
      "Flexible holding periods: short-term holding and scheduled monthly contract godown space.",
      "Warehouse stock balance ledger linked directly to dispatch Challan generation.",
    ],
    routeMatrix: [
      {
        corridor: "Karachi Terminal (Hawksbay)",
        transitTime: "Immediate Ingress/Egress",
        frequency: "Open 24 Hours",
        departureTerminals: "Plot 12-B, Transport Nagar, Hawksbay Road, Karachi",
      },
      {
        corridor: "Lahore Terminal (Saggian)",
        transitTime: "Immediate Ingress/Egress",
        frequency: "Open 24 Hours",
        departureTerminals: "Super Pak Data Godown, Saggian Bypass, Lahore",
      },
    ],
    whatsappMessage:
      "Assalam-o-Alaikum, I want to inquire about warehouse storage and cross-docking space at SPD Logistics terminals.",
    primaryActionLabel: "Reserve Warehouse Space",
    primaryActionHref: "/contact?service=warehousing",
    secondaryActionLabel: "View Terminal Locations",
    secondaryActionHref: "/#map-section",
  },

  "corporate-logistics": {
    slug: "corporate-logistics",
    title: "Corporate Logistics & Credit Khata",
    subtitle: "Enterprise Freight Partnerships & Monthly Billing Statements",
    badge: "Enterprise Solutions",
    colorTheme: "blue",
    iconName: "Building2",
    shortDesc:
      "Enterprise contract partnerships featuring contracted freight lanes, dedicated account managers, transparent ledger reconciliation, and custom corporate SLAs.",
    fleetOptions: [
      {
        type: "Corporate Monthly Credit",
        payload: "30-Day Billed Cycle",
        volume: "Reconciled Ledger",
        bestFor: "M/S Adamjee Dura Built, Crescent, and major industrial manufacturers.",
      },
      {
        type: "Dedicated Account Management",
        payload: "Single Point of Contact",
        volume: "Customized Service Level Agreements",
        bestFor: "End-to-end supply chain orchestration with guaranteed equipment availability.",
      },
    ],
    features: [
      "Official Monthly Freight Bill & Customer Ledger Statement (A4 Portrait exact layout).",
      "Per-party ledger export in Excel (`.xlsx`) and print-ready PDF formats with zero clipping.",
      "Contracted fixed tariffs for seasonal stability across nationwide lanes.",
      "Comprehensive payment reconciliation: Track billed freight, advance cash, and outstanding receivables.",
      "Priority truck availability during peak agricultural and festive industrial rush periods.",
    ],
    routeMatrix: [
      {
        corridor: "Corporate Dedicated Corridor",
        transitTime: "Guaranteed SLA Transit",
        frequency: "Contracted Daily Capacity",
        departureTerminals: "Nationwide Factory-to-Customer Routes",
      },
    ],
    whatsappMessage:
      "Assalam-o-Alaikum, We are interested in corporate freight contracts and monthly billing with SPD Logistics.",
    primaryActionLabel: "Inquire Corporate Account",
    primaryActionHref: "/contact?service=corporate",
    secondaryActionLabel: "Customer Receivables Portal",
    secondaryActionHref: "/admin/receivables",
  },
};

export const SPD_SERVICES_LIST = Object.values(SPD_SERVICES);
