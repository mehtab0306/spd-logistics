import { NextResponse } from 'next/server';
import {
  getCentralCollection,
  saveCentralRecord,
  updateCentralRecord,
  deleteCentralRecord,
} from '@/lib/server-store';
import { validateAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = await validateAdminSession(request, ['SUPER_ADMIN', 'ADMIN', 'STAFF']);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const status = searchParams.get('status') || '';
    const industry = searchParams.get('industry') || '';

    let leads = (getCentralCollection('marketingLeads') as any[]) || [];
    let campaigns = (getCentralCollection('marketingCampaigns') as any[]) || [];

    if (search) {
      leads = leads.filter(
        (l) =>
          l.companyName?.toLowerCase().includes(search) ||
          l.contactPerson?.toLowerCase().includes(search) ||
          l.phone?.includes(search) ||
          l.city?.toLowerCase().includes(search)
      );
    }
    if (status && status !== 'ALL') {
      leads = leads.filter((l) => l.status === status);
    }
    if (industry && industry !== 'ALL') {
      leads = leads.filter((l) => l.industry?.toLowerCase() === industry.toLowerCase());
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const metrics = {
      totalLeads: leads.length,
      activeProspects: leads.filter((l) =>
        ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT'].includes(l.status)
      ).length,
      wonCustomers: leads.filter((l) => l.status === 'WON').length,
      followUpsDue: leads.filter(
        (l) =>
          l.nextFollowUpDate &&
          l.nextFollowUpDate <= todayStr &&
          l.status !== 'WON' &&
          l.status !== 'LOST'
      ).length,
    };

    return NextResponse.json({
      success: true,
      leads,
      campaigns,
      metrics,
    });
  } catch (err: any) {
    console.error('Marketing API GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await validateAdminSession(request, ['SUPER_ADMIN', 'ADMIN', 'STAFF']);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { action, lead, campaign } = body;

    if (action === 'create_campaign' || campaign) {
      const campData = campaign || body;
      const newCamp = {
        id: campData.id || `camp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: campData.title || 'Untitled Campaign',
        targetAudience: campData.targetAudience || 'General Traders',
        channel: campData.channel || 'WHATSAPP',
        messageTemplate: campData.messageTemplate || '',
        status: campData.status || 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      saveCentralRecord('marketingCampaigns', newCamp);
      return NextResponse.json({ success: true, campaign: newCamp });
    }

    // Default: create or update lead
    const leadData = lead || body;
    const newLead = {
      id: leadData.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      companyName: leadData.companyName?.trim() || 'Untitled Prospect',
      contactPerson: leadData.contactPerson?.trim() || '',
      phone: leadData.phone?.trim() || '',
      email: leadData.email?.trim() || '',
      city: leadData.city || 'Karachi',
      industry: leadData.industry || 'General Cargo',
      estimatedMonthlyVolume: leadData.estimatedMonthlyVolume || '',
      status: leadData.status || 'NEW',
      notes: leadData.notes || '',
      assignedTo: leadData.assignedTo || 'Sales Team',
      nextFollowUpDate: leadData.nextFollowUpDate || '',
      createdAt: leadData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveCentralRecord('marketingLeads', newLead);
    return NextResponse.json({ success: true, lead: newLead });
  } catch (err: any) {
    console.error('Marketing API POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await validateAdminSession(request, ['SUPER_ADMIN', 'ADMIN', 'STAFF']);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { id, type, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const collection = type === 'campaign' ? 'marketingCampaigns' : 'marketingLeads';
    const updated = updateCentralRecord(collection, id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('Marketing API PUT error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await validateAdminSession(request, ['SUPER_ADMIN', 'ADMIN', 'STAFF']);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'lead';

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const collection = type === 'campaign' ? 'marketingCampaigns' : 'marketingLeads';
    const deleted = deleteCentralRecord(collection, id);
    return NextResponse.json({ success: true, deleted });
  } catch (err: any) {
    console.error('Marketing API DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
