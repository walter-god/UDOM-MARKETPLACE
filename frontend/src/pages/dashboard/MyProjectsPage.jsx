import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Download, Clock, Package, Lock } from 'lucide-react';
import { getMyProjects, updateProject } from '../../api/marketplace';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { toast } from 'react-hot-toast';
import client from '../../api/client';
import useAuthStore from '../../store/authStore';

const statusBadge = {
  draft: 'badge-gray',
  pending_review: 'badge-yellow',
  published: 'badge-green',
  rejected: 'badge-red',
  archived: 'badge-gray',
};

const statusLabel = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
  rejected: 'Rejected',
  archived: 'Archived',
};

export default function MyProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const fetchProjects = () => {
    setLoading(true);
    getMyProjects()
      .then(r => setProjects(r.data.results || r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    try {
      await client.delete(`/marketplace/projects/${project.id}/update/`);
      toast.success('Project deleted');
      fetchProjects();
    } catch { toast.error('Failed to delete project'); }
  };

  if (loading) return <LoadingSpinner className="py-16" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <Link to="/dashboard/upload" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Upload Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No projects yet"
          description="Upload your first final year project to share it with the UDOM community."
          action={
            <Link to="/dashboard/upload" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Upload Your First Project
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Thumbnail or placeholder */}
                <div className="w-20 h-16 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {p.thumbnail
                    ? <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
                    : <span className="text-2xl font-bold text-blue-200">{p.title[0]}</span>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {p.category_name || '—'} • {p.year} • {p.tech_stack?.replace('_', ' ')}
                      </p>
                    </div>
                    <span className={`badge ${statusBadge[p.status] || 'badge-gray'} shrink-0`}>
                      {statusLabel[p.status] || p.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">{p.short_description}</p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" />{p.download_count} downloads</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.view_count} views</span>
                    {p.status === 'pending_review' && (
                      <span className="flex items-center gap-1 text-yellow-600"><Clock className="w-3 h-3" />Awaiting review</span>
                    )}
                    {p.status === 'rejected' && (
                      <span className="text-red-500">Rejected — edit and resubmit</span>
                    )}
                    {(p.status === 'published' || p.status === 'approved') && !isAdmin && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <Lock className="w-3 h-3" />Locked — approved projects cannot be edited
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {p.status === 'published' && (
                    <Link to={`/marketplace/${p.slug}`} target="_blank"
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View public page">
                      <Eye className="w-4 h-4" />
                    </Link>
                  )}
                  {p.status === 'published' || p.status === 'approved' ? (
                    <span
                      className="p-2 text-gray-300 cursor-not-allowed rounded-lg"
                      title="Published projects cannot be edited">
                      <Lock className="w-4 h-4" />
                    </span>
                  ) : (
                    <Link to={`/dashboard/projects/${p.id}/edit`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit project">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleDelete(p)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete project">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
