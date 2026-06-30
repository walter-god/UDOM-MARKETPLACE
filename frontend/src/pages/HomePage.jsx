import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, Users, Package, Star, Shield, Zap, Globe, LogIn } from 'lucide-react';
import { getFeaturedProjects, getMarketplaceStats, getProjects } from '../api/marketplace';
import ProjectCard from '../components/marketplace/ProjectCard';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import useAuthStore from '../store/authStore';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFeaturedProjects(), getMarketplaceStats(), getProjects({ ordering: '-created_at', limit: 8 })])
      .then(([proj, s, all]) => {
        setFeatured(proj.data);
        setStats(s.data);
        setLatest(all.data.results || all.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-black/40 text-white py-24 px-4 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-white rounded-2xl px-5 py-3 shadow-xl inline-block mb-4">
              <img src="/udomlogo.png" alt="UDOM" className="h-16 w-auto object-contain" />
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm">
              <Zap className="w-4 h-4 text-yellow-400" />
              UDOM's Official SaaS Marketplace
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Discover & Subscribe to<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              Student-Built Software
            </span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            A centralized platform for UDOM students to publish, share, and monetize their software projects. Subscribe to access premium resources.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/marketplace" className="bg-white text-blue-900 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-2">
              Browse Marketplace <ArrowRight className="w-4 h-4" />
            </Link>
            {isAuthenticated ? null : (
              <>
                <Link to="/login" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-xl transition-colors border border-white/20 flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
                <Link to="/register" className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white/85 backdrop-blur-sm py-10 border-b border-white/20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-700">{stats.total_projects || '0'}+</p>
              <p className="text-gray-500 text-sm mt-1">Projects Published</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-700">{stats.total_downloads || '0'}+</p>
              <p className="text-gray-500 text-sm mt-1">Total Downloads</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-700">{stats.total_categories || '8'}+</p>
              <p className="text-gray-500 text-sm mt-1">Categories</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Featured Projects</h2>
              <p className="text-blue-200 text-sm mt-1">Top-rated student-built software</p>
            </div>
            <Link to="/marketplace" className="text-blue-200 hover:text-white text-sm font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? <LoadingSpinner className="py-16" /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {featured.length === 0 ? (
                <p className="text-blue-200 col-span-4 text-center py-8">No featured projects yet. Be the first to publish!</p>
              ) : (
                featured.map(p => <ProjectCard key={p.id} project={p} />)
              )}
            </div>
          )}
        </div>
      </section>

      {/* Latest Projects */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Latest Projects</h2>
              <p className="text-blue-200 text-sm mt-1">Recently published student software</p>
            </div>
            <Link to="/marketplace" className="text-blue-200 hover:text-white text-sm font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? <LoadingSpinner className="py-16" /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {latest.length === 0 ? (
                <p className="text-blue-200 col-span-4 text-center py-8">No projects published yet.</p>
              ) : (
                latest.map(p => <ProjectCard key={p.id} project={p} />)
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-black/30 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white">Why UDOM Marketplace?</h2>
            <p className="text-blue-200 mt-2">A complete ecosystem for academic software</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Package, title: 'Publish Projects', desc: 'Share your capstone projects, APKs, web apps, and more', color: 'text-blue-600 bg-blue-50' },
              { icon: Shield, title: 'Quality Reviewed', desc: 'All projects reviewed by lecturers before publication', color: 'text-green-600 bg-green-50' },
              { icon: Download, title: 'Easy Access', desc: 'Subscribe to a plan and download unlimited resources', color: 'text-purple-600 bg-purple-50' },
              { icon: Globe, title: 'Per-Project Access', desc: 'Pay only for the specific software you need, on your schedule', color: 'text-yellow-600 bg-yellow-50' },
              { icon: Star, title: 'Ratings & Reviews', desc: 'Community-driven reviews to help you choose the best', color: 'text-orange-600 bg-orange-50' },
              { icon: Users, title: 'Community', desc: 'Connect with student developers and collaborators', color: 'text-pink-600 bg-pink-50' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${color} mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-black/50 backdrop-blur-sm text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-blue-200 mb-8">Join thousands of UDOM students already using the marketplace</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <Link to="/marketplace" className="bg-white text-blue-900 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                Browse Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="bg-white text-blue-900 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
                <Link to="/register" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-xl border border-white/20 transition-colors">
                  Create Free Account
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
