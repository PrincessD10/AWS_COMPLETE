
export interface Notification {
  id: string;
  type: 'document_processed' | 'document_edited' | 'document_approved' | 'document_rejected' | 'document_assigned' | 'deadline_reminder';
  title: string;
  message: string;
  documentId: string;
  documentName: string;
  fromUser: string;
  toUser: string;
  timestamp: string;
  read: boolean;
}

// Mock notifications storage
let mockNotifications: Notification[] = [];

export const notificationService = {
  sendNotification: async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<boolean> => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };
    mockNotifications.push(newNotification);
    return true;
  },

  getNotifications: async (userId: string): Promise<Notification[]> => {
    return mockNotifications.filter(n => n.toUser === userId).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  markAsRead: async (notificationId: string): Promise<boolean> => {
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    return mockNotifications.filter(n => n.toUser === userId && !n.read).length;
  },

  sendDeadlineReminder: async (documentId: string, documentName: string, deadline: string, toUser: string): Promise<boolean> => {
    return await notificationService.sendNotification({
      type: 'deadline_reminder',
      title: 'Document Deadline Approaching',
      message: `Reminder: ${documentName} is due on ${deadline}. Please ensure timely completion.`,
      documentId,
      documentName,
      fromUser: 'system@company.com',
      toUser
    });
  }
};
