import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const DEFAULT_SETTINGS: Record<
  string,
  { value: string; category: string; description?: string }
> = {
  // General
  appName: { value: 'SPD Logistics', category: 'GENERAL', description: 'Application display name' },
  currency: { value: 'PKR', category: 'GENERAL', description: 'Base operating currency' },
  timezone: { value: 'Asia/Karachi', category: 'GENERAL', description: 'Operational timezone' },
  dateDisplayFormat: { value: 'DD/MM/YYYY', category: 'GENERAL', description: 'Standard date display format' },

  // Company
  companyName: {
    value: 'Super Pak Data Goods Transport Co.',
    category: 'COMPANY',
    description: 'Official registered company name',
  },
  companyTagline: {
    value: 'Nationwide Cargo & Highway Transport — Est. 1996',
    category: 'COMPANY',
    description: 'Company slogan or tagline',
  },
  companyEmail: {
    value: 'superpakdatawale@gmail.com',
    category: 'COMPANY',
    description: 'Primary company email address',
  },
  companyPhone: {
    value: '0325 2024433',
    category: 'COMPANY',
    description: 'Main office phone number',
  },
  whatsappNumber: {
    value: '0325 2024433',
    category: 'COMPANY',
    description: 'Official WhatsApp contact number',
  },
  website: {
    value: 'https://spdlogistics.com',
    category: 'COMPANY',
    description: 'Official company website',
  },
  karachiWarehouseAddress: {
    value: 'Plot 45-B, Transport Nagar, Mauripur Road, Port Qasim Terminal, Karachi',
    category: 'COMPANY',
    description: 'Karachi hub warehouse address',
  },
  lahoreWarehouseAddress: {
    value: 'Main Bhati Gate Goods Transport Terminal, Circular Road, Lahore',
    category: 'COMPANY',
    description: 'Lahore hub warehouse address',
  },
  businessDescription: {
    value:
      'Premier logistics and freight transport services operating across Pakistan with dedicated fleet trucks and nationwide distribution terminals.',
    category: 'COMPANY',
    description: 'Business summary',
  },
  companyLogo: {
    value: '/images/spd-logo.jpg',
    category: 'COMPANY',
    description: 'Official company logo URL',
  },

  // Billing
  defaultPaymentStatus: {
    value: 'PENDING',
    category: 'BILLING',
    description: 'Default payment status for new consignments',
  },
  defaultPaymentMethod: {
    value: 'CASH',
    category: 'BILLING',
    description: 'Default payment method',
  },
  biltyPrefix: {
    value: 'SPD-',
    category: 'BILLING',
    description: 'Prefix for generated Bilty vouchers',
  },
  biltyNumberFormat: {
    value: 'PREFIX-HUB-YEAR-SEQ',
    category: 'BILLING',
    description: 'Bilty numbering structure format',
  },
  defaultTaxRate: {
    value: '0',
    category: 'BILLING',
    description: 'Default applicable tax percentage',
  },
  paymentTerms: {
    value: 'Payment due on delivery or credit terms within 15 days.',
    category: 'BILLING',
    description: 'Standard invoice payment terms',
  },
  dueDays: {
    value: '15',
    category: 'BILLING',
    description: 'Standard credit due days',
  },
  defaultNotes: {
    value: 'Goods transported under company standard carriage conditions.',
    category: 'BILLING',
    description: 'Default bilty voucher footer notes',
  },

  // Tracking
  publicTrackingEnabled: {
    value: 'true',
    category: 'TRACKING',
    description: 'Allow public tracking via website',
  },
  trackingPrefix: {
    value: 'SPD-',
    category: 'TRACKING',
    description: 'Prefix for consignment tracking IDs',
  },
  defaultShipmentStatus: {
    value: 'BOOKED',
    category: 'TRACKING',
    description: 'Default shipment status upon creation',
  },
  availableStatuses: {
    value: JSON.stringify([
      'BOOKED',
      'PICKED UP',
      'IN TRANSIT',
      'ARRIVED AT DESTINATION',
      'OUT FOR DELIVERY',
      'DELIVERED',
      'ON HOLD',
      'DELIVERY FAILED',
      'RETURNED',
      'CANCELLED',
    ]),
    category: 'TRACKING',
    description: 'Configured manual tracking statuses',
  },
  trackingDisplayOptions: {
    value: 'DETAILED',
    category: 'TRACKING',
    description: 'Tracking timeline display detail level',
  },
  customerTrackingVisibility: {
    value: 'FULL',
    category: 'TRACKING',
    description: 'Customer portal tracking visibility',
  },

  // Notifications
  emailNotificationsEnabled: {
    value: 'true',
    category: 'NOTIFICATIONS',
    description: 'Enable system email alerts',
  },
  whatsappClickToChatEnabled: {
    value: 'true',
    category: 'NOTIFICATIONS',
    description: 'Enable manual WhatsApp click-to-chat links',
  },
  shipmentStatusNotifications: {
    value: 'true',
    category: 'NOTIFICATIONS',
    description: 'Notify on shipment status progression',
  },
  newBiltyNotification: {
    value: 'true',
    category: 'NOTIFICATIONS',
    description: 'Alert on new consignment booking',
  },
  deliveryNotification: {
    value: 'true',
    category: 'NOTIFICATIONS',
    description: 'Alert on successful goods delivery',
  },
  paymentNotification: {
    value: 'true',
    category: 'NOTIFICATIONS',
    description: 'Alert on recorded payments',
  },
  contactFormNotification: {
    value: 'true',
    category: 'NOTIFICATIONS',
    description: 'Alert on public contact form submissions',
  },
  adminNotificationEmail: {
    value: 'superpakdatawale@gmail.com',
    category: 'NOTIFICATIONS',
    description: 'Admin alert recipient email',
  },

  // Theme
  themeMode: {
    value: 'system',
    category: 'THEME',
    description: 'Default theme mode (light, dark, system)',
  },
  themePersistence: {
    value: 'true',
    category: 'THEME',
    description: 'Remember theme preference across sessions',
  },
};

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required' },
        { status: 403 }
      );
    }

    // Retrieve saved settings from database
    const dbSettings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};

    // Start with all defaults
    for (const [key, item] of Object.entries(DEFAULT_SETTINGS)) {
      settingsMap[key] = item.value;
    }

    // Override with any values saved in DB
    for (const s of dbSettings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      success: true,
      data: settingsMap,
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings, category = 'GENERAL' } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid settings payload' },
        { status: 400 }
      );
    }

    // Upsert each setting key into the database
    const entries = Object.entries(settings);
    for (const [key, val] of entries) {
      const stringValue = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
      const defaultMeta = DEFAULT_SETTINGS[key];
      const settingCategory = defaultMeta?.category || category.toUpperCase();
      const description = defaultMeta?.description || `${key} configuration`;

      await prisma.setting.upsert({
        where: { key },
        create: {
          key,
          value: stringValue,
          category: settingCategory,
          description,
        },
        update: {
          value: stringValue,
          category: settingCategory,
          description,
        },
      });
    }

    // Re-fetch all merged settings to return
    const dbSettings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const [key, item] of Object.entries(DEFAULT_SETTINGS)) {
      settingsMap[key] = item.value;
    }
    for (const s of dbSettings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      success: true,
      data: settingsMap,
      message: 'Settings updated and persisted successfully',
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category is required for reset' },
        { status: 400 }
      );
    }

    // Reset settings in category back to default
    // Note: NEVER deletes bilties, tracking, customers, drivers, vehicles, payments, ledgers, or cash books!
    const validCategories = ['GENERAL', 'COMPANY', 'BILLING', 'TRACKING', 'NOTIFICATIONS', 'THEME'];
    const catUpper = category.toUpperCase();

    if (!validCategories.includes(catUpper)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category for reset' },
        { status: 400 }
      );
    }

    // Reset settings in DB for this category
    await prisma.setting.deleteMany({
      where: { category: catUpper },
    });

    // Return fresh merged settings
    const dbSettings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const [key, item] of Object.entries(DEFAULT_SETTINGS)) {
      settingsMap[key] = item.value;
    }
    for (const s of dbSettings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      success: true,
      data: settingsMap,
      message: `${catUpper} settings restored to standard system defaults`,
    });
  } catch (error: any) {
    console.error('Error resetting settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset settings' },
      { status: 500 }
    );
  }
}
