import { useEffect, useState } from 'react';
import { getBookmarks } from '../../api/marketplace';
import ProjectCard from '../../components/marketplace/ProjectCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookmarks().then(r => setBookmarks(r.data.results || r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-16" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bookmarks ({bookmarks.length})</h1>
      {bookmarks.length === 0 ? (
        <EmptyState icon={Bookmark} title="No bookmarks yet"
          description="Browse the marketplace and bookmark projects you want to revisit"
          action={<Link to="/marketplace" className="btn-primary">Browse Marketplace</Link>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {bookmarks.map(b => <ProjectCard key={b.id} project={b.project} />)}
        </div>
      )}
    </div>
  );
}
