import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Download, ExternalLink } from 'lucide-react';
import { getSupervisedProjects } from '../../api/marketplace';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const STATUS_COLORS = {
  published: 'bg-green-100 text-green-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  approved: 'bg-blue-100 text-blue-700',
  draft: 'bg-gray-100 text-gray-600',
};

export default function LecturerSupervisedPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getSupervisedProjects({ search })
      .then(r => setProjects(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  const reload = (q) => {
    setLoading(true);
    getSupervisedProjects({ search: q })
      .then(r => setProjects(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Supervised Students</h1>
        <p className="text-gray-500 text-sm mt-1">Projects where you are assigned as supervisor</p>
      </div>

      <div className="card mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by title, student name, or registration number…"
            value={search}
            onChange={e => { setSearch(e.target.value); reload(e.target.value); }}
          />
        </div>
      </div>

      {loading ? <LoadingSpinner className="py-16" /> : projects.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No supervised projects found</p>
          <p className="text-gray-400 text-sm mt-1">
            Assign yourself as supervisor from a project's detail page.
          </p>
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
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 truncate">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <strong>{p.developer_name}</strong>
                    {p.developer_registration_number && ` (${p.developer_registration_number})`}
                    · {p.year} · {p.department}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">
                    {p.project_type?.replace('_', ' ')} · {p.tech_stack?.replace('_', ' ')}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col gap-1.5">
                  <Link to={`/marketplace/${p.slug}`}
                    className="text-xs btn-secondary flex items-center gap-1 py-1.5 px-3">
                    <ExternalLink className="w-3 h-3" /> View
                  </Link>
                  {p.status === 'pending_review' && (
                    <Link to={`/lecturer/pending/${p.id}`}
                      className="text-xs btn-primary flex items-center gap-1 py-1.5 px-3">
                      Review
                    </Link>
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
