import { Link } from 'react-router-dom';
import { Download, Eye, Star, Bookmark, Lock } from 'lucide-react';
import { toggleBookmark, PROJECT_TYPES } from '../../api/marketplace';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const accessBadge = {
  free: { label: 'Free', class: 'badge-green' },
  student: { label: 'Student', class: 'badge-blue' },
  premium: { label: 'Premium', class: 'badge-yellow' },
  institutional: { label: 'Institutional', class: 'badge-red' },
};

const projectTypeMap = Object.fromEntries(PROJECT_TYPES.map(t => [t.value, t]));

export default function ProjectCard({ project, onBookmarkToggle }) {
  const { isAuthenticated } = useAuthStore();
  const badge = accessBadge[project.access_level] || accessBadge.free;
  const typeMeta = projectTypeMap[project.project_type];

  const handleBookmark = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to bookmark projects'); return; }
    try {
      const res = await toggleBookmark(project.id);
      onBookmarkToggle?.(project.id, res.data.bookmarked);
    } catch { toast.error('Failed to update bookmark'); }
  };

  return (
    <Link to={`/marketplace/${project.slug}`} className="card hover:shadow-md transition-shadow group block">
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mb-4 overflow-hidden">
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-4xl font-bold text-blue-200">{project.title[0]}</div>
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className={badge.class}>{badge.label}</span>
          {typeMeta && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeMeta.color}`}>
              {typeMeta.short}
            </span>
          )}
        </div>
        {project.access_level !== 'free' && (
          <div className="absolute top-2 right-2 p-1 bg-white/90 rounded-full">
            <Lock className="w-3 h-3 text-gray-500" />
          </div>
        )}
        {isAuthenticated && (
          <button onClick={handleBookmark}
            className="absolute bottom-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow transition-colors">
            <Bookmark className={`w-3.5 h-3.5 ${project.is_bookmarked ? 'fill-blue-600 text-blue-600' : 'text-gray-400'}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors line-clamp-1">
            {project.title}
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-2">by {project.developer_name}</p>
        <p className="text-xs text-gray-600 line-clamp-2 mb-3">{project.short_description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Download className="w-3 h-3" />{project.download_count}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{project.view_count}</span>
            {project.average_rating > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="w-3 h-3 fill-current" />{project.average_rating}
              </span>
            )}
          </div>
          {parseFloat(project.price) > 0 ? (
            <span className="text-xs font-semibold text-blue-700">TZS {parseFloat(project.price).toLocaleString()}</span>
          ) : (
            <span className="text-xs font-semibold text-green-600">Free</span>
          )}
        </div>
      </div>
    </Link>
  );
}
