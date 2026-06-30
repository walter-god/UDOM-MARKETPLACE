import { useEffect, useState } from 'react';
import { Activity, Search } from 'lucide-react';
import { getAuditLogs } from '../../api/auth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const actionColors = {
  login: 'badge-green',
  logout: 'badge-gray',
  failed_login: 'badge-red',
  password_change: 'badge-yellow',
  profile_update: 'badge-blue',
  payment: 'badge-green',
  subscription: 'badge-blue',
  project_upload: 'badge-purple',
  project_download: 'badge-blue',
  admin_action: 'badge-red',
};

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = (params = {}) => {
    setLoading(true);
    getAuditLogs(params)
      .then(r => setLogs(r.data.results || r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleFilter = () => {
    const params = {};
    if (actionFilter) params.action = actionFilter;
    fetchLogs(params);
  };

  useEffect(() => { handleFilter(); }, [actionFilter]);

  const actions = [
    '', 'login', 'logout', 'failed_login', 'password_change',
    'profile_update', 'payment', 'subscription', 'project_upload',
    'project_download', 'admin_action',
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity Logs</h1>
      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search by user or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-48"
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          >
            {actions.map(a => (
              <option key={a} value={a}>{a ? a.replace(/_/g, ' ') : 'All Actions'}</option>
            ))}
          </select>
        </div>

        {loading ? <LoadingSpinner /> : logs.length === 0 ? (
          <EmptyState icon={Activity} title="No logs found" description="No activity matches the selected filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">User</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Action</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Description</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">IP Address</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs
                  .filter(l =>
                    !search ||
                    l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
                    l.description?.toLowerCase().includes(search.toLowerCase())
                  )
                  .map(l => (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 text-gray-700 font-medium">{l.user_email || '—'}</td>
                      <td className="py-3 px-3">
                        <span className={`badge ${actionColors[l.action] || 'badge-gray'}`}>
                          {l.action?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-500 max-w-xs truncate">{l.description}</td>
                      <td className="py-3 px-3 text-gray-400 font-mono text-xs">{l.ip_address || '—'}</td>
                      <td className="py-3 px-3 text-gray-400 whitespace-nowrap">
                        {new Date(l.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
