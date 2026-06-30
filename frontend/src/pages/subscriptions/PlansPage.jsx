import { useEffect, useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { getPlans } from '../../api/subscriptions';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

const planColors = {
  free: { border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', btn: 'btn-secondary' },
  student: { border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', btn: 'btn-primary', popular: true },
  premium: { border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors' },
  institutional: { border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', btn: 'bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors' },
};

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState('monthly');
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    getPlans().then(r => setPlans(r.data.results || r.data)).finally(() => setLoading(false));
  }, []);

  const getPrice = (plan) => {
    const price = parseFloat(plan.price);
    if (price === 0) return 'Free';
    const mult = cycle === 'annual' ? 10 : cycle === 'semester' ? 5 : 1;
    return `TZS ${(price * mult).toLocaleString()}`;
  };

  const handleSubscribe = (plan) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (parseFloat(plan.price) === 0) {
      navigate('/dashboard/subscriptions', { state: { planId: plan.id, cycle } });
      return;
    }
    navigate('/checkout', {
      state: { planId: plan.id, cycle, planName: plan.name, price: parseFloat(plan.price) },
    });
  };

  if (loading) return <Layout><LoadingSpinner size="lg" className="py-32" /></Layout>;

  return (
    <Layout>
      <div className="bg-black/45 backdrop-blur-sm text-white py-16 px-4 text-center">
        <h1 className="text-3xl font-bold mb-3">Choose Your Plan</h1>
        <p className="text-blue-200 mb-6">Access student-built software with the right subscription</p>
        <div className="inline-flex bg-white/10 rounded-xl p-1">
          {['monthly', 'semester', 'annual'].map(c => (
            <button key={c} onClick={() => setCycle(c)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${cycle === c ? 'bg-white text-blue-900' : 'text-blue-200 hover:text-white'}`}>
              {c} {c === 'annual' ? '(Save 17%)' : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map(plan => {
            const style = planColors[plan.plan_type] || planColors.free;
            return (
              <div key={plan.id} className={`relative bg-white rounded-2xl border-2 ${style.border} p-6 shadow-sm flex flex-col`}>
                {style.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Most Popular
                    </span>
                  </div>
                )}
                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${style.badge} mb-3 w-fit capitalize`}>
                  {plan.plan_type}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-gray-900">{getPrice(plan)}</span>
                  {parseFloat(plan.price) > 0 && <span className="text-gray-500 text-sm">/{cycle}</span>}
                </div>
                {plan.trial_days > 0 && (
                  <p className="text-xs text-green-600 font-medium mb-3">{plan.trial_days}-day free trial</p>
                )}
                <div className="flex-1 space-y-2 mb-6">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => handleSubscribe(plan)} className={`${style.btn} w-full text-center py-2.5`}>
                  {parseFloat(plan.price) === 0 ? 'Get Started Free' : `Subscribe to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
