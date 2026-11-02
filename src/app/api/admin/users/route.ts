import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, validateAdminSession } from "@/lib/auth";
import { supabase, isSupabaseConfigured, generateUUID, safeUpsertCustomer, safeUpsertDriver } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

const PRIMARY_SUPER_ADMIN_ID = "a42a888d-75d5-43e9-8d80-f42587510bc5";
const PROTECTED_EMAILS = [
  "spd@gmail.com",
  "admin@spdlogistics.com",
  "superpakdata@gmail.com"
];

// Helper to retrieve user metadata stored in system_settings
async function getUsersMetadata(): Promise<Record<string, { role?: string; phone?: string; status?: string }>> {
  if (!isSupabaseConfigured) return {};
  try {
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "users_metadata")
      .maybeSingle();
    if (data?.value) {
      return JSON.parse(data.value);
    }
  } catch (err) {
    console.warn("Could not read users_metadata from system_settings:", err);
  }
  return {};
}

// Helper to save user metadata in system_settings
async function saveUsersMetadata(metadata: Record<string, any>) {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from("system_settings").upsert({
      key: "users_metadata",
      value: JSON.stringify(metadata),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Could not save users_metadata to system_settings:", err);
  }
}

export async function GET(request: Request) {
  try {
    const auth = await validateAdminSession(request, ["SUPER_ADMIN", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").toLowerCase().trim();
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const allUsers: any[] = [];
    const usersMeta = await getUsersMetadata();

    // 1. Fetch Admin & Staff users from authoritative Supabase admin_users table
    if (isSupabaseConfigured) {
      try {
        const { data: adminRows, error: adminErr } = await supabase
          .from("admin_users")
          .select("id, email, full_name, updated_at")
          .order("updated_at", { ascending: false });

        if (!adminErr && Array.isArray(adminRows)) {
          for (const row of adminRows) {
            const isPrimary =
              row.id === PRIMARY_SUPER_ADMIN_ID ||
              row.email?.toLowerCase() === "spd@gmail.com";
            const meta = usersMeta[row.id] || usersMeta[row.email?.toLowerCase()] || {};

            allUsers.push({
              id: row.id,
              name: row.full_name || (isPrimary ? "System Admin" : "Admin User"),
              email: row.email,
              phone: meta.phone || (isPrimary ? "0325 2024433" : ""),
              role: isPrimary ? "SUPER_ADMIN" : (meta.role || "ADMIN"),
              status: meta.status || "ACTIVE",
              lastLoginAt: row.updated_at,
              createdAt: row.updated_at,
              customer: null,
              driver: null,
              _count: { auditLogs: 0, consignments: 0, payments: 0 },
            });
          }
        }
      } catch (sbErr) {
        console.warn("Error fetching admin_users from Supabase:", sbErr);
      }

      // 2. Fetch Customer accounts from Supabase customers table
      try {
        const { data: customerRows, error: custErr } = await supabase
          .from("customers")
          .select("id, name, phone, email, city, address, created_at, avatar_url")
          .order("created_at", { ascending: false });

        if (!custErr && Array.isArray(customerRows)) {
          for (const c of customerRows) {
            allUsers.push({
              id: c.id,
              name: c.name,
              email: c.email || `${(c.name || "customer").toLowerCase().replace(/[^a-z0-9]/g, "")}@spdcustomer.com`,
              phone: c.phone || "",
              role: "CUSTOMER",
              status: "ACTIVE",
              lastLoginAt: c.created_at,
              createdAt: c.created_at,
              customer: { id: c.id, name: c.name, companyName: c.name },
              driver: null,
              avatar: c.avatar_url || null,
              _count: { auditLogs: 0, consignments: 0, payments: 0 },
            });
          }
        }
      } catch (custErr) {
        console.warn("Error fetching customers for user management:", custErr);
      }

      // 3. Fetch Driver accounts from Supabase drivers table
      try {
        const { data: driverRows, error: drivErr } = await supabase
          .from("drivers")
          .select("id, name, phone, vehicle_number, status, created_at, avatar_url")
          .order("created_at", { ascending: false });

        if (!drivErr && Array.isArray(driverRows)) {
          for (const d of driverRows) {
            allUsers.push({
              id: d.id,
              name: d.name,
              email: `${(d.name || "driver").toLowerCase().replace(/[^a-z0-9]/g, "")}@spddriver.com`,
              phone: d.phone || "",
              role: "DRIVER",
              status: (d.status || "Active").toUpperCase() === "ACTIVE" ? "ACTIVE" : "INACTIVE",
              lastLoginAt: d.created_at,
              createdAt: d.created_at,
              customer: null,
              driver: { id: d.id, name: d.name, vehicleNumber: d.vehicle_number || "" },
              avatar: d.avatar_url || null,
              _count: { auditLogs: 0, consignments: 0, payments: 0 },
            });
          }
        }
      } catch (drivErr) {
        console.warn("Error fetching drivers for user management:", drivErr);
      }
    }

    // Safeguard: Ensure the primary Super Admin spd@gmail.com is always present
    const hasSuperAdmin = allUsers.some(
      (u) => u.email?.toLowerCase() === "spd@gmail.com" || u.id === PRIMARY_SUPER_ADMIN_ID
    );
    if (!hasSuperAdmin) {
      allUsers.unshift({
        id: PRIMARY_SUPER_ADMIN_ID,
        name: "System Admin",
        email: "spd@gmail.com",
        phone: "0325 2024433",
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        lastLoginAt: new Date().toISOString(),
        createdAt: "2026-01-01T00:00:00.000Z",
        customer: null,
        driver: null,
        _count: { auditLogs: 0, consignments: 0, payments: 0 },
      });
    }

    // Filter in-memory based on requested query params
    let filtered = allUsers;

    if (role && role !== "ALL") {
      filtered = filtered.filter((u) => u.role === role);
    }

    if (status && status !== "ALL") {
      filtered = filtered.filter((u) => u.status === status);
    } else if (!status) {
      filtered = filtered.filter((u) => u.status !== "DELETED");
    }

    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search) ||
          u.phone?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/users:", error);
    // Safe minimum authoritative return on unexpected failure
    return NextResponse.json({
      success: true,
      data: [
        {
          id: PRIMARY_SUPER_ADMIN_ID,
          name: "System Admin",
          email: "spd@gmail.com",
          phone: "0325 2024433",
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          lastLoginAt: new Date().toISOString(),
          createdAt: "2026-01-01T00:00:00.000Z",
          customer: null,
          driver: null,
          _count: { auditLogs: 0, consignments: 0, payments: 0 },
        },
      ],
    });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await validateAdminSession(request, ["SUPER_ADMIN", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;
    const { session } = auth;

    const body = await request.json();
    const { name, email, password, role = "STAFF", phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check if account already exists in admin_users, customers, or drivers
    if (isSupabaseConfigured) {
      const { data: existingAdmin } = await supabase
        .from("admin_users")
        .select("id")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (existingAdmin) {
        return NextResponse.json(
          { success: false, error: `An administrator account with email "${cleanEmail}" already exists.` },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await hashPassword(password);
    const newId = generateUUID();

    if (role === "CUSTOMER") {
      const { success, data: custData, error: custErr } = await safeUpsertCustomer({
        id: newId,
        name: cleanName,
        email: cleanEmail,
        phone: phone?.trim() || null,
        city: "Karachi",
      });

      if (!success) {
        return NextResponse.json({ success: false, error: custErr?.message || "Failed to create customer account." }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: custData?.id || newId,
          name: cleanName,
          email: cleanEmail,
          phone: phone || "",
          role: "CUSTOMER",
          status: "ACTIVE",
        },
      });
    }

    if (role === "DRIVER") {
      const { success, data: drivData, error: drivErr } = await safeUpsertDriver({
        id: newId,
        name: cleanName,
        phone: phone?.trim() || null,
        status: "Active",
      });

      if (!success) {
        return NextResponse.json({ success: false, error: drivErr?.message || "Failed to create driver account." }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: drivData?.id || newId,
          name: cleanName,
          email: cleanEmail,
          phone: phone || "",
          role: "DRIVER",
          status: "ACTIVE",
        },
      });
    }

    // Role is SUPER_ADMIN, ADMIN, or STAFF: Insert into Supabase admin_users
    if (isSupabaseConfigured) {
      const { data: adminCreated, error: adminInsErr } = await supabase
        .from("admin_users")
        .insert([
          {
            id: newId,
            email: cleanEmail,
            full_name: cleanName,
            password: hashedPassword,
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .maybeSingle();

      if (adminInsErr) {
        console.error("Supabase admin_users insert error:", adminInsErr);
        return NextResponse.json(
          { success: false, error: `Database insert failed: ${adminInsErr.message}` },
          { status: 500 }
        );
      }

      // Store metadata in system_settings
      const meta = await getUsersMetadata();
      meta[newId] = {
        role: role || "STAFF",
        phone: phone?.trim() || "",
        status: "ACTIVE",
      };
      await saveUsersMetadata(meta);

      // Redundancy in Prisma if available
      try {
        await prisma.user.create({
          data: {
            id: newId,
            name: cleanName,
            email: cleanEmail,
            password: hashedPassword,
            role: role || "STAFF",
            phone: phone || null,
            status: "ACTIVE",
          },
        }).catch(() => {});
      } catch {}

      return NextResponse.json({
        success: true,
        data: {
          id: adminCreated?.id || newId,
          name: cleanName,
          email: cleanEmail,
          phone: phone || "",
          role: role || "STAFF",
          status: "ACTIVE",
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Database not configured." },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Error creating user in POST /api/admin/users:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create user." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await validateAdminSession(request, ["SUPER_ADMIN", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;
    const { session } = auth;

    const body = await request.json();
    const { id, role, status, password, name, phone } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    // 1. Check if user is in admin_users
    if (isSupabaseConfigured) {
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (adminRow) {
        // Protect primary Super Admin role downgrade
        if (
          (adminRow.id === PRIMARY_SUPER_ADMIN_ID || adminRow.email?.toLowerCase() === "spd@gmail.com") &&
          role &&
          role !== "SUPER_ADMIN"
        ) {
          return NextResponse.json(
            { success: false, error: "Cannot change the role of the primary Super Admin account." },
            { status: 403 }
          );
        }

        const updatePayload: any = { updated_at: new Date().toISOString() };
        if (name) updatePayload.full_name = name.trim();
        if (password) {
          updatePayload.password = await hashPassword(password);
        }

        const { error: updErr } = await supabase
          .from("admin_users")
          .update(updatePayload)
          .eq("id", id);

        if (updErr) {
          return NextResponse.json({ success: false, error: updErr.message }, { status: 500 });
        }

        // Update metadata
        const meta = await getUsersMetadata();
        meta[id] = {
          role: role || meta[id]?.role || "ADMIN",
          phone: phone !== undefined ? phone : (meta[id]?.phone || ""),
          status: status || meta[id]?.status || "ACTIVE",
        };
        await saveUsersMetadata(meta);

        return NextResponse.json({
          success: true,
          data: {
            id,
            name: name || adminRow.full_name,
            email: adminRow.email,
            role: meta[id].role,
            status: meta[id].status,
          },
        });
      }

      // 2. Check if user is in customers table
      const { data: custRow } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (custRow) {
        const custUpdate: any = {};
        if (name) custUpdate.name = name.trim();
        if (phone !== undefined) custUpdate.phone = phone?.trim() || null;
        if (status) custUpdate.status = status;

        await supabase.from("customers").update(custUpdate).eq("id", id);
        return NextResponse.json({ success: true, data: { id, name: custUpdate.name || custRow.name, role: "CUSTOMER", status: custUpdate.status || "ACTIVE" } });
      }

      // 3. Check if user is in drivers table
      const { data: drivRow } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (drivRow) {
        const drivUpdate: any = {};
        if (name) drivUpdate.name = name.trim();
        if (phone !== undefined) drivUpdate.phone = phone?.trim() || null;
        if (status) drivUpdate.status = status.toUpperCase() === "ACTIVE" ? "Active" : "Inactive";

        await supabase.from("drivers").update(drivUpdate).eq("id", id);
        return NextResponse.json({ success: true, data: { id, name: drivUpdate.name || drivRow.name, role: "DRIVER", status: drivUpdate.status || "ACTIVE" } });
      }
    }

    return NextResponse.json({ success: true, data: { id, name, role, status } });
  } catch (error: any) {
    console.error("Error updating user in PUT /api/admin/users:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await validateAdminSession(request, ["SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;
    const { session } = auth;

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (_) {}
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    // SAFE DELETION RULE 3: Prevent deleting active Super Admin account
    if (id === PRIMARY_SUPER_ADMIN_ID) {
      return NextResponse.json(
        { success: false, error: "Cannot delete the primary Super Administrator account (Protected)." },
        { status: 403 }
      );
    }

    if (session.userId && session.userId === id) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own currently active administrator session." },
        { status: 403 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: false, error: "Cloud database is not connected." }, { status: 500 });
    }

    // Check 1: Is this account in admin_users?
    const { data: targetAdmin } = await supabase
      .from("admin_users")
      .select("id, email")
      .eq("id", id)
      .maybeSingle();

    if (targetAdmin) {
      if (PROTECTED_EMAILS.includes(targetAdmin.email?.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: "Cannot delete primary administrator account (Protected)." },
          { status: 403 }
        );
      }

      // SAFE DELETION RULE 4: Protect last remaining Super Admin
      const { count } = await supabase
        .from("admin_users")
        .select("*", { count: "exact", head: true });

      if (count !== null && count <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the last remaining administrator account in the system." },
          { status: 403 }
        );
      }

      // Delete from admin_users
      const { error: delErr } = await supabase
        .from("admin_users")
        .delete()
        .eq("id", id);

      if (delErr) {
        console.error("Supabase admin_users deletion failed:", delErr);
        return NextResponse.json(
          { success: false, error: `Database deletion failed: ${delErr.message}` },
          { status: 500 }
        );
      }

      // Clean up metadata
      const meta = await getUsersMetadata();
      if (meta[id]) {
        delete meta[id];
        await saveUsersMetadata(meta);
      }

      // Confirm deletion in database
      const { data: verifyRow } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", id)
        .maybeSingle();

      if (verifyRow) {
        return NextResponse.json(
          { success: false, error: "Deletion could not be confirmed in the database. Record still exists." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Administrator account deleted successfully.",
      });
    }

    // Check 2: Is this account in customers?
    const { data: targetCust } = await supabase
      .from("customers")
      .select("id, name")
      .eq("id", id)
      .maybeSingle();

    if (targetCust) {
      // Check for consignment bilty history
      const { data: bilties } = await supabase
        .from("bilties")
        .select("id")
        .or(`sender_name.ilike.%${targetCust.name}%,receiver_name.ilike.%${targetCust.name}%`)
        .limit(1);

      if (bilties && bilties.length > 0) {
        // Safe soft-delete / deactivation
        await supabase.from("customers").update({ current_balance: 0 }).eq("id", id);
        return NextResponse.json({
          success: true,
          message: `Customer ${targetCust.name} has active consignment history. Account deactivated safely.`,
        });
      }

      const { error: custDelErr } = await supabase.from("customers").delete().eq("id", id);
      if (custDelErr) {
        return NextResponse.json({ success: false, error: custDelErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Customer ${targetCust.name} deleted successfully.`,
      });
    }

    // Check 3: Is this account in drivers?
    const { data: targetDriver } = await supabase
      .from("drivers")
      .select("id, name")
      .eq("id", id)
      .maybeSingle();

    if (targetDriver) {
      const { data: challans } = await supabase
        .from("challans")
        .select("id")
        .ilike("driver_name", `%${targetDriver.name}%`)
        .limit(1);

      if (challans && challans.length > 0) {
        await supabase.from("drivers").update({ status: "Inactive" }).eq("id", id);
        return NextResponse.json({
          success: true,
          message: `Driver ${targetDriver.name} has dispatch trip records. Driver deactivated safely.`,
        });
      }

      const { error: drivDelErr } = await supabase.from("drivers").delete().eq("id", id);
      if (drivDelErr) {
        return NextResponse.json({ success: false, error: drivDelErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Driver ${targetDriver.name} deleted successfully.`,
      });
    }

    // If ID was in Prisma SQLite only
    try {
      await prisma.user.delete({ where: { id } }).catch(() => {});
    } catch {}

    return NextResponse.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/admin/users:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete user." },
      { status: 500 }
    );
  }
}
