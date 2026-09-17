import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, getAuthCookie, verifyToken } from "@/lib/auth";

const PROTECTED_EMAILS = ["admin.com", "admin@spdlogistics.com"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (role && role !== "ALL") where.role = role;
    if (status && status !== "ALL") {
      where.status = status;
    } else if (!status) {
      where.status = { not: "DELETED" };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        customer: { select: { id: true, name: true, companyName: true } },
        driver: { select: { id: true, name: true, vehicleNumber: true } },
        _count: {
          select: {
            auditLogs: true,
            consignments: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role = "STAFF", phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanEmail }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Account with email "${cleanEmail}" already exists` },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        password: hashedPassword,
        role,
        phone: phone || null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, role, status, password, name, phone } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (password) {
      updateData.password = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
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

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        customer: true,
        driver: true,
        _count: {
          select: {
            auditLogs: true,
            consignments: true,
            payments: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // 1. Protect primary / owner account
    if (PROTECTED_EMAILS.includes(targetUser.email.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Cannot delete primary system administrator account (Protected)." },
        { status: 403 }
      );
    }

    // 2. Protect currently active logged-in session account
    try {
      const cookie = await getAuthCookie();
      if (cookie) {
        const session = await verifyToken(cookie);
        if (session && session.userId === targetUser.id) {
          return NextResponse.json(
            { success: false, error: "Cannot delete your own currently active account." },
            { status: 403 }
          );
        }
      }
    } catch (_) {}

    const hasRelations = (
      !!targetUser.customer ||
      !!targetUser.driver ||
      (targetUser._count?.auditLogs || 0) > 0 ||
      (targetUser._count?.consignments || 0) > 0 ||
      (targetUser._count?.payments || 0) > 0
    );

    if (hasRelations) {
      // Soft-delete to preserve references and business logs
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id },
          data: { status: "DELETED" },
        });
        if (targetUser.customer) {
          await tx.customer.update({
            where: { id: targetUser.customer.id },
            data: { status: "DELETED" },
          });
        }
        if (targetUser.driver) {
          await tx.driver.update({
            where: { id: targetUser.driver.id },
            data: { status: "DELETED" },
          });
        }
      });

      return NextResponse.json({
        success: true,
        message: "User deactivated and deleted successfully.",
        softDeleted: true,
      });
    } else {
      // Hard delete if completely clean user
      await prisma.user.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: "User deleted successfully.",
      });
    }
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Unable to delete user. Please try again." },
      { status: 500 }
    );
  }
}
