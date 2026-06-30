import { useEffect, useState } from 'react';
import { getAnnouncements, createAnnouncement } from '../../api/notifications';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Bell, Plus } from 'lucide-react';

const ROLES = ['student', 'developer', 'lecturer', 'admin', 'external'];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', target_roles: [], expires_at: '' });

  const fetchAnnouncements = () => {
    getAnnouncements()
      .then(r => setAnnouncements(r.data.results || r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const toggleRole = (role) => {
    setForm(f => ({
      ...f,
      target_roles: f.target_roles.includes(role)
        ? f.target_roles.filter(r => r !== role)
        : [...f.target_roles, role],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) { toast.error('Title and message required'); return; }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.expires_at) delete payload.expires_at;
      await createAnnouncement(payload);
      toast.success('Announcement created');
      setForm({ title: '', message: '', target_roles: [], expires_at: '' });
      setShowForm(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create announcement');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 border border-blue-100">
          <h3 className="font-semibold text-gray-900 mb-4">Create Announcement</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" placeholder="Announcement title" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Message *</label>
              <textarea className="input min-h-24 resize-none" placeholder="Announcement message..."
                value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Target Roles (leave empty for all)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ROLES.map(role => (
                  <button key={role} type="button" onClick={() => toggleRole(role)}
                    className={`px-3 py-1 rounded-full text-sm border capitalize transition-colors ${form.target_roles.includes(role) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Expires At (optional)</label>
              <input type="datetime-local" className="input" value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Posting...' : 'Post Announcement'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <LoadingSpinner className="py-16" /> : announcements.length === 0 ? (
        <EmptyState icon={Bell} title="No announcements" description="Create your first announcement above." />
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{a.message}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span>By {a.created_by_name}</span>
                    <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    {a.expires_at && <span>Expires {new Date(a.expires_at).toLocaleDateString()}</span>}
                  </div>
                  {a.target_roles?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.target_roles.map(r => (
                        <span key={r} className="badge badge-blue capitalize">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`badge ${a.is_active ? 'badge-green' : 'badge-gray'} shrink-0`}>
                  {a.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
