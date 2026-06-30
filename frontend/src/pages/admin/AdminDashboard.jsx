import { useEffect, useState } from 'react';
import { Users, Package, CreditCard, TrendingUp, Clock, BarChart2 } from 'lucide-react';
import { getAdminDashboard } from '../../api/analytics';
import { getPendingProjects, reviewProject } from '../../api/marketplace';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList,
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([getAdminDashboard(), getPendingProjects()])
      .then(([s, p]) => { setStats(s.data); setPending((p.data.results || p.data).slice(0, 5)); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleReview = async (id, action) => {
    try {
      await reviewProject(id, { action, notes: '' });
      toast.success(`Project ${action}d`);
      fetchData();
    } catch { toast.error('Action failed'); }
  };

  if (loading) return <LoadingSpinner className="py-16" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={stats?.users?.total || 0} subtitle={`+${stats?.users?.new_30d || 0} this month`} icon={Users} color="blue" />
        <StatCard title="Active Subscriptions" value={stats?.subscriptions?.active || 0} icon={CreditCard} color="green" />
        <StatCard title="Total Revenue" value={`TZS ${(stats?.revenue?.total || 0).toLocaleString()}`} subtitle={`TZS ${(stats?.revenue?.last_30d || 0).toLocaleString()} this month`} icon={TrendingUp} color="yellow" />
        <StatCard title="Published Projects" value={stats?.projects?.total || 0} subtitle={`${stats?.projects?.pending_reviews || 0} pending review`} icon={Package} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Reviews */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900">Pending Reviews ({stats?.projects?.pending_reviews || 0})</h3>
          </div>
          {pending.length === 0 ? (
            <p className="text-gray-400 text-sm">No pending reviews</p>
          ) : (
            <div className="space-y-3">
              {pending.map(p => (
                <div key={p.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.developer_name} • {p.category?.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleReview(p.id, 'approve')}
                      className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded-lg transition-colors">
                      Approve
                    </button>
                    <button onClick={() => handleReview(p.id, 'reject')}
                      className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded-lg transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Projects — histogram */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-5">Top Projects by Downloads &amp; Views</h3>
          {(stats?.top_projects || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <BarChart2 className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, stats.top_projects.length * 52)}>
              <BarChart
                data={stats.top_projects.map(p => ({
                  name: p.title.length > 16 ? p.title.slice(0, 16) + '…' : p.title,
                  Downloads: p.download_count,
                  Views: p.view_count,
                }))}
                layout="vertical"
                margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
                barCategoryGap="26%"
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={108} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="Downloads" fill="#3b82f6" radius={[0, 5, 5, 0]} maxBarSize={18}>
                  <LabelList dataKey="Downloads" position="right" style={{ fontSize: 10, fill: '#64748b' }} />
                </Bar>
                <Bar dataKey="Views" fill="#bfdbfe" radius={[0, 5, 5, 0]} maxBarSize={18}>
                  <LabelList dataKey="Views" position="right" style={{ fontSize: 10, fill: '#94a3b8' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
