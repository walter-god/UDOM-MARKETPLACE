import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { createProject, getCategories, checkProjectTitle, PROJECT_TYPES } from '../../api/marketplace';

export default function UploadProjectPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [titleStatus, setTitleStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [titleMessage, setTitleMessage] = useState('');
  const titleDebounce = useRef(null);
  const [form, setForm] = useState({
    title: '', description: '', short_description: '', category: '',
    department: '', tech_stack: 'other', project_type: 'fyp', access_level: 'free',
    price: 0, year: new Date().getFullYear(), version: '1.0.0',
    demo_url: '', demo_video_url: '',
    technologies: '',
  });
  const [files, setFiles] = useState({ thumbnail: null, source_code: null, apk_file: null, documentation: null });

  useEffect(() => { getCategories().then(r => setCategories(r.data.results || r.data)); }, []);

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }));

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, title: value }));
    setTitleStatus(null);
    setTitleMessage('');
    clearTimeout(titleDebounce.current);
    if (!value.trim()) return;
    setTitleStatus('checking');
    titleDebounce.current = setTimeout(async () => {
      try {
        const res = await checkProjectTitle(value.trim());
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
    setLoading(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'technologies') {
        const techs = v.split(',').map(t => t.trim()).filter(Boolean);
        data.append(k, JSON.stringify(techs));
      } else if (v !== '' && v !== null) {
        data.append(k, v);
      }
    });
    Object.entries(files).forEach(([k, f]) => { if (f) data.append(k, f); });

    if (titleStatus === 'taken') {
      toast.error('Please choose a different project title.');
      setLoading(false);
      return;
    }
    try {
      await createProject(data);
      toast.success('Project submitted for review!');
      navigate('/dashboard/projects');
    } catch (err) {
      console.error('Upload error:', err.response?.data);
      const errs = err.response?.data;
      if (errs && typeof errs === 'object' && !Array.isArray(errs)) {
        const messages = Object.entries(errs).map(([k, v]) =>
          `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
        );
        toast.error(messages[0] || 'Upload failed', { duration: 6000 });
      } else if (typeof errs === 'string') {
        toast.error(errs.slice(0, 300));
      } else {
        toast.error(`Upload failed (${err.response?.status || 'network error'})`);
      }
    } finally { setLoading(false); }
  };

  const techStacks = [
    { value: 'web', label: 'Web Application' }, { value: 'mobile_android', label: 'Mobile (Android)' },
    { value: 'mobile_ios', label: 'Mobile (iOS)' }, { value: 'desktop', label: 'Desktop' },
    { value: 'api', label: 'API/Backend' }, { value: 'ml_ai', label: 'ML/AI' },
    { value: 'data_science', label: 'Data Science' }, { value: 'embedded', label: 'Embedded Systems' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Project</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Basic Information</h3>
          <div>
            <label className="label">Project Title *</label>
            <div className="relative">
              <input
                type="text"
                className={`input pr-9 ${titleStatus === 'taken' ? 'border-red-400 focus:ring-red-300' : titleStatus === 'available' ? 'border-green-400 focus:ring-green-300' : ''}`}
                placeholder="My Awesome Project"
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
            <input type="text" className="input" maxLength={300} placeholder="Brief overview (max 300 chars)" value={form.short_description} onChange={set('short_description')} required />
          </div>
          <div>
            <label className="label">Full Description *</label>
            <textarea className="input min-h-32 resize-none" placeholder="Detailed description..." value={form.description} onChange={set('description')} required />
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
                {techStacks.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
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
              <input type="text" className="input" placeholder="1.0.0" value={form.version} onChange={set('version')} />
            </div>
          </div>
          <div>
            <label className="label">Technologies (comma-separated)</label>
            <input type="text" className="input" placeholder="React, Django, PostgreSQL" value={form.technologies} onChange={set('technologies')} />
          </div>
        </div>

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

        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Links</h3>
          <div>
            <label className="label">Demo URL</label>
            <input type="url" className="input" placeholder="https://..." value={form.demo_url} onChange={set('demo_url')} />
          </div>
          <div>
            <label className="label">Demo Video URL</label>
            <input type="url" className="input" placeholder="https://youtube.com/..." value={form.demo_video_url} onChange={set('demo_video_url')} />
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Files</h3>
          {[
            { key: 'thumbnail', label: 'Thumbnail Image', accept: 'image/*' },
            { key: 'source_code', label: 'Source Code (ZIP)', accept: '.zip,.tar.gz' },
            { key: 'apk_file', label: 'APK File', accept: '.apk' },
            { key: 'documentation', label: 'Documentation (PDF)', accept: '.pdf' },
          ].map(({ key, label, accept }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-blue-300 transition-colors">
                {files[key] ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{files[key].name}</span>
                    <button type="button" onClick={() => setFiles(f => ({ ...f, [key]: null }))} className="text-red-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    <span className="text-xs text-gray-400">Click to upload {label}</span>
                    <input type="file" accept={accept} className="hidden"
                      onChange={e => setFiles(f => ({ ...f, [key]: e.target.files[0] }))} />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {loading ? 'Uploading...' : 'Submit for Review'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
