import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Download, ShoppingBag, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { getMyProjectSubscriptions } from '../../api/marketplace';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function SubscriptionPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMyProjectSubscriptions()
      .then(r => setSubscriptions(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-16" />;

  const active = subscriptions.filter(s => s.is_active);
  const expired = subscriptions.filter(s => !s.is_active);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
          <p className="text-gray-500 text-sm mt-1">Software you have purchased access to</p>
        </div>
        <Link to="/marketplace" className="btn-secondary flex items-center gap-2 text-sm">
          <ShoppingBag className="w-4 h-4" /> Browse Projects
        </Link>
      </div>

      {subscriptions.length === 0 ? (
        <div className="card text-center py-16">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">No subscriptions yet</p>
          <p className="text-gray-400 text-sm mb-4">Browse the marketplace and get access to projects you need.</p>
          <Link to="/marketplace" className="btn-primary inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" /> Active ({active.length})
              </h2>
              <div className="space-y-3">
                {active.map(sub => (
                  <SubCard key={sub.id} sub={sub} navigate={navigate} />
                ))}
              </div>
            </section>
          )}

          {expired.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" /> Expired ({expired.length})
              </h2>
              <div className="space-y-3">
                {expired.map(sub => (
                  <SubCard key={sub.id} sub={sub} navigate={navigate} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SubCard({ sub, navigate }) {
  const isActive = sub.is_active;
  const expiresDate = sub.expires_at
    ? new Date(sub.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className={`card hover:shadow-md transition-shadow ${!isActive ? 'opacity-80' : ''}`}>
      <div className="flex items-center gap-4">
        <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shrink-0 overflow-hidden">
          {sub.project_thumbnail
            ? <img src={sub.project_thumbnail} alt={sub.project_title} className="w-full h-full object-cover" />
            : <Package className="w-5 h-5 text-blue-300" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{sub.project_title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            by {sub.developer_name} · {sub.project_tech_stack?.replace('_', ' ')}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-xs text-gray-400">
              TZS {parseFloat(sub.amount_paid).toLocaleString()} · {sub.duration_days}d plan
            </p>
            {expiresDate && (
              <p className={`text-xs flex items-center gap-1 ${isActive ? 'text-blue-600' : 'text-red-500'}`}>
                <Clock className="w-3 h-3" />
                {isActive
                  ? `${sub.days_remaining} day${sub.days_remaining !== 1 ? 's' : ''} left · expires ${expiresDate}`
                  : `Expired ${expiresDate}`}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          {isActive ? (
            <>
              <span className="badge badge-green text-xs">Active</span>
              <Link
                to={`/marketplace/${sub.project_slug}`}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                <Download className="w-3 h-3" /> Download
              </Link>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> Expired
              </span>
              <button
                onClick={() => navigate('/checkout', {
                  state: {
                    projectId: sub.project_id,
                    projectSlug: sub.project_slug,
                    projectTitle: sub.project_title,
                    price: parseFloat(sub.project_price),
                  },
                })}
                className="text-xs py-1.5 px-3 flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors">
                <RefreshCw className="w-3 h-3" /> Renew
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
