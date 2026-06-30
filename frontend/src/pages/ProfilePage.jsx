import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { updateProfile, changePassword } from '../api/auth';
import useAuthStore from '../store/authStore';
import DashboardLayout from './dashboard/DashboardLayout';
import { Outlet } from 'react-router-dom';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', bio: user?.bio || '', phone_number: user?.phone_number || '', department: user?.department || '' });
  const [pwd, setPwd] = useState({ old_password: '', new_password: '', new_password_confirm: '' });
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateProfile(form);
      updateUser(res.data);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); } finally { setLoading(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwd.new_password !== pwd.new_password_confirm) { toast.error('Passwords do not match'); return; }
    setPwdLoading(true);
    try {
      await changePassword(pwd);
      toast.success('Password changed!');
      setPwd({ old_password: '', new_password: '', new_password_confirm: '' });
    } catch (err) { toast.error(err.response?.data?.old_password || 'Failed'); } finally { setPwdLoading(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
        <form onSubmit={handleProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">First Name</label><input className="input" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
            <div><label className="label">Last Name</label><input className="input" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
          </div>
          <div><label className="label">Department</label><input className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></div>
          <div><label className="label">Phone Number</label><input className="input" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} /></div>
          <div><label className="label">Bio</label><textarea className="input min-h-24 resize-none" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} /></div>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={handlePassword} className="space-y-4">
          <div><label className="label">Current Password</label><input type="password" className="input" value={pwd.old_password} onChange={e => setPwd(p => ({ ...p, old_password: e.target.value }))} required /></div>
          <div><label className="label">New Password</label><input type="password" className="input" value={pwd.new_password} onChange={e => setPwd(p => ({ ...p, new_password: e.target.value }))} required minLength={8} /></div>
          <div><label className="label">Confirm New Password</label><input type="password" className="input" value={pwd.new_password_confirm} onChange={e => setPwd(p => ({ ...p, new_password_confirm: e.target.value }))} required /></div>
          <button type="submit" disabled={pwdLoading} className="btn-primary">{pwdLoading ? 'Changing...' : 'Change Password'}</button>
        </form>
      </div>

      <div className="card bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium capitalize">{user?.role}</span></div>
          {user?.registration_number && <div className="flex justify-between"><span className="text-gray-500">Reg. No.</span><span className="font-medium">{user.registration_number}</span></div>}
          <div className="flex justify-between"><span className="text-gray-500">Member Since</span><span className="font-medium">{new Date(user?.date_joined).toLocaleDateString()}</span></div>
        </div>
      </div>
    </div>
  );
}
