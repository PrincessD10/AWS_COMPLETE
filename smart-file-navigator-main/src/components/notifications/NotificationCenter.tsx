
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, Eye } from 'lucide-react';
import { Notification, awsNotificationService } from '@/services/awsNotificationService';
import { useToast } from '@/hooks/use-toast';

interface NotificationCenterProps {
  userId: string;
  onDocumentReview?: (documentId: string, action: 'approve' | 'reject') => void;
  onViewDocument?: (documentId: string) => void;
}

const NotificationCenter = ({ userId, onDocumentReview, onViewDocument }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const notifs = await awsNotificationService.getNotifications(userId);
      setNotifications(notifs);
    } catch (error) {
      toast({
        title: "Error Loading Notifications",
        description: "Failed to load notifications.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await awsNotificationService.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleDocumentAction = (documentId: string, action: 'approve' | 'reject') => {
    if (onDocumentReview) {
      onDocumentReview(documentId, action);
    }
  };

  const handleViewDocument = (documentId: string) => {
    if (onViewDocument) {
      onViewDocument(documentId);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'document_processed': return <Check className="h-4 w-4 text-green-600" />;
      case 'document_edited': return <Eye className="h-4 w-4 text-blue-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading notifications...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Notifications</span>
          {notifications.filter(n => !n.read).length > 0 && (
            <Badge variant="destructive">
              {notifications.filter(n => !n.read).length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Recent updates and actions required</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No notifications</p>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 border rounded-lg ${
                  !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      From: {notification.fromUser} • {new Date(notification.timestamp).toLocaleString()}
                    </p>
                    
                    {notification.type === 'document_processed' && onDocumentReview && (
                      <div className="flex space-x-2 mt-3">
                        {onViewDocument && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDocument(notification.documentId)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          onClick={() => handleDocumentAction(notification.documentId, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDocumentAction(notification.documentId, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    {!notification.read && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => markAsRead(notification.id)}
                        className="mt-2"
                      >
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
