import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, CreditCard, Bell, Users, BarChart2, Settings, FileText, Star, Upload, FolderOpen, Activity, ClipboardList, AlertTriangle, GraduationCap } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const studentLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/projects', icon: FolderOpen, label: 'My Projects' },
  { to: '/dashboard/upload', icon: Upload, label: 'Upload Project' },
  { to: '/dashboard/subscriptions', icon: CreditCard, label: 'Subscription' },
  { to: '/dashboard/payments', icon: FileText, label: 'Payments' },
  { to: '/dashboard/bookmarks', icon: Star, label: 'Bookmarks' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: Settings, label: 'Profile' },
];

const developerLinks = [
  { to: '/developer', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/projects', icon: FolderOpen, label: 'My Projects' },
  { to: '/dashboard/upload', icon: Upload, label: 'Upload Project' },
  { to: '/dashboard/subscriptions', icon: CreditCard, label: 'Subscription' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: Settings, label: 'Profile' },
];

const lecturerLinks = [
  { to: '/lecturer', icon: LayoutDashboard, label: 'Overview' },
  { to: '/lecturer/pending', icon: ClipboardList, label: 'Pending Review' },
  { to: '/lecturer/supervised', icon: GraduationCap, label: 'Supervised Students' },
  { to: '/lecturer/duplicate-check', icon: AlertTriangle, label: 'Duplicate Check' },
  { to: '/marketplace', icon: FolderOpen, label: 'Browse Projects' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: Settings, label: 'Profile' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/projects', icon: Package, label: 'Projects' },
  { to: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { to: '/admin/payments', icon: FileText, label: 'Payments' },
  { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/admin/announcements', icon: Bell, label: 'Announcements' },
  { to: '/admin/activity-logs', icon: Activity, label: 'Activity Logs' },
];

export default function Sidebar() {
  const { user } = useAuthStore();

  const links = user?.role === 'admin' ? adminLinks
    : user?.role === 'developer' ? developerLinks
    : user?.role === 'lecturer' ? lecturerLinks
    : studentLinks;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Brand logo */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <img src="/udomlogo.png" alt="UDOM" className="h-9 w-auto object-contain" />
        <span className="font-bold text-blue-900 text-sm leading-tight">UDOM<br />Marketplace</span>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to.split('/').length <= 2}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
