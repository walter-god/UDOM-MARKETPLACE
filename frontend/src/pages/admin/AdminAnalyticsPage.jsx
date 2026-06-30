import { useEffect, useState } from 'react';
import { getPlatformStats, getProjectStats } from '../../api/analytics';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import { TrendingUp, Users, Package, Download, Eye, BarChart2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';

const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

const ACCESS_LABELS = {
  free: 'Free',
  student: 'Student Plan',
  premium: 'Premium',
  institutional: 'Institutional',
};

const TECH_LABELS = {
  web: 'Web App',
  mobile_android: 'Android',
  mobile_ios: 'iOS',
  desktop: 'Desktop',
  api: 'API/Backend',
  ml_ai: 'ML / AI',
  data_science: 'Data Science',
  embedded: 'Embedded',
  other: 'Other',
};

const fmt = (v) => Number(v).toLocaleString();

function EmptyChart({ title }) {
  return (
    <div className="card flex flex-col items-center justify-center py-14">
      <BarChart2 className="w-8 h-8 text-gray-200 mb-2" />
      <p className="text-gray-400 text-sm">{title} — no data yet</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold ml-1">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

// Vertical bar chart — good for distributions with short labels
function VerticalBarCard({ title, data, dataKey, nameKey, colors }) {
  if (!data?.length) return <EmptyChart title={title} />;
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-5">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 4 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey={nameKey} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} tickFormatter={fmt} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((_, i) => <Cell key={i} fill={colors ? colors[i % colors.length] : BAR_COLORS[i % BAR_COLORS.length]} />)}
            <LabelList dataKey={dataKey} position="top" formatter={fmt} style={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Horizontal bar chart — good for ranked lists with long labels
function HorizontalBarCard({ title, data, dataKey, nameKey, color = '#3b82f6', height }) {
  if (!data?.length) return <EmptyChart title={title} />;
  const h = height || Math.max(220, data.length * 44);
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-5">{title}</h3>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 4 }} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmt} />
          <YAxis type="category" dataKey={nameKey} width={110} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey={dataKey} fill={color} radius={[0, 6, 6, 0]} maxBarSize={24}>
            <LabelList dataKey={dataKey} position="right" formatter={fmt} style={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Grouped horizontal bar chart — two metrics side by side per row
function GroupedHorizontalBarCard({ title, data, keys, colors, nameKey, height }) {
  if (!data?.length) return <EmptyChart title={title} />;
  const h = height || Math.max(240, data.length * 52);
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-5">{title}</h3>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 4 }} barCategoryGap="24%" barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmt} />
          <YAxis type="category" dataKey={nameKey} width={110} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
          {keys.map((k, i) => (
            <Bar key={k.key} dataKey={k.key} name={k.label} fill={colors[i]} radius={[0, 4, 4, 0]} maxBarSize={18}>
              <LabelList dataKey={k.key} position="right" formatter={fmt} style={{ fontSize: 10, fill: '#94a3b8' }} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Platform trend chart — grouped vertical bars over time
function TrendBarCard({ title, data, keys, colors }) {
  if (!data?.length) return <EmptyChart title={title} />;
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-5">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 4 }} barCategoryGap="30%" barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} tickFormatter={fmt} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {keys.map((k, i) => (
            <Bar key={k.key} dataKey={k.key} name={k.label} fill={colors[i]} radius={[4, 4, 0, 0]} maxBarSize={28} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [platformStats, setPlatformStats] = useState([]);
  const [projectStats, setProjectStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPlatformStats(), getProjectStats()])
      .then(([ps, proj]) => {
        setPlatformStats(ps.data.results || ps.data);
        setProjectStats(proj.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-16" />;

  const latest = platformStats[0] || null;

  // Access level distribution bars
  const accessData = (projectStats?.access_distribution || []).map(d => ({
    name: ACCESS_LABELS[d.access_level] || d.access_level,
    Projects: d.count,
  }));

  // Tech stack distribution — horizontal (labels can be long)
  const techData = (projectStats?.tech_distribution || []).map(d => ({
    name: TECH_LABELS[d.tech_stack] || d.tech_stack,
    Projects: d.count,
  }));

  // Top projects by downloads — horizontal
  const topDownloadsData = (projectStats?.top_downloads || []).map(p => ({
    name: p.project_code || p.title.slice(0, 18),
    Downloads: p.download_count,
    Views: p.view_count,
  }));

  // Top projects by views — horizontal
  const topViewsData = (projectStats?.top_views || []).map(p => ({
    name: p.project_code || p.title.slice(0, 18),
    Views: p.view_count,
    Downloads: p.download_count,
  }));

  // Downloads vs Views overview — vertical grouped
  const overviewData = [
    { name: 'Platform Totals', Downloads: projectStats?.totals?.downloads || 0, Views: projectStats?.totals?.views || 0 },
  ];

  // Platform stats trend — oldest first, max 14 entries
  const trendData = [...platformStats]
    .reverse()
    .slice(-14)
    .map(s => ({
      date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Users: s.total_users || 0,
      Downloads: s.total_downloads || 0,
      'Active Subs': s.active_subscriptions || 0,
    }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">All statistics shown as histograms for easy comparison</p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={latest?.total_users ?? '—'} icon={Users} color="blue" />
        <StatCard title="Active Subscriptions" value={latest?.active_subscriptions ?? '—'} icon={TrendingUp} color="green" />
        <StatCard title="Total Projects" value={latest?.total_projects ?? '—'} icon={Package} color="purple" />
        <StatCard
          title="Total Downloads"
          value={projectStats?.totals?.downloads ?? latest?.total_downloads ?? '—'}
          icon={Download}
          color="yellow"
        />
      </div>

      {/* Downloads vs Views overview + Access Level */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-5">Downloads vs Views</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={overviewData} margin={{ top: 16, right: 16, left: 0, bottom: 4 }} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} tickFormatter={fmt} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="Downloads" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={64}>
                <LabelList dataKey="Downloads" position="top" formatter={fmt} style={{ fontSize: 11, fill: '#3b82f6', fontWeight: 700 }} />
              </Bar>
              <Bar dataKey="Views" fill="#e2e8f0" radius={[6, 6, 0, 0]} maxBarSize={64}>
                <LabelList dataKey="Views" position="top" formatter={fmt} style={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <VerticalBarCard
          title="Projects by Access Level"
          data={accessData}
          dataKey="Projects"
          nameKey="name"
          colors={BAR_COLORS}
        />

        <HorizontalBarCard
          title="Projects by Tech Stack"
          data={techData}
          dataKey="Projects"
          nameKey="name"
          color="#8b5cf6"
          height={260}
        />
      </div>

      {/* Top projects — grouped horizontal histograms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GroupedHorizontalBarCard
          title="Top Projects by Downloads"
          data={topDownloadsData}
          keys={[{ key: 'Downloads', label: 'Downloads' }, { key: 'Views', label: 'Views' }]}
          colors={['#3b82f6', '#bfdbfe']}
          nameKey="name"
        />
        <GroupedHorizontalBarCard
          title="Top Projects by Views"
          data={topViewsData}
          keys={[{ key: 'Views', label: 'Views' }, { key: 'Downloads', label: 'Downloads' }]}
          colors={['#10b981', '#a7f3d0']}
          nameKey="name"
        />
      </div>

      {/* Platform trend over time */}
      {trendData.length > 0 && (
        <TrendBarCard
          title="Platform Growth Over Time"
          data={trendData}
          keys={[
            { key: 'Users', label: 'Users' },
            { key: 'Downloads', label: 'Downloads' },
            { key: 'Active Subs', label: 'Active Subs' },
          ]}
          colors={['#3b82f6', '#10b981', '#f59e0b']}
        />
      )}

      {/* Top downloads table */}
      {projectStats?.top_downloads?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-500" /> Detailed Rankings
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">#</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Code</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Project</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Downloads</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Views</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {projectStats.top_downloads.map((p, i) => {
                  const rate = p.view_count > 0 ? ((p.download_count / p.view_count) * 100).toFixed(1) : '0';
                  const barW = Math.min(100, parseFloat(rate));
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-gray-400 font-medium">{i + 1}</td>
                      <td className="py-3 px-3 font-mono text-xs text-blue-700 font-semibold">{p.project_code}</td>
                      <td className="py-3 px-3 font-medium text-gray-900 max-w-xs truncate">{p.title}</td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1 text-blue-600 font-semibold">
                          <Download className="w-3.5 h-3.5" />{p.download_count.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Eye className="w-3.5 h-3.5" />{p.view_count.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3 min-w-[130px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${barW}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily stats history */}
      {platformStats.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Daily Stats History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Users</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Active Subs</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Projects</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Downloads</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Revenue (TZS)</th>
                </tr>
              </thead>
              <tbody>
                {platformStats.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 text-gray-500">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="py-3 px-3 font-medium">{s.total_users ?? '—'}</td>
                    <td className="py-3 px-3 text-gray-600">{s.active_subscriptions ?? '—'}</td>
                    <td className="py-3 px-3 text-gray-600">{s.total_projects ?? '—'}</td>
                    <td className="py-3 px-3 text-gray-600">{s.total_downloads ?? '—'}</td>
                    <td className="py-3 px-3 text-gray-600">
                      {s.total_revenue ? parseFloat(s.total_revenue).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
