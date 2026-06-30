import { useEffect, useState } from 'react';
import { Package, Download, Eye, Star, Plus, BarChart2 } from 'lucide-react';
import { getDeveloperDashboard } from '../../api/analytics';
import { getMyProjects } from '../../api/marketplace';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../store/authStore';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList,
} from 'recharts';

const statusBadge = { draft: 'badge-gray', pending_review: 'badge-yellow', published: 'badge-green', rejected: 'badge-red', archived: 'badge-gray' };

export default function DeveloperDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDeveloperDashboard(), getMyProjects()])
      .then(([s, p]) => { setStats(s.data); setProjects((p.data.results || p.data).slice(0, 5)); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-16" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.first_name}</p>
        </div>
        <Link to="/developer/upload" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Upload Project
        </Link>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Projects" value={stats?.total_projects || 0} icon={Package} color="blue" />
        <StatCard title="Published" value={stats?.published_projects || 0} icon={Package} color="green" />
        <StatCard title="Total Downloads" value={stats?.total_downloads || 0} icon={Download} color="purple" />
        <StatCard title="Total Views" value={stats?.total_views || 0} icon={Eye} color="yellow" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Avg Rating" value={stats?.average_rating ? stats.average_rating.toFixed(1) : 'N/A'} icon={Star} color="yellow" />
        <StatCard title="Pending Review" value={stats?.pending_reviews || 0} subtitle="Awaiting approval" icon={Package} color="red" />
      </div>

      {/* Downloads & Views histogram per project */}
      {projects.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-500" /> Downloads &amp; Views per Project
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(200, projects.length * 52)}>
            <BarChart
              data={projects.map(p => ({
                name: p.title.length > 18 ? p.title.slice(0, 18) + '…' : p.title,
                Downloads: p.download_count,
                Views: p.view_count,
              }))}
              layout="vertical"
              margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
              barCategoryGap="26%"
              barGap={3}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
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
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">My Projects</h3>
          <Link to="/developer/projects" className="text-sm text-blue-600 hover:text-blue-700">View all</Link>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No projects yet</p>
            <Link to="/developer/upload" className="btn-primary mt-3 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Upload First Project
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.category_name} • {p.year}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Download className="w-3 h-3" />{p.download_count}</span>
                  <span className={`badge ${statusBadge[p.status] || 'badge-gray'} text-xs`}>{p.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
