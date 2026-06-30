import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Users, Search, AlertTriangle, Bell } from 'lucide-react';
import { getPendingProjects, getSupervisedProjects } from '../../api/marketplace';
import { getUnreadCount } from '../../api/notifications';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../store/authStore';

export default function LecturerDashboard() {
  const { user } = useAuthStore();
  const [pending, setPending] = useState([]);
  const [supervised, setSupervised] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getPendingProjects().then(r => setPending(r.data.results || r.data)).catch(() => {}),
      getSupervisedProjects().then(r => setSupervised(r.data.results || r.data)).catch(() => {}),
      getUnreadCount().then(r => setUnread(r.data.count)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-16" />;

  const recentPending = pending.slice(0, 5);
  const recentSupervised = supervised.slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.first_name}!</h1>
        <p className="text-gray-500 text-sm mt-1">Lecturer Dashboard — {user?.department}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Pending Review" value={pending.length} subtitle="Projects awaiting review" icon={ClipboardList} color="yellow" />
        <StatCard title="Supervised Students" value={supervised.length} subtitle="Projects you supervise" icon={Users} color="blue" />
        <StatCard title="Notifications" value={unread} subtitle="Unread" icon={Bell} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Review */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-yellow-500" /> Pending Review
            </h3>
            <Link to="/lecturer/pending" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {recentPending.length === 0 ? (
            <p className="text-sm text-gray-400">No projects pending review.</p>
          ) : (
            <div className="space-y-2">
              {recentPending.map(p => (
                <Link key={p.id} to={`/lecturer/pending/${p.id}`}
                  className="flex items-center justify-between p-2.5 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.developer_name} · {p.year}</p>
                  </div>
                  <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full shrink-0">Review</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Supervised Students */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> Supervised Submissions
            </h3>
            <Link to="/lecturer/supervised" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {recentSupervised.length === 0 ? (
            <p className="text-sm text-gray-400">No supervised projects yet. Assign yourself as supervisor from project pages.</p>
          ) : (
            <div className="space-y-2">
              {recentSupervised.map(p => (
                <Link key={p.id} to={`/marketplace/${p.slug}`}
                  className="flex items-center justify-between p-2.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.developer_name} · {p.developer_registration_number}</p>
                  </div>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full shrink-0 capitalize
                    ${p.status === 'published' ? 'bg-green-100 text-green-700' :
                      p.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                      p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/lecturer/pending" className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-yellow-50 rounded-lg text-sm text-gray-700 hover:text-yellow-700 transition-colors">
              <ClipboardList className="w-4 h-4" /> Review Pending Projects
            </Link>
            <Link to="/lecturer/supervised" className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg text-sm text-gray-700 hover:text-blue-700 transition-colors">
              <Users className="w-4 h-4" /> My Supervised Students
            </Link>
            <Link to="/lecturer/duplicate-check" className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-red-50 rounded-lg text-sm text-gray-700 hover:text-red-700 transition-colors">
              <AlertTriangle className="w-4 h-4" /> Duplicate Title Check
            </Link>
            <Link to="/marketplace" className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-green-50 rounded-lg text-sm text-gray-700 hover:text-green-700 transition-colors">
              <Search className="w-4 h-4" /> Browse All Projects
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
