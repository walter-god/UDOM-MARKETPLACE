import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Download, Star, Eye, Bookmark, ExternalLink, Play, Calendar, User, Lock, CheckCircle, Ban, Clock, RefreshCw, AlertTriangle, XCircle, FileCode, Smartphone, FileText } from 'lucide-react';
import { getProject, downloadProject, toggleBookmark, PROJECT_TYPES } from '../../api/marketplace';
import { getReviews, createReview } from '../../api/reviews';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-hot-toast';

const FILE_ICONS = { 'Source Code': FileCode, 'APK / App': Smartphone, 'Documentation': FileText };

function FileRow({ label, available, exists }) {
  const Icon = FILE_ICONS[label] || FileText;
  if (!exists) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 opacity-40">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-400 flex-1">{label}</span>
        <span className="text-xs text-gray-300">Not uploaded</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Icon className={`w-3.5 h-3.5 ${available ? 'text-green-500' : 'text-gray-300'}`} />
      <span className={`text-xs flex-1 ${available ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
      {available
        ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
        : <Lock className="w-3.5 h-3.5 text-gray-300" />}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [project, setProject] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    Promise.all([getProject(slug), getReviews({ project: slug })]).then(([p, r]) => {
      setProject(p.data);
      setReviews(r.data.results || r.data);
    }).finally(() => setLoading(false));
  }, [slug]);

  const handleDownload = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to download');
      navigate('/login');
      return;
    }
    if (project.has_downloaded) {
      toast.error('You have already downloaded this project. Each account is allowed one download only.');
      return;
    }
    try {
      const res = await downloadProject(project.id);
      if (res.data.download_url) window.open(res.data.download_url, '_blank');
      else toast.success('Download recorded');
      setProject(p => ({ ...p, download_count: p.download_count + 1, has_downloaded: true }));
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (err.response?.status === 409) {
        toast.error('You have already downloaded this project. Each account is allowed one download only.');
        setProject(p => ({ ...p, has_downloaded: true }));
      } else if (err.response?.status === 403) {
        if (err.response?.data?.expired) {
          toast.error('Your subscription has expired. Please renew to continue accessing this project.');
          setProject(p => ({ ...p, subscription_is_expired: true, is_subscribed: false }));
        } else {
          toast.error('Subscribe to this project to download it.');
          navigate('/checkout', {
            state: {
              projectId: project.id,
              projectSlug: project.slug,
              projectTitle: project.title,
              price: parseFloat(project.price),
            },
          });
        }
      } else {
        toast.error(detail || 'Download failed');
      }
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) { toast.error('Please login to bookmark'); return; }
    try {
      const res = await toggleBookmark(project.id);
      setProject(p => ({ ...p, is_bookmarked: res.data.bookmarked }));
    } catch { toast.error('Failed to update bookmark'); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await createReview({ ...reviewForm, project: project.id });
      toast.success('Review submitted for approval');
      setReviewForm({ rating: 5, title: '', body: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review');
    } finally { setSubmittingReview(false); }
  };

  if (loading) return <Layout><LoadingSpinner size="lg" className="py-32" /></Layout>;
  if (!project) return <Layout><div className="text-center py-32 text-gray-400">Project not found</div></Layout>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              {project.thumbnail && (
                <img src={project.thumbnail} alt={project.title} className="w-full h-64 object-cover rounded-xl mb-6" />
              )}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                      {project.project_code}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                  <p className="text-gray-500 text-sm mt-1">by {project.developer_name} • {project.year}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleBookmark} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Bookmark className={`w-5 h-5 ${project.is_bookmarked ? 'fill-blue-600 text-blue-600' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1"><Download className="w-4 h-4" />{project.download_count} downloads</span>
                <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{project.view_count} views</span>
                {project.average_rating > 0 && (
                  <span className="flex items-center gap-1 text-amber-500"><Star className="w-4 h-4 fill-current" />{project.average_rating} ({project.review_count} reviews)</span>
                )}
              </div>

              {project.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map(t => (
                    <span key={t} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium">{t}</span>
                  ))}
                </div>
              )}

              <h3 className="font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{project.description}</p>

              {/* Reviewer feedback visible to the developer */}
              {user && project.developer_id === user.id && project.status === 'rejected' && project.rejection_reason && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-semibold text-red-800 mb-1 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Rejection Reason
                  </p>
                  <p className="text-sm text-red-700">{project.rejection_reason}</p>
                  {project.reviewer_notes && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="text-xs font-medium text-red-700 mb-0.5">Reviewer Notes:</p>
                      <p className="text-sm text-red-700">{project.reviewer_notes}</p>
                    </div>
                  )}
                  {project.reviewer_name && (
                    <p className="text-xs text-red-500 mt-2">— {project.reviewer_name}</p>
                  )}
                </div>
              )}
              {user && project.developer_id === user.id && project.status !== 'rejected' && project.reviewer_notes && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm font-semibold text-blue-800 mb-1">Reviewer Notes</p>
                  <p className="text-sm text-blue-700">{project.reviewer_notes}</p>
                  {project.reviewer_name && (
                    <p className="text-xs text-blue-500 mt-2">— {project.reviewer_name}</p>
                  )}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Reviews ({project.review_count})</h3>
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-700">
                          {r.reviewer_name?.[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{r.reviewer_name}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{r.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{r.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {isAuthenticated && (
                <form onSubmit={handleReview} className="mt-6 space-y-3 border-t border-gray-100 pt-4">
                  <h4 className="font-medium text-gray-900">Leave a Review</h4>
                  <div>
                    <label className="label">Rating</label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: n }))}>
                          <Star className={`w-6 h-6 ${n <= reviewForm.rating ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Title</label>
                    <input className="input" placeholder="Review title" value={reviewForm.title}
                      onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">Review</label>
                    <textarea className="input min-h-20 resize-none" placeholder="Share your experience..."
                      value={reviewForm.body} onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))} required />
                  </div>
                  <button type="submit" disabled={submittingReview} className="btn-primary">
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card">
              {(() => {
                const typeMeta = PROJECT_TYPES.find(t => t.value === project.project_type);
                return typeMeta ? (
                  <div className="mb-4">
                    <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full ${typeMeta.color}`}>
                      {typeMeta.label}
                    </span>
                  </div>
                ) : null;
              })()}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Access</span>
                  <span className="font-medium capitalize">{project.access_level}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium">{project.category?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tech Stack</span>
                  <span className="font-medium capitalize">{project.tech_stack?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Version</span>
                  <span className="font-medium">v{project.version}</span>
                </div>
              </div>

              {parseFloat(project.price) > 0 ? (
                project.is_subscribed ? (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-sm font-medium mb-2">
                      <CheckCircle className="w-4 h-4" /> Active Access
                    </div>
                    {project.subscription_expires_at && (
                      <div className="text-xs text-gray-500 flex items-center gap-1.5 px-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        {project.subscription_days_remaining > 0
                          ? `${project.subscription_days_remaining} day${project.subscription_days_remaining !== 1 ? 's' : ''} remaining`
                          : 'Expires today'} · {new Date(project.subscription_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                ) : project.subscription_is_expired ? (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg px-3 py-2 text-sm font-medium mb-1">
                      <AlertTriangle className="w-4 h-4" /> Subscription Expired
                    </div>
                    <p className="text-xs text-gray-400 px-1">Renew to regain access and download.</p>
                  </div>
                ) : (
                  <div className="mb-3">
                    <p className="text-2xl font-bold text-blue-700">TZS {parseFloat(project.price).toLocaleString()}<span className="text-sm text-gray-400 font-normal">/mo</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">Time-limited access · choose duration at checkout</p>
                  </div>
                )
              ) : (
                <p className="text-sm text-green-600 font-medium mb-3">Free</p>
              )}

              <div className="space-y-2">
                {!isAuthenticated ? (
                  <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2 text-center">
                    Login to Access
                  </Link>
                ) : parseFloat(project.price) > 0 && project.subscription_is_expired ? (
                  <button
                    onClick={() => navigate('/checkout', {
                      state: {
                        projectId: project.id, projectSlug: project.slug,
                        projectTitle: project.title, price: parseFloat(project.price),
                      }
                    })}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4" /> Renew Access
                  </button>
                ) : parseFloat(project.price) > 0 && !project.is_subscribed ? (
                  <button
                    onClick={() => navigate('/checkout', {
                      state: {
                        projectId: project.id, projectSlug: project.slug,
                        projectTitle: project.title, price: parseFloat(project.price),
                      }
                    })}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" /> Get Access
                  </button>
                ) : project.has_downloaded ? (
                  <div className="w-full flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-500 font-medium py-2.5 px-4 rounded-lg text-sm cursor-not-allowed">
                      <Ban className="w-4 h-4" /> Already Downloaded
                    </div>
                    <p className="text-xs text-gray-400 text-center">Each account is limited to one download per project.</p>
                  </div>
                ) : (
                  <button onClick={handleDownload} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Download Project
                  </button>
                )}
                {/* File access panel */}
                {isAuthenticated && project.file_access && (
                  <div className="mt-2 rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-100">
                      Files included in your download
                    </div>
                    <div className="divide-y divide-gray-100">
                      <FileRow label="Source Code" available={project.file_access.source_code} exists={project.file_access.has_source} />
                      <FileRow label="APK / App" available={project.file_access.apk} exists={project.file_access.has_apk} />
                      <FileRow label="Documentation" available={project.file_access.documentation} exists={project.file_access.has_docs} />
                    </div>
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs text-gray-500">{project.file_access.access_label}</p>
                    </div>
                  </div>
                )}
                {project.demo_url && (
                  <a href={project.demo_url} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary w-full flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Live Demo
                  </a>
                )}
                {project.demo_video_url && (
                  <a href={project.demo_video_url} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary w-full flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" /> Watch Demo
                  </a>
                )}
              </div>
            </div>

            <div className="card">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Developer</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                  {project.developer_name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{project.developer_name}</p>
                  {project.department && <p className="text-xs text-gray-500">{project.department}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
