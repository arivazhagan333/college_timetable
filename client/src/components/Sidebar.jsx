import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, BookOpen, Layers, GitMerge, Clock, Sparkles, 
  CalendarRange, Compass, AlertTriangle, BarChart3, History, ShieldAlert, 
  Settings, User, LogOut, CheckSquare
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = user.role === 'Admin' || user.role === 'Super Admin';

  const adminMenu = [
    { name: 'Dashboard', path: '/admin-dashboard', icon: LayoutDashboard },
    { name: 'Faculty Management', path: '/faculty', icon: Users },
    { name: 'Subjects', path: '/subjects', icon: BookOpen },
    { name: 'Classes / Batches', path: '/classes', icon: Layers },
    { name: 'Faculty-Subject Allocation', path: '/allocations', icon: GitMerge },
    { name: 'Timetable Editor', path: '/timetable-editor', icon: CalendarRange },
    { name: 'Master Timetable', path: '/master-timetable', icon: Compass },
    { name: 'Conflict Dashboard', path: '/conflicts', icon: AlertTriangle },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const staffMenu = [
    { name: 'Dashboard', path: '/staff-dashboard', icon: LayoutDashboard },
    { name: 'My Weekly Timetable', path: '/my-timetable', icon: CalendarRange },
    { name: 'My Subjects', path: '/my-subjects', icon: BookOpen },
  ];

  const isStaffView = location.pathname.startsWith('/my-') || location.pathname === '/staff-dashboard';
  const menuItems = (isAdmin && !isStaffView) ? adminMenu : staffMenu;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={sidebarStyle}>
      <div style={logoContainerStyle}>
        <h2 style={logoTextStyle}>GAC Mathematics</h2>
        <span style={roleBadgeStyle(user.role)}>{user.role}</span>
      </div>

      {isAdmin && (
        <div style={{ padding: '0 8px 16px 8px' }}>
          <button 
            onClick={() => navigate(isStaffView ? '/admin-dashboard' : '/staff-dashboard')}
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '12px', border: '1px solid var(--accent-glow)' }}
          >
            {isStaffView ? 'Switch to Admin View' : 'Switch to Staff View'}
          </button>
        </div>
      )}

      <nav style={navStyle}>
        <ul style={ulStyle}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name}>
                <Link to={item.path} style={linkStyle(isActive)}>
                  <Icon size={18} style={iconStyle(isActive)} />
                  <span style={itemTextContainer}>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div style={footerStyle}>
        <div style={userInfoStyle}>
          <User size={16} />
          <span style={userNameStyle}>{user.name}</span>
        </div>
        <button onClick={handleLogout} style={logoutBtnStyle}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

// Styles
const sidebarStyle = {
  width: '260px',
  height: '100vh',
  position: 'fixed',
  top: 0,
  left: 0,
  background: 'var(--bg-sidebar)',
  borderRight: '1px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 16px',
  zIndex: 100,
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
};

const logoContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  marginBottom: '32px',
  paddingLeft: '8px',
};

const logoTextStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '20px',
  fontWeight: '800',
  letterSpacing: '-0.5px',
  background: 'linear-gradient(to right, #c084fc, #8b5cf6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const roleBadgeStyle = (role) => ({
  alignSelf: 'flex-start',
  fontSize: '10px',
  padding: '2px 8px',
  borderRadius: '4px',
  fontWeight: 'bold',
  background: role === 'Super Admin' ? 'rgba(239, 68, 68, 0.15)' : role === 'Admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
  color: role === 'Super Admin' ? '#fca5a5' : role === 'Admin' ? '#c084fc' : '#34d399',
  border: `1px solid ${role === 'Super Admin' ? 'rgba(239, 68, 68, 0.3)' : role === 'Admin' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
});

const navStyle = {
  flex: 1,
  overflowY: 'auto',
};

const ulStyle = {
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const linkStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 14px',
  borderRadius: '8px',
  color: isActive ? '#ffffff' : 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: isActive ? '600' : '400',
  background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
  border: `1px solid ${isActive ? 'rgba(139, 92, 246, 0.25)' : 'transparent'}`,
  transition: 'all 0.2s ease',
});

const iconStyle = (isActive) => ({
  color: isActive ? 'var(--accent-secondary)' : 'var(--text-secondary)',
});

const itemTextContainer = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const footerStyle = {
  borderTop: '1px solid var(--border-color)',
  paddingTop: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const userInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  paddingLeft: '8px',
};

const userNameStyle = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '180px',
  fontWeight: '500',
};

const logoutBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  background: 'rgba(239, 68, 68, 0.08)',
  color: '#fca5a5',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  borderRadius: '8px',
  padding: '10px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  width: '100%',
  transition: 'all 0.2s ease',
};

export default Sidebar;
