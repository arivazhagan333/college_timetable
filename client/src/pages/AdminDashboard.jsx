import { API_BASE } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, BookOpen, Layers, Clock, AlertTriangle, Play, Shuffle, CheckCircle, 
  Settings, ShieldAlert, FileText, ChevronRight, HelpCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [stats, setStats] = useState({
    totalFaculty: 0,
    totalHOD: 0,
    totalAdmin: 0,
    totalSubjects: 0,
    totalClasses: 0,
    totalAllocatedHours: 0,
    timetableStatus: 'Draft',
    conflictsCount: 0,
    isLocked: false
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      // Fetch faculty list
      const facRes = await fetch(`${API_BASE}/api/faculty`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const faculties = await facRes.json();

      // Fetch subjects
      const subRes = await fetch(`${API_BASE}/api/subjects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subjects = await subRes.json();

      // Fetch classes
      const clsRes = await fetch(`${API_BASE}/api/classes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const classes = await clsRes.json();

      // Fetch allocations
      const allocRes = await fetch(`${API_BASE}/api/allocations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allocations = await allocRes.json();

      // Fetch timetable
      const ttRes = await fetch(`${API_BASE}/api/timetable`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let ttStatus = 'Draft';
      let conflictsCount = 0;
      let isLocked = false;
      
      if (ttRes.ok) {
        const tt = await ttRes.json();
        ttStatus = tt.status;
        isLocked = tt.isLocked;

        // Fetch conflicts by validating current timetable schedule
        const valRes = await fetch(`${API_BASE}/api/timetable/validate`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ schedule: tt.schedule })
        });
        if (valRes.ok) {
          const valData = await valRes.json();
          conflictsCount = valData.conflicts.length;
        }
      }

      // Fetch audit logs
      const logRes = await fetch(`${API_BASE}/api/timetable/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (logRes.ok) {
        const logs = await logRes.json();
        setRecentLogs(logs.slice(0, 5));
      }

      // Calculations
      const totalFaculty = faculties.length;
      const totalHOD = faculties.filter(f => f.isHOD).length;
      const totalAdmin = faculties.filter(f => f.role === 'Admin' || f.role === 'Super Admin').length;
      const totalSubjects = subjects.length;
      const totalClasses = classes.length;
      const totalAllocatedHours = allocations.reduce((sum, item) => sum + item.weeklyHours, 0);

      setStats({
        totalFaculty,
        totalHOD,
        totalAdmin,
        totalSubjects,
        totalClasses,
        totalAllocatedHours,
        timetableStatus: ttStatus,
        conflictsCount,
        isLocked
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleGenerate = async () => {
    setActionLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await fetch(`${API_BASE}/api/timetable/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Generation failed.');
      
      setMsg({ text: 'Timetable generated successfully!', type: 'success' });
      fetchDashboardData();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleShuffle = async () => {
    setActionLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await fetch(`${API_BASE}/api/timetable/shuffle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Shuffle failed.');
      
      setMsg({ text: 'Timetable shuffled and validated successfully!', type: 'success' });
      fetchDashboardData();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>Loading Admin Dashboard...</div>;
  }

  return (
    <div className="main-content">
      {/* Welcome Banner */}
      <div style={welcomeBannerStyle}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Welcome back, {user.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Department of Mathematics Management Center</p>
        </div>
        <div style={semesterContainer}>
          <span style={semesterTag}>Odd Sem 2026-2027</span>
        </div>
      </div>

      {msg.text && (
        <div style={msg.type === 'success' ? successAlert : errorAlert}>
          {msg.type === 'error' && <AlertTriangle size={18} style={{ minWidth: '18px' }} />}
          <div>{msg.text}</div>
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid-4" style={{ marginBottom: '30px' }}>
        <div className="glass-card" style={cardFlex}>
          <div style={iconContainerStyle('#8b5cf6')}>
            <Users size={20} color="#ffffff" />
          </div>
          <div>
            <span style={cardLabel}>Faculty Strength</span>
            <h3 style={cardVal}>{stats.totalFaculty}</h3>
            <span style={cardSub}>{stats.totalHOD} HOD | {stats.totalAdmin} Admin</span>
          </div>
        </div>

        <div className="glass-card" style={cardFlex}>
          <div style={iconContainerStyle('#3b82f6')}>
            <BookOpen size={20} color="#ffffff" />
          </div>
          <div>
            <span style={cardLabel}>Total Subjects</span>
            <h3 style={cardVal}>{stats.totalSubjects}</h3>
            <span style={cardSub}>Course Codes Registered</span>
          </div>
        </div>

        <div className="glass-card" style={cardFlex}>
          <div style={iconContainerStyle('#10b981')}>
            <Layers size={20} color="#ffffff" />
          </div>
          <div>
            <span style={cardLabel}>Active Batches</span>
            <h3 style={cardVal}>{stats.totalClasses}</h3>
            <span style={cardSub}>Primary & Allied Classes</span>
          </div>
        </div>

        <div className="glass-card" style={cardFlex}>
          <div style={iconContainerStyle('#f59e0b')}>
            <Clock size={20} color="#ffffff" />
          </div>
          <div>
            <span style={cardLabel}>Allocated Workload</span>
            <h3 style={cardVal}>{stats.totalAllocatedHours} hrs</h3>
            <span style={cardSub}>Required teaching slots</span>
          </div>
        </div>
      </div>

      {/* Scheduler Control Panel */}
      <div className="glass-panel" style={controlPanelStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontSize: '20px' }}>Timetable Status</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`badge badge-${stats.timetableStatus === 'Validated' || stats.timetableStatus === 'Locked' || stats.timetableStatus === 'Final' ? 'success' : stats.timetableStatus === 'Generated' ? 'info' : 'warning'}`}>
              {stats.timetableStatus}
            </span>
            {stats.isLocked && <span className="badge badge-danger">LOCKED</span>}
          </div>
        </div>

        <div style={controlButtons}>
          <button 
            onClick={handleGenerate} 
            className="btn btn-primary" 
            disabled={actionLoading || stats.isLocked}
          >
            <Play size={16} />
            <span>Generate Timetable</span>
          </button>

          <button 
            onClick={handleShuffle} 
            className="btn btn-secondary" 
            disabled={actionLoading || stats.isLocked || stats.timetableStatus === 'Draft'}
            style={{ border: '1px solid var(--accent-glow)' }}
          >
            <Shuffle size={16} />
            <span>Shuffle Timetable</span>
          </button>

          <button 
            onClick={() => navigate('/timetable-editor')} 
            className="btn btn-secondary"
          >
            <span>Edit Timetable</span>
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Conflicts Alert Section */}
        <div className="glass-panel" style={sectionCard}>
          <div style={sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color={stats.conflictsCount > 0 ? '#ef4444' : '#10b981'} />
              <h3 style={{ fontSize: '18px' }}>Conflicts Detected</h3>
            </div>
            <span style={conflictCountStyle(stats.conflictsCount)}>
              {stats.conflictsCount} Active
            </span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            All scheduling rules (HOD workload, no-consecutive periods, double bookings) are checked.
          </p>

          {stats.conflictsCount > 0 ? (
            <div style={conflictMessageCard}>
              <div style={{ fontWeight: '600', color: '#fca5a5', marginBottom: '4px' }}>Action Required</div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Timetable cannot be finalized with conflicts. Use the editor to swap slots, or re-allocate teaching workloads to resolve the issues.
              </p>
              <button 
                onClick={() => navigate('/conflicts')} 
                style={viewConflictBtn}
              >
                <span>Open Conflict Dashboard</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div style={cleanTimetableCard}>
              <CheckCircle size={24} color="#10b981" />
              <div>
                <div style={{ fontWeight: '600', color: '#34d399' }}>All constraints passed!</div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  The timetable satisfies all teacher availability, workload distributions, and consecutive period rules.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Audit Log / History Section */}
        <div className="glass-panel" style={sectionCard}>
          <div style={sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="var(--accent-secondary)" />
              <h3 style={{ fontSize: '18px' }}>Recent Audit Logs</h3>
            </div>
            <Link to="/audit-logs" style={{ fontSize: '12px', color: 'var(--accent-secondary)', textDecoration: 'none' }}>
              View All
            </Link>
          </div>

          <div style={logsContainer}>
            {recentLogs.length > 0 ? (
              recentLogs.map((log, index) => (
                <div key={log._id || index} style={logItem}>
                  <div style={logItemMain}>
                    <span style={logBadge(log.action)}>{log.action}</span>
                    <span style={logDate}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p style={logDetails}>{log.details}</p>
                  <span style={logUser}>By {log.user}</span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No recent activity logs available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const welcomeBannerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px',
  background: 'linear-gradient(to right, rgba(139, 92, 246, 0.15), rgba(192, 132, 252, 0.03))',
  border: '1px solid var(--border-color)',
  padding: '24px 30px',
  borderRadius: '16px',
};

const semesterContainer = {
  background: 'rgba(139, 92, 246, 0.15)',
  border: '1px solid var(--accent-glow)',
  padding: '6px 14px',
  borderRadius: '8px',
};

const semesterTag = {
  fontSize: '13px',
  fontWeight: '700',
  color: 'var(--accent-secondary)',
};

const cardFlex = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '24px',
};

const iconContainerStyle = (color) => ({
  width: '44px',
  height: '44px',
  borderRadius: '10px',
  background: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `0 4px 10px ${color}55`,
});

const cardLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const cardVal = {
  fontFamily: 'var(--font-display)',
  fontSize: '24px',
  fontWeight: '800',
  color: '#ffffff',
  margin: '2px 0',
};

const cardSub = {
  fontSize: '11px',
  color: 'var(--text-muted)',
};

const controlPanelStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '24px 30px',
  marginBottom: '30px',
  flexWrap: 'wrap',
  gap: '20px',
};

const controlButtons = {
  display: 'flex',
  gap: '12px',
};

const sectionCard = {
  padding: '24px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

const sectionHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '12px',
};

const conflictCountStyle = (count) => ({
  fontSize: '12px',
  fontWeight: 'bold',
  padding: '4px 10px',
  borderRadius: '99px',
  background: count > 0 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
  color: count > 0 ? '#ef4444' : '#10b981',
  border: `1px solid ${count > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
});

const conflictMessageCard = {
  background: 'var(--color-danger-bg)',
  border: '1px solid rgba(239, 68, 68, 0.25)',
  padding: '16px',
  borderRadius: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  marginTop: 'auto',
};

const viewConflictBtn = {
  alignSelf: 'flex-start',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(239, 68, 68, 0.1)',
  color: '#fca5a5',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  borderRadius: '6px',
  padding: '6px 12px',
  fontSize: '12px',
  cursor: 'pointer',
  marginTop: '8px',
  fontWeight: '600',
  transition: 'all 0.2s ease',
};

const cleanTimetableCard = {
  background: 'var(--color-success-bg)',
  border: '1px solid rgba(16, 185, 129, 0.25)',
  padding: '20px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  marginTop: 'auto',
};

const logsContainer = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  overflowY: 'auto',
  maxHeight: '300px',
};

const logItem = {
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  paddingBottom: '10px',
};

const logItemMain = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px',
};

const logBadge = (action) => ({
  fontSize: '9px',
  fontWeight: '700',
  padding: '2px 6px',
  borderRadius: '4px',
  background: 'rgba(255,255,255,0.06)',
  color: '#ffffff',
  border: '1px solid rgba(255,255,255,0.1)',
});

const logDate = {
  fontSize: '10px',
  color: 'var(--text-muted)',
};

const logDetails = {
  fontSize: '12px',
  color: 'var(--text-primary)',
};

const logUser = {
  fontSize: '10px',
  color: 'var(--text-muted)',
  fontStyle: 'italic',
};

const successAlert = {
  background: 'var(--color-success-bg)',
  border: '1px solid rgba(16, 185, 129, 0.3)',
  color: '#a7f3d0',
  padding: '14px 20px',
  borderRadius: '10px',
  marginBottom: '24px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const errorAlert = {
  background: 'var(--color-danger-bg)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: '#fca5a5',
  padding: '14px 20px',
  borderRadius: '10px',
  marginBottom: '24px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};
export default AdminDashboard;
