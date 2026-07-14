import { awsApiService } from './awsApiService';

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

class AwsNotificationService {
  async sendNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<boolean> {
    try {
      const token = localStorage.getItem('aws_auth_token');
      const response = await awsApiService.createDocument({
        name: `notification_${Date.now()}`,
        content: JSON.stringify(notification),
        clientName: notification.toUser,
        department: 'Notifications',
        priority: 'medium',
        deadline: new Date().toISOString().split('T')[0]
      }, token || undefined);
      
      return response.success;
    } catch (error) {
      console.error('Failed to send notification via AWS:', error);
      return false;
    }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const token = localStorage.getItem('aws_auth_token');
      const response = await awsApiService.getDocuments(token || undefined);
      
      if (response.success && response.data) {
        // Filter documents that are notifications for this user
        const notifications: Notification[] = response.data
          .filter((doc: any) => 
            doc.department === 'Notifications' && 
            doc.clientName === userId
          )
          .map((doc: any) => {
            try {
              const notificationData = JSON.parse(doc.content);
              return {
                id: doc.id,
                ...notificationData,
                timestamp: doc.created_at || new Date().toISOString(),
                read: doc.status === 'completed'
              };
            } catch (error) {
              return null;
            }
          })
          .filter(Boolean)
          .sort((a: Notification, b: Notification) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        
        return notifications;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get notifications from AWS:', error);
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('aws_auth_token');
      const response = await awsApiService.updateDocument(notificationId, {
        status: 'completed'
      }, token || undefined);
      
      return response.success;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getNotifications(userId);
    return notifications.filter(n => !n.read).length;
  }

  async sendDeadlineReminder(documentId: string, documentName: string, deadline: string, toUser: string): Promise<boolean> {
    return await this.sendNotification({
      type: 'deadline_reminder',
      title: 'Document Deadline Approaching',
      message: `Reminder: ${documentName} is due on ${deadline}. Please ensure timely completion.`,
      documentId,
      documentName,
      fromUser: 'system@company.com',
      toUser
    });
  }
}

export const awsNotificationService = new AwsNotificationService();