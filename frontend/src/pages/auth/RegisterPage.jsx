import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', password_confirm: '',
    registration_number: '', staff_id: '', role: 'student', department: '', phone_number: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Please log in to continue.');
      navigate('/login');
    } catch (err) {
      const errs = err.response?.data;
      if (errs) {
        const msg = Object.values(errs).flat()[0];
        toast.error(typeof msg === 'string' ? msg : 'Registration failed');
      } else toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const departments = ['Computer Science', 'Information Technology', 'Engineering', 'Business', 'Education', 'Science', 'Other'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="bg-white rounded-2xl p-3 shadow-lg inline-block">
              <img src="/udomlogo.png" alt="UDOM" className="h-14 w-auto object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-blue-200 text-sm">Join UDOM Marketplace</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input type="text" className="input" placeholder="John" value={form.first_name} onChange={set('first_name')} required />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input type="text" className="input" placeholder="Doe" value={form.last_name} onChange={set('last_name')} required />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@udom.ac.tz" value={form.email} onChange={set('email')} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={set('role')}>
                  <option value="student">Student</option>
                  <option value="developer">Developer</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="external">External User</option>
                </select>
              </div>
              <div>
                <label className="label">Department</label>
                <select className="input" value={form.department} onChange={set('department')}>
                  <option value="">Select...</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            {form.role === 'lecturer' ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                  Lecturers must use their official UDOM email (<strong>@udom.ac.tz</strong>) and provide their Staff ID.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Staff ID *</label>
                    <input type="text" className="input" placeholder="e.g. STAFF/2024/001" value={form.staff_id} onChange={set('staff_id')} required />
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input type="tel" className="input" placeholder="+255 7..." value={form.phone_number} onChange={set('phone_number')} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Registration No. (optional)</label>
                  <input type="text" className="input" placeholder="T/UDOM/2024/..." value={form.registration_number} onChange={set('registration_number')} />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input type="tel" className="input" placeholder="+255 7..." value={form.phone_number} onChange={set('phone_number')} />
                </div>
              </div>
            )}
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input" placeholder="Repeat password" value={form.password_confirm} onChange={set('password_confirm')} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
