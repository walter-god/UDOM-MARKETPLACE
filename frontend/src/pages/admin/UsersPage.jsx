import { useEffect, useState } from 'react';
import { getUsers, toggleUserActive, deleteUser, unlockUser } from '../../api/auth';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../store/authStore';
import { Trash2, LockOpen } from 'lucide-react';

const roleBadge = { admin: 'badge-red', developer: 'badge-blue', student: 'badge-green', lecturer: 'badge-yellow', external: 'badge-gray' };

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = (q = '') => {
    setLoading(true);
    getUsers(q ? { search: q } : {}).then(r => setUsers(r.data.results || r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggle = async (id, currentActive) => {
    try {
      await toggleUserActive(id);
      toast.success(`User ${currentActive ? 'deactivated' : 'activated'}`);
      fetchUsers(search);
    } catch { toast.error('Action failed'); }
  };

  const handleUnlock = async (id) => {
    try {
      await unlockUser(id);
      toast.success('Account unlocked');
      fetchUsers(search);
    } catch { toast.error('Unlock failed'); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Permanently delete "${u.full_name}" (${u.email})? This cannot be undone.`)) return;
    try {
      await deleteUser(u.id);
      toast.success('User deleted');
      fetchUsers(search);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>
      <div className="card">
        <div className="mb-4">
          <input className="input max-w-sm" placeholder="Search users..." value={search}
            onChange={e => { setSearch(e.target.value); fetchUsers(e.target.value); }} />
        </div>
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Role</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Login Status</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Joined</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-900">{u.full_name}</td>
                    <td className="py-3 px-3 text-gray-500">{u.email}</td>
                    <td className="py-3 px-3"><span className={`badge ${roleBadge[u.role] || 'badge-gray'}`}>{u.role}</span></td>
                    <td className="py-3 px-3">
                      {u.is_locked ? (
                        <span className="badge badge-red">Locked</span>
                      ) : u.failed_login_attempts > 0 ? (
                        <span className="badge badge-yellow">{u.failed_login_attempts} failed</span>
                      ) : (
                        <span className="badge badge-green">OK</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-500">{new Date(u.date_joined).toLocaleDateString()}</td>
                    <td className="py-3 px-3">
                      {u.id !== currentUser?.id ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          {u.is_locked && (
                            <button onClick={() => handleUnlock(u.id)}
                              className="text-xs px-2 py-1 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 flex items-center gap-1">
                              <LockOpen className="w-3 h-3" /> Unlock
                            </button>
                          )}
                          <button onClick={() => handleToggle(u.id, u.is_active)}
                            className={`text-xs px-2 py-1 rounded-lg ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDelete(u)}
                            className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"
                            title="Delete user">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">You</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
