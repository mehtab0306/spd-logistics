import prisma from "@/lib/prisma";

export type NotificationType =
  | "BILTY"
  | "PAYMENT"
  | "PAYABLE"
  | "CUSTOMER"
  | "DRIVER"
  | "CONTACT"
  | "SYSTEM";

export interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  userId?: string | null;
}

/**
 * Persist a real system notification in SQLite
 */
export async function createSystemNotification(params: CreateNotificationParams) {
  try {
    const { type, title, message, link, userId } = params;

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        link: link || null,
        userId: userId || null,
        isRead: false,
      },
    });

    return notification;
  } catch (error) {
    console.error("[Notification Helper Error] Failed to create notification:", error);
    return null;
  }
}

/**
 * Fetch notifications for admin or user
 */
export async function getSystemNotifications(options?: {
  userId?: string;
  filter?: "all" | "unread" | "read";
  limit?: number;
}) {
  try {
    const { userId, filter = "all", limit = 50 } = options || {};

    const where: any = {};

    if (userId) {
      where.OR = [{ userId }, { userId: null }];
    }

    if (filter === "unread") {
      where.isRead = false;
    } else if (filter === "read") {
      where.isRead = true;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: {
          ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
          isRead: false,
        },
      }),
    ]);

    return { success: true, data: notifications, unreadCount };
  } catch (error) {
    console.error("[Notification Helper Error] Failed to get notifications:", error);
    return { success: false, data: [], unreadCount: 0 };
  }
}
