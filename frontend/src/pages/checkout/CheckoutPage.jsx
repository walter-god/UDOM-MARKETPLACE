import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, CreditCard, Smartphone, Building2, ShieldCheck, ArrowLeft, Clock } from 'lucide-react';
import { subscribe } from '../../api/subscriptions';
import { createPaymentIntent } from '../../api/payments';
import { subscribeToProject } from '../../api/marketplace';
import { toast } from 'react-hot-toast';

const METHODS = [
  { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone, desc: 'Airtel Money, Tigo Pesa, M-Pesa, Halo Pesa' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2, desc: 'Direct bank deposit' },
  { id: 'card', label: 'Debit / Credit Card', icon: CreditCard, desc: 'Visa, Mastercard' },
];

const MOBILE_PROVIDERS = [
  { id: 'airtel_money', label: 'Airtel Money', prefix: '078', color: 'border-red-400 bg-red-50 text-red-700', activeRing: 'ring-red-400' },
  { id: 'tigo_pesa', label: 'Tigo Pesa', prefix: '071', color: 'border-blue-400 bg-blue-50 text-blue-700', activeRing: 'ring-blue-400' },
  { id: 'm_pesa', label: 'M-Pesa', prefix: '076', color: 'border-green-500 bg-green-50 text-green-700', activeRing: 'ring-green-500' },
  { id: 'halo_pesa', label: 'Halo Pesa', prefix: '062', color: 'border-orange-400 bg-orange-50 text-orange-700', activeRing: 'ring-orange-400' },
];

const DURATION_OPTIONS = [
  { days: 30, label: '1 Month' },
  { days: 90, label: '3 Months' },
  { days: 180, label: '6 Months' },
  { days: 365, label: '1 Year' },
];

const CYCLE_LABELS = { monthly: 'month', semester: 'semester', annual: 'year' };

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [method, setMethod] = useState('mobile_money');
  const [mobileProvider, setMobileProvider] = useState('airtel_money');
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [duration, setDuration] = useState(30);

  // If landed without any valid state, send back to marketplace
  if (!state?.planId && !state?.projectId) {
    navigate('/marketplace', { replace: true });
    return null;
  }

  const isProjectCheckout = !!state.projectId;
  const { planId, cycle = 'monthly', planName, projectId, projectSlug, projectTitle } = state;
  const price = state.price || 0;
  const cycleLabel = CYCLE_LABELS[cycle] || cycle;
  const total = isProjectCheckout
    ? price * (duration / 30)
    : (cycle === 'annual' ? price * 10 : cycle === 'semester' ? price * 5 : price);
  const displayName = isProjectCheckout ? projectTitle : planName;

  const paymentMethod = method === 'mobile_money' ? mobileProvider : method;

  const handlePay = async () => {
    if (method === 'mobile_money' && !phone.trim()) {
      toast.error('Enter your mobile money phone number');
      return;
    }
    setProcessing(true);
    try {
      if (isProjectCheckout) {
        await subscribeToProject(projectId, { payment_method: paymentMethod, duration_days: duration });
      } else {
        await subscribe({ plan_id: planId, billing_cycle: cycle, payment_method: paymentMethod });
        await createPaymentIntent({ plan_id: planId, payment_method: paymentMethod });
      }
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-2">
          You now have full access to <strong>{displayName}</strong>.
        </p>
        {isProjectCheckout && (
          <p className="text-sm text-blue-600 mb-6 flex items-center justify-center gap-1.5">
            <Clock className="w-4 h-4" />
            Access valid for {DURATION_OPTIONS.find(d => d.days === duration)?.label} · expires {addDays(duration)}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          {isProjectCheckout && projectSlug && (
            <button onClick={() => navigate(`/marketplace/${projectSlug}`)} className="btn-secondary">
              View Project
            </button>
          )}
          <button onClick={() => navigate(isProjectCheckout ? '/dashboard/subscriptions' : '/dashboard/subscriptions')} className="btn-primary">
            My Subscriptions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Payment</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Payment method + form */}
        <div className="md:col-span-3 space-y-4">
          {isProjectCheckout && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Access Duration
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map(opt => {
                  const optTotal = price * (opt.days / 30);
                  return (
                    <label key={opt.days}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        duration === opt.days ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-200'
                      }`}>
                      <input type="radio" name="duration" value={opt.days} checked={duration === opt.days}
                        onChange={() => setDuration(opt.days)} className="sr-only" />
                      <span className={`text-sm font-semibold ${duration === opt.days ? 'text-blue-700' : 'text-gray-700'}`}>
                        {opt.label}
                      </span>
                      <span className={`text-xs mt-0.5 ${duration === opt.days ? 'text-blue-500' : 'text-gray-400'}`}>
                        TZS {optTotal.toLocaleString()}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Access expires on {addDays(duration)}
              </p>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
            <div className="space-y-2">
              {METHODS.map(m => (
                <label key={m.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    method === m.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-200'
                  }`}>
                  <input type="radio" name="method" value={m.id} checked={method === m.id}
                    onChange={() => setMethod(m.id)} className="accent-blue-600" />
                  <m.icon className={`w-5 h-5 shrink-0 ${method === m.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-sm font-medium ${method === m.id ? 'text-blue-800' : 'text-gray-700'}`}>{m.label}</p>
                    <p className="text-xs text-gray-400">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {method === 'mobile_money' && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Mobile Money Details</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {MOBILE_PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setMobileProvider(p.id)}
                    className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      mobileProvider === p.id
                        ? `${p.color} ring-2 ${p.activeRing} ring-offset-1`
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input
                  type="tel"
                  className="input"
                  placeholder={`e.g. ${MOBILE_PROVIDERS.find(p => p.id === mobileProvider)?.prefix}X XXX XXX`}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">You will receive a payment prompt on this number.</p>
              </div>
            </div>
          )}

          {method === 'bank_transfer' && (
            <div className="card bg-blue-50 border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-2">Bank Transfer Instructions</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li><span className="font-medium">Bank:</span> CRDB Bank</li>
                <li><span className="font-medium">Account Name:</span> UDOM Marketplace</li>
                <li><span className="font-medium">Account No:</span> 0150123456789</li>
                <li><span className="font-medium">Reference:</span> Your email address</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2">Click "Confirm Payment" after completing the transfer.</p>
            </div>
          )}

          {method === 'card' && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Card Details</h3>
              <p className="text-sm text-gray-500">Card payments are processed securely via Stripe.</p>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="md:col-span-2">
          <div className="card sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>{displayName}</span>
                <span>TZS {price.toLocaleString()}{!isProjectCheckout ? `/${cycleLabel}` : ''}</span>
              </div>
              {!isProjectCheckout && cycle !== 'monthly' && (
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>× {cycle === 'annual' ? '10' : '5'} months</span>
                  <span></span>
                </div>
              )}
              {isProjectCheckout && (
                <div className="text-xs text-blue-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {DURATION_OPTIONS.find(d => d.days === duration)?.label} access · expires {addDays(duration)}
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>TZS {total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {processing ? 'Processing…' : `Pay TZS ${total.toLocaleString()}`}
            </button>

            <div className="flex items-center gap-1.5 mt-3 justify-center text-xs text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure payment
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
