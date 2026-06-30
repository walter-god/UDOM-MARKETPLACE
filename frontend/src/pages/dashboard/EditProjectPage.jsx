import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, X, Upload, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { updateProject, getCategories, checkProjectTitle, PROJECT_TYPES } from '../../api/marketplace';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import client from '../../api/client';

const TECH_STACKS = [
  { value: 'web', label: 'Web Application' },
  { value: 'mobile_android', label: 'Mobile (Android)' },
  { value: 'mobile_ios', label: 'Mobile (iOS)' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'api', label: 'API/Backend' },
  { value: 'ml_ai', label: 'ML/AI' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'embedded', label: 'Embedded Systems' },
  { value: 'other', label: 'Other' },
];

export default function EditProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [newFiles, setNewFiles] = useState({ thumbnail: null, source_code: null, apk_file: null, documentation: null });
  const [titleStatus, setTitleStatus] = useState(null);
  const [titleMessage, setTitleMessage] = useState('');
  const titleDebounce = useRef(null);

  useEffect(() => {
    Promise.all([
      client.get(`/marketplace/projects/${id}/update/`),
      getCategories(),
    ]).then(([proj, cats]) => {
      const p = proj.data;
      if (p.status === 'published' || p.status === 'approved') {
        setIsLocked(true);
      }
      setForm({
        title: p.title || '',
        short_description: p.short_description || '',
        description: p.description || '',
        category: p.category?.id || p.category || '',
        department: p.department || '',
        tech_stack: p.tech_stack || 'other',
        project_type: p.project_type || 'fyp',
        technologies: Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || ''),
        access_level: p.access_level || 'free',
        price: p.price || 0,
        year: p.year || new Date().getFullYear(),
        version: p.version || '1.0.0',
        demo_url: p.demo_url || '',
        demo_video_url: p.demo_video_url || '',
        existing_thumbnail: p.thumbnail || null,
        existing_source_code: p.source_code || null,
        existing_documentation: p.documentation || null,
      });
      setCategories(cats.data.results || cats.data);
    }).catch(() => {
      toast.error('Project not found or access denied');
      navigate('/dashboard/projects');
    }).finally(() => setLoading(false));
  }, [id, navigate]);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setForm(f => ({ ...f, title: value }));
    setTitleStatus(null);
    setTitleMessage('');
    clearTimeout(titleDebounce.current);
    if (!value.trim()) return;
    setTitleStatus('checking');
    titleDebounce.current = setTimeout(async () => {
      try {
        const res = await checkProjectTitle(value.trim(), id);
        if (res.data.available) {
          setTitleStatus('available');
          setTitleMessage('Title is available');
        } else {
          setTitleStatus('taken');
          setTitleMessage(res.data.detail);
        }
      } catch {
        setTitleStatus(null);
      }
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (titleStatus === 'taken') {
      toast.error('Please choose a different project title.');
      return;
    }
    setSaving(true);
    const data = new FormData();
    const { existing_thumbnail, existing_source_code, existing_documentation, technologies, ...rest } = form;
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) data.append(k, v);
    });
    const techs = technologies.split(',').map(t => t.trim()).filter(Boolean);
    data.append('technologies', JSON.stringify(techs));
    Object.entries(newFiles).forEach(([k, f]) => { if (f) data.append(k, f); });

    try {
      await updateProject(id, data);
      toast.success('Project updated and resubmitted for review');
      navigate('/dashboard/projects');
    } catch (err) {
      const errs = err.response?.data;
      const msg = errs ? Object.values(errs).flat()[0] : 'Update failed';
      toast.error(typeof msg === 'string' ? msg : 'Update failed');
    } finally { setSaving(false); }
  };

  if (loading || !form) return <LoadingSpinner className="py-16" />;

  if (isLocked) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Lock className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Project is Published</h2>
        <p className="text-gray-500 text-sm mb-6">
          <span className="font-medium text-gray-700">{form.title}</span> has been approved and published.
          Published projects are locked and cannot be edited to preserve their integrity.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/dashboard/projects')} className="btn-secondary">
            Back to My Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
        <p className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5">
          Saving will resubmit the project for review
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Basic Information</h3>
          <div>
            <label className="label">Project Title *</label>
            <div className="relative">
              <input
                type="text"
                className={`input pr-9 ${titleStatus === 'taken' ? 'border-red-400 focus:ring-red-300' : titleStatus === 'available' ? 'border-green-400 focus:ring-green-300' : ''}`}
                value={form.title}
                onChange={handleTitleChange}
                required
              />
              {titleStatus === 'checking' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              )}
              {titleStatus === 'available' && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
              {titleStatus === 'taken' && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
            </div>
            {titleMessage && (
              <p className={`text-xs mt-1 ${titleStatus === 'taken' ? 'text-red-600' : 'text-green-600'}`}>
                {titleMessage}
              </p>
            )}
          </div>
          <div>
            <label className="label">Short Description *</label>
            <input type="text" className="input" maxLength={300} value={form.short_description} onChange={set('short_description')} required />
          </div>
          <div>
            <label className="label">Full Description *</label>
            <textarea className="input min-h-32 resize-none" value={form.description} onChange={set('description')} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select className="input" value={form.category} onChange={set('category')} required>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <input type="text" className="input" placeholder="e.g. Computer Science" value={form.department} onChange={set('department')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Project Type *</label>
              <select className="input" value={form.project_type} onChange={set('project_type')} required>
                {PROJECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tech Stack *</label>
              <select className="input" value={form.tech_stack} onChange={set('tech_stack')}>
                {TECH_STACKS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Year *</label>
              <input type="number" className="input" min="2000" max="2030" value={form.year} onChange={set('year')} required />
            </div>
            <div>
              <label className="label">Version</label>
              <input type="text" className="input" value={form.version} onChange={set('version')} />
            </div>
          </div>
          <div>
            <label className="label">Technologies / Keywords (comma-separated)</label>
            <input type="text" className="input" placeholder="React, Django, PostgreSQL" value={form.technologies} onChange={set('technologies')} />
          </div>
        </div>

        {/* Access & Pricing */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Access & Pricing</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Access Level *</label>
              <select className="input" value={form.access_level} onChange={set('access_level')}>
                <option value="free">Free</option>
                <option value="student">Student Plan</option>
                <option value="premium">Premium Plan</option>
                <option value="institutional">Institutional</option>
              </select>
            </div>
            {form.access_level !== 'free' && (
              <div>
                <label className="label">Price (TZS)</label>
                <input type="number" className="input" min="0" value={form.price} onChange={set('price')} />
              </div>
            )}
          </div>
        </div>

        {/* Links */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Links</h3>
          <div>
            <label className="label">Demo URL</label>
            <input type="url" className="input" placeholder="https://…" value={form.demo_url} onChange={set('demo_url')} />
          </div>
          <div>
            <label className="label">Demo Video URL</label>
            <input type="url" className="input" placeholder="https://youtube.com/…" value={form.demo_video_url} onChange={set('demo_video_url')} />
          </div>
        </div>

        {/* Files */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Files</h3>
          <p className="text-xs text-gray-500">Leave blank to keep existing files.</p>
          {[
            { key: 'thumbnail', label: 'Thumbnail Image', accept: 'image/*', existing: form.existing_thumbnail },
            { key: 'source_code', label: 'Source Code (ZIP)', accept: '.zip,.tar.gz', existing: form.existing_source_code },
            { key: 'documentation', label: 'Documentation (PDF)', accept: '.pdf', existing: form.existing_documentation },
            { key: 'apk_file', label: 'APK File', accept: '.apk', existing: null },
          ].map(({ key, label, accept, existing }) => (
            <div key={key}>
              <label className="label">{label}</label>
              {existing && !newFiles[key] && (
                <p className="text-xs text-green-600 mb-1">✓ File already uploaded</p>
              )}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center hover:border-blue-300 transition-colors">
                {newFiles[key] ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{newFiles[key].name}</span>
                    <button type="button" onClick={() => setNewFiles(f => ({ ...f, [key]: null }))}
                      className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                    <span className="text-xs text-gray-400">Click to replace {label}</span>
                    <input type="file" accept={accept} className="hidden"
                      onChange={e => setNewFiles(f => ({ ...f, [key]: e.target.files[0] }))} />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save & Resubmit'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard/projects')} className="btn-secondary flex items-center gap-2">
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
