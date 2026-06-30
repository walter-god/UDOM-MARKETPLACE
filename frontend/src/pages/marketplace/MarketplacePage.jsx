import { useState, useEffect, useCallback } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { getProjects, getCategories, PROJECT_TYPES } from '../../api/marketplace';
import ProjectCard from '../../components/marketplace/ProjectCard';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2018 }, (_, i) => CURRENT_YEAR - i);
const ACCESS_LEVELS = [
  { value: 'free', label: 'Free' },
  { value: 'student', label: 'Student Plan' },
  { value: 'premium', label: 'Premium Plan' },
];
const TECH_STACKS = [
  { value: 'web', label: 'Web Application' },
  { value: 'mobile_android', label: 'Mobile (Android)' },
  { value: 'mobile_ios', label: 'Mobile (iOS)' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'api', label: 'API / Backend' },
  { value: 'ml_ai', label: 'ML / AI' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'embedded', label: 'Embedded' },
  { value: 'other', label: 'Other' },
];

const EMPTY = { search: '', author: '', keywords: '', department: '', year: '', category: '', access_level: '', tech_stack: '', project_type: '', ordering: '-created_at' };

export default function MarketplacePage() {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    getCategories().then(r => setCategories(r.data.results || r.data));
  }, []);

  const fetchProjects = useCallback(async (f) => {
    setLoading(true);
    const params = {};
    if (f.search)      params.search = f.search;
    if (f.author)      params.author = f.author;
    if (f.keywords)    params.keywords = f.keywords;
    if (f.department)  params.department = f.department;
    if (f.year)        params.year = f.year;
    if (f.category)    params.category = f.category;
    if (f.access_level) params.access_level = f.access_level;
    if (f.tech_stack)    params.tech_stack = f.tech_stack;
    if (f.project_type) params.project_type = f.project_type;
    if (f.ordering)     params.ordering = f.ordering;
    try {
      const res = await getProjects(params);
      setProjects(res.data.results || res.data);
      setPagination({ count: res.data.count || 0, next: res.data.next, previous: res.data.previous });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProjects(filters); }, [filters, fetchProjects]);

  const set = (key, value) => setFilters(f => ({ ...f, [key]: value }));
  const clearAll = () => setFilters(EMPTY);
  const activeCount = Object.entries(filters).filter(([k, v]) => v && k !== 'ordering').length;

  return (
    <Layout>
      {/* Hero search bar */}
      <div className="bg-black/45 backdrop-blur-sm text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">Browse Projects</h1>
          <p className="text-blue-200 text-center text-sm mb-6">Search by title, author, keywords, department or year</p>

          {/* Primary search row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="w-full pl-10 pr-3 py-2.5 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Search by title…"
                value={filters.search}
                onChange={e => set('search', e.target.value)} />
            </div>
            <div className="relative">
              <input className="w-full px-3 py-2.5 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Search by author name…"
                value={filters.author}
                onChange={e => set('author', e.target.value)} />
            </div>
            <div className="relative">
              <input className="w-full px-3 py-2.5 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Search by keywords (e.g. Django, React)…"
                value={filters.keywords}
                onChange={e => set('keywords', e.target.value)} />
            </div>
          </div>

          {/* Secondary search row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="w-full px-3 py-2.5 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Search by department…"
              value={filters.department}
              onChange={e => set('department', e.target.value)} />
            <select className="w-full px-3 py-2.5 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={filters.year}
              onChange={e => set('year', e.target.value)}>
              <option value="">All years</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="w-full px-3 py-2.5 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={filters.ordering}
              onChange={e => set('ordering', e.target.value)}>
              <option value="-created_at">Newest first</option>
              <option value="created_at">Oldest first</option>
              <option value="-download_count">Most downloaded</option>
              <option value="-view_count">Most viewed</option>
              <option value="year">By year (asc)</option>
              <option value="-year">By year (desc)</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>

          {activeCount > 0 && (
            <div className="flex justify-center mt-3">
              <button onClick={clearAll} className="flex items-center gap-1 text-sm text-blue-200 hover:text-white underline underline-offset-2">
                <X className="w-3.5 h-3.5" /> Clear all filters ({activeCount})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Project type tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => set('project_type', '')}
              className={`shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${!filters.project_type ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              All Projects
            </button>
            {PROJECT_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => set('project_type', filters.project_type === t.value ? '' : t.value)}
                className={`shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${filters.project_type === t.value ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">

          {/* Filter sidebar */}
          <aside className="w-full md:w-56 shrink-0">
            <div className="card">
              <button className="flex items-center justify-between w-full mb-3"
                onClick={() => setFiltersOpen(o => !o)}>
                <span className="text-sm font-semibold text-gray-700">Filters</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
              </button>

              {filtersOpen && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Category</p>
                    <div className="space-y-1">
                      <button onClick={() => set('category', '')}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded-lg ${!filters.category ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                        All Categories
                      </button>
                      {categories.map(c => (
                        <button key={c.id} onClick={() => set('category', filters.category === c.id ? '' : c.id)}
                          className={`w-full text-left text-sm px-2 py-1.5 rounded-lg ${filters.category === c.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Access Level</p>
                    <div className="space-y-1">
                      <button onClick={() => set('access_level', '')}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded-lg ${!filters.access_level ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                        All
                      </button>
                      {ACCESS_LEVELS.map(a => (
                        <button key={a.value} onClick={() => set('access_level', filters.access_level === a.value ? '' : a.value)}
                          className={`w-full text-left text-sm px-2 py-1.5 rounded-lg ${filters.access_level === a.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Project Type</p>
                    <div className="space-y-1">
                      <button onClick={() => set('project_type', '')}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded-lg ${!filters.project_type ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                        All Types
                      </button>
                      {PROJECT_TYPES.map(t => (
                        <button key={t.value} onClick={() => set('project_type', filters.project_type === t.value ? '' : t.value)}
                          className={`w-full text-left text-sm px-2 py-1.5 rounded-lg ${filters.project_type === t.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tech Stack</p>
                    <div className="space-y-1">
                      <button onClick={() => set('tech_stack', '')}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded-lg ${!filters.tech_stack ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                        All
                      </button>
                      {TECH_STACKS.map(t => (
                        <button key={t.value} onClick={() => set('tech_stack', filters.tech_stack === t.value ? '' : t.value)}
                          className={`w-full text-left text-sm px-2 py-1.5 rounded-lg ${filters.tech_stack === t.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-blue-200">
                {loading ? 'Searching…' : `${pagination.count} project${pagination.count !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {loading ? <LoadingSpinner className="py-16" /> : (
              <>
                {projects.length === 0 ? (
                  <div className="text-center py-16">
                    <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-white font-medium">No projects found</p>
                    <p className="text-blue-200 text-sm mt-1">Try different search terms or clear the filters</p>
                    {activeCount > 0 && (
                      <button onClick={clearAll} className="btn-secondary mt-4 text-sm">Clear all filters</button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {projects.map(p => <ProjectCard key={p.id} project={p} />)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
