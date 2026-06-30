import { useEffect, useState } from 'react';
import { Download, Bookmark, Bell, CreditCard } from 'lucide-react';
import { getBookmarks } from '../../api/marketplace';
import { getUnreadCount } from '../../api/notifications';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../store/authStore';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getBookmarks().then(r => setBookmarkCount((r.data.results || r.data).length)).catch(() => {}),
      getUnreadCount().then(r => setUnread(r.data.count)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-16" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.first_name}!</h1>
        <p className="text-gray-500 text-sm mt-1">Here's your marketplace overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Bookmarks" value={bookmarkCount} subtitle="Saved projects" icon={Bookmark} color="purple" />
        <StatCard title="Notifications" value={unread} subtitle="Unread" icon={Bell} color="yellow" />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/marketplace" className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg text-sm text-gray-700 hover:text-blue-700 transition-colors">
              <Download className="w-4 h-4" /> Browse Projects
            </Link>
            <Link to="/dashboard/bookmarks" className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg text-sm text-gray-700 hover:text-blue-700 transition-colors">
              <Bookmark className="w-4 h-4" /> My Bookmarks
            </Link>
            <Link to="/dashboard/subscriptions" className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg text-sm text-gray-700 hover:text-blue-700 transition-colors">
              <CreditCard className="w-4 h-4" /> Manage Subscription
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
