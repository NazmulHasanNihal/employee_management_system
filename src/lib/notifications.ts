import { db } from '@/lib/db';

export type NotificationType = 'info' | 'leave' | 'payroll' | 'system' | 'news' | 'calendar';

export const NotificationService = {
  /**
   * Notifies a specific employee.
   */
  async notifyEmployee({
    userId,
    message,
    type = 'info',
    link,
  }: {
    userId: string;
    message: string;
    type?: NotificationType;
    link?: string;
  }) {
    return await db.notification.create({
      data: {
        userId,
        message,
        type,
        link,
        read: false,
      },
    });
  },

  /**
   * Notifies all admins, HR, and CEO.
   */
  async notifyAdmins({
    message,
    type = 'system',
    link,
  }: {
    message: string;
    type?: NotificationType;
    link?: string;
  }) {
    // Find all users with admin-level roles
    const admins = await db.user.findMany({
      where: {
        role: {
          in: ['Admin', 'HR Manager', 'Director', 'CEO'], // Match your Prisma roles
        },
      },
      select: { id: true },
    });

    if (!admins.length) return;

    // Bulk create notifications
    await db.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        message,
        type,
        link,
        read: false,
      })),
    });
  },
};
