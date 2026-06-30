import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { confirmPasswordReset } from '../../api/auth';
import { toast } from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ new_password: '', new_password_confirm: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.new_password_confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.new_password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await confirmPasswordReset({ uid, token, ...form });
      setDone(true);
    } catch (err) {
      const detail = err.response?.data?.detail || Object.values(err.response?.data || {}).flat()[0];
      setError(typeof detail === 'string' ? detail : 'Reset failed. The link may have expired.');
      toast.error(typeof detail === 'string' ? detail : 'Reset failed.');
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
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-blue-200 text-sm mt-1">Enter your new password below</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {done ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Password reset!</h2>
              <p className="text-sm text-gray-500">Your password has been updated. You can now log in with your new password.</p>
              <button onClick={() => navigate('/login')} className="btn-primary w-full mt-2">
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Min 8 characters"
                  value={form.new_password}
                  onChange={set('new_password')}
                  required
                  minLength={8}
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Repeat new password"
                  value={form.new_password_confirm}
                  onChange={set('new_password_confirm')}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {!done && (
            <p className="mt-5 text-center text-sm text-gray-500">
              Remembered it?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Back to login</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
