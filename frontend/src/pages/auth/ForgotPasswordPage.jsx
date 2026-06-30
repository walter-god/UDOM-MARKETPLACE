import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { requestPasswordReset } from '../../api/auth';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset({ email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="bg-white rounded-2xl px-5 py-3 shadow-lg inline-block mb-4">
            <img src="/udomlogo.png" alt="UDOM" className="h-12 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
          <p className="text-blue-200 text-sm mt-1">We'll send a reset link to your email</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full">
                <Mail className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Check your inbox</h2>
              <p className="text-sm text-gray-500">
                If <span className="font-medium text-gray-700">{email}</span> is registered, you'll receive a reset link shortly. The link expires in <span className="font-medium">1 hour</span>.
              </p>
              <p className="text-xs text-gray-400">Didn't get it? Check your spam folder or try again.</p>
              <button onClick={() => setSent(false)} className="btn-secondary w-full mt-2">
                Try a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@udom.ac.tz"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-gray-500">
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
