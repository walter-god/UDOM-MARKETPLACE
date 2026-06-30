import { useState } from 'react';
import { Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { getSimilarTitles } from '../../api/marketplace';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  published: 'bg-green-100 text-green-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  approved: 'bg-blue-100 text-blue-700',
  draft: 'bg-gray-100 text-gray-600',
};

export default function LecturerDuplicateCheckPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim().length < 3) return;
    setLoading(true);
    try {
      const res = await getSimilarTitles(query.trim());
      setResults(res.data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Duplicate Title Check</h1>
        <p className="text-gray-500 text-sm mt-1">
          Search for existing projects with similar titles to detect possible plagiarism or duplication before approving.
        </p>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Enter a project title or keywords to check for duplicates…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              minLength={3}
              required
            />
          </div>
          <button type="submit" disabled={loading || query.trim().length < 3} className="btn-primary px-5">
            {loading ? 'Searching…' : 'Check'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">Minimum 3 characters. Searches all project titles and descriptions.</p>
      </div>

      {results !== null && (
        results.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">No similar titles found</p>
            <p className="text-gray-400 text-sm mt-1">"{query}" does not match any existing project titles.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-medium text-amber-700">{results.length} similar project{results.length !== 1 ? 's' : ''} found for "{query}"</p>
            </div>
            <div className="space-y-3">
              {results.map(r => (
                <div key={r.id} className="card border-l-4 border-amber-400">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                          {r.project_code}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900">{r.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        by <strong>{r.developer}</strong>
                        {r.reg_number && ` (${r.reg_number})`}
                        · {r.year} · {r.department}
                      </p>
                    </div>
                    <Link to={`/marketplace/${r.id}`}
                      className="shrink-0 text-xs btn-secondary py-1.5 px-3">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
