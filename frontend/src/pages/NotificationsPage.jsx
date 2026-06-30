import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { getNotifications, markRead, markAllRead } from '../api/notifications';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    getNotifications().then(r => setNotifications(r.data.results || r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id) => {
    await markRead(id);
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAll = async () => {
    await markAllRead();
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
  };

  const typeColors = {
    subscription_expiry: 'bg-yellow-50 border-yellow-200',
    payment_confirmed: 'bg-green-50 border-green-200',
    project_approved: 'bg-blue-50 border-blue-200',
    project_rejected: 'bg-red-50 border-red-200',
    project_upload: 'bg-indigo-50 border-indigo-200',
    system_announcement: 'bg-purple-50 border-purple-200',
  };

  if (loading) return <LoadingSpinner className="py-16" />;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {notifications.some(n => !n.is_read) && (
          <button onClick={handleMarkAll} className="btn-secondary text-sm flex items-center gap-1">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`card border cursor-pointer transition-colors ${n.is_read ? 'opacity-70' : ''} ${typeColors[n.notification_type] || 'bg-white border-gray-100'}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
