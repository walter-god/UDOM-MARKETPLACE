import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft, Download, FileText, User, Calendar } from 'lucide-react';
import { getPendingProjects, reviewProject, assignSupervisor, getSourceTree } from '../../api/marketplace';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

function StatusBadge({ status }) {
  const map = {
    pending_review: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    approved: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function ReviewForm({ project, onDone }) {
  const [action, setAction] = useState('approve');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sourceFiles, setSourceFiles] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);

  useEffect(() => {
    if (project.source_code || project.id) {
      setSourceLoading(true);
      getSourceTree(project.id)
        .then(r => setSourceFiles(r.data.files || []))
        .catch(() => {})
        .finally(() => setSourceLoading(false));
    }
  }, [project.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (action === 'reject' && !reason.trim()) {
      toast.error('Provide a rejection reason');
      return;
    }
    setSubmitting(true);
    try {
      await reviewProject(project.id, { action, notes, reason });
      toast.success(`Project ${action === 'approve' ? 'approved and published' : 'rejected'}`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Review failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSupervisor = async () => {
    try {
      const res = await assignSupervisor(project.id);
      toast.success(res.data.detail);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to assign');
    }
  };

  return (
    <div className="space-y-6">
      {/* Project info */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                {project.project_code}
              </span>
              <StatusBadge status={project.status} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{project.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              by <strong>{project.developer_name}</strong>
              {project.developer_registration_number && ` (${project.developer_registration_number})`}
              · {project.year} · {project.department}
            </p>
          </div>
          <button onClick={handleAssignSupervisor}
            className="shrink-0 text-xs btn-secondary flex items-center gap-1.5">
            <User className="w-3 h-3" /> Assign Me as Supervisor
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div><span className="text-gray-500">Category:</span> <strong>{project.category?.name}</strong></div>
          <div><span className="text-gray-500">Tech Stack:</span> <strong className="capitalize">{project.tech_stack?.replace('_', ' ')}</strong></div>
          <div><span className="text-gray-500">Type:</span> <strong>{project.project_type?.toUpperCase()}</strong></div>
          <div><span className="text-gray-500">Access:</span> <strong className="capitalize">{project.access_level}</strong></div>
        </div>

        {project.technologies?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.technologies.map(t => (
              <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{t}</span>
            ))}
          </div>
        )}

        <h4 className="font-medium text-gray-900 mb-1">Description</h4>
        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{project.description}</p>
      </div>

      {/* Source file tree */}
      {sourceFiles.length > 0 && (
        <div className="card">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" /> Source Code Structure ({sourceFiles.length} files)
          </h4>
          <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs text-gray-700 space-y-0.5">
            {sourceFiles.map(f => <div key={f}>{f}</div>)}
          </div>
        </div>
      )}
      {sourceLoading && <div className="card"><LoadingSpinner className="py-4" /></div>}

      {/* File downloads */}
      <div className="card">
        <h4 className="font-medium text-gray-900 mb-3">Project Files</h4>
        <div className="space-y-2">
          {project.source_code && (
            <a href={project.source_code} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
              <Download className="w-4 h-4" /> Download Source Code
            </a>
          )}
          {project.apk_file && (
            <a href={project.apk_file} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
              <Download className="w-4 h-4" /> Download APK
            </a>
          )}
          {project.documentation && (
            <a href={project.documentation} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
              <Download className="w-4 h-4" /> Download Documentation
            </a>
          )}
          {!project.source_code && !project.apk_file && !project.documentation && (
            <p className="text-sm text-gray-400">No files uploaded.</p>
          )}
        </div>
      </div>

      {/* Review form */}
      <div className="card">
        <h4 className="font-medium text-gray-900 mb-4">Submit Review Decision</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              action === 'approve' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
              <input type="radio" name="action" value="approve" checked={action === 'approve'}
                onChange={() => setAction('approve')} className="accent-green-600" />
              <CheckCircle className={`w-5 h-5 ${action === 'approve' ? 'text-green-600' : 'text-gray-300'}`} />
              <span className={`font-medium text-sm ${action === 'approve' ? 'text-green-800' : 'text-gray-600'}`}>Approve & Publish</span>
            </label>
            <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              action === 'reject' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'}`}>
              <input type="radio" name="action" value="reject" checked={action === 'reject'}
                onChange={() => setAction('reject')} className="accent-red-600" />
              <XCircle className={`w-5 h-5 ${action === 'reject' ? 'text-red-600' : 'text-gray-300'}`} />
              <span className={`font-medium text-sm ${action === 'reject' ? 'text-red-800' : 'text-gray-600'}`}>Reject</span>
            </label>
          </div>

          {action === 'reject' && (
            <div>
              <label className="label">Rejection Reason *</label>
              <textarea className="input min-h-20 resize-none" placeholder="Explain why the project is being rejected..."
                value={reason} onChange={e => setReason(e.target.value)} required />
            </div>
          )}

          <div>
            <label className="label">Reviewer Notes / Feedback (sent to developer)</label>
            <textarea className="input min-h-24 resize-none"
              placeholder="Additional feedback, suggestions, or comments for the developer..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <button type="submit" disabled={submitting}
            className={`w-full flex items-center justify-center gap-2 py-2.5 font-semibold rounded-lg transition-colors text-sm ${
              action === 'approve'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            } disabled:opacity-60`}>
            {submitting ? 'Submitting…' : action === 'approve' ? 'Approve & Publish Project' : 'Reject Project'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LecturerPendingPage() {
  const { pk } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getPendingProjects()
      .then(r => {
        const list = r.data.results || r.data;
        setProjects(list);
        if (pk) setSelected(list.find(p => p.id === pk) || null);
      })
      .catch(() => toast.error('Failed to load pending projects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [pk]);

  if (loading) return <LoadingSpinner className="py-16" />;

  if (selected) {
    return (
      <div className="max-w-3xl">
        <button onClick={() => navigate('/lecturer/pending')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to pending list
        </button>
        <ReviewForm project={selected} onDone={() => { setSelected(null); load(); navigate('/lecturer/pending'); }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Review</h1>
        <p className="text-gray-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} awaiting review</p>
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle className="w-12 h-12 text-green-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No projects are pending review right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                      {p.project_code}
                    </span>
                    <span className="text-xs capitalize text-gray-500">{p.project_type}</span>
                  </div>
                  <p className="font-semibold text-gray-900 truncate">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    by {p.developer_name} · {p.year} · {p.category_name}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                  <Link to={`/lecturer/pending/${p.id}`}
                    className="btn-primary text-xs py-1.5 px-3">
                    Review
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
