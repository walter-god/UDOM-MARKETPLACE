import { useEffect, useState } from 'react';
import { getAdminProjects, reviewProject } from '../../api/marketplace';
import client from '../../api/client';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import SourceBrowserModal from '../../components/admin/SourceBrowserModal';
import { Package, Code, Trash2 } from 'lucide-react';

const statusBadge = { draft: 'badge-gray', pending_review: 'badge-yellow', published: 'badge-green', rejected: 'badge-red', archived: 'badge-gray' };

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [browsingProject, setBrowsingProject] = useState(null);

  const fetchProjects = (status = '') => {
    setLoading(true);
    const params = status ? { status } : {};
    getAdminProjects(params)
      .then(r => setProjects(r.data.results || r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(statusFilter); }, [statusFilter]);

  const handleReview = async (id, action) => {
    try {
      await reviewProject(id, { action, notes: '' });
      toast.success(`Project ${action}d`);
      fetchProjects(statusFilter);
    } catch { toast.error('Action failed'); }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Permanently delete "${project.title}"? This cannot be undone.`)) return;
    try {
      await client.delete(`/marketplace/projects/${project.id}/update/`);
      toast.success('Project deleted');
      fetchProjects(statusFilter);
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Project Management</h1>
      <div className="card">
        <div className="flex gap-2 mb-4 flex-wrap">
          {['', 'pending_review', 'published', 'rejected', 'draft'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize border transition-colors ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        {loading ? <LoadingSpinner /> : projects.length === 0 ? (
          <EmptyState icon={Package} title="No projects" description="No projects match the selected filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Code</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Title</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Developer</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Category</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Downloads</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-mono text-xs text-blue-700 font-semibold whitespace-nowrap">{p.project_code}</td>
                    <td className="py-3 px-3 font-medium text-gray-900 max-w-xs truncate">{p.title}</td>
                    <td className="py-3 px-3 text-gray-500">{p.developer_name}</td>
                    <td className="py-3 px-3 text-gray-500">{p.category?.name || p.category_name || '—'}</td>
                    <td className="py-3 px-3">
                      <span className={`badge ${statusBadge[p.status] || 'badge-gray'}`}>
                        {p.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-500">{p.download_count}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setBrowsingProject(p)}
                          className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 rounded-lg flex items-center gap-1"
                          title="Browse source code">
                          <Code className="w-3 h-3" /> Source
                        </button>
                        {p.status === 'pending_review' && (
                          <>
                            <button onClick={() => handleReview(p.id, 'approve')}
                              className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded-lg">
                              Approve
                            </button>
                            <button onClick={() => handleReview(p.id, 'reject')}
                              className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded-lg">
                              Reject
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(p)}
                          className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded-lg flex items-center gap-1"
                          title="Delete project">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {browsingProject && (
        <SourceBrowserModal project={browsingProject} onClose={() => setBrowsingProject(null)} />
      )}
    </div>
  );
}
