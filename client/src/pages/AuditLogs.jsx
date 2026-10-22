import { API_BASE } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, RefreshCw } from 'lucide-react';

const AuditLogs = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/timetable/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Logs...</div>;

  return (
    <div className="main-content">
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>System Audit Logs</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Trace all administrative operations, timetable shuffles, saves, edits, and locks.</p>
        </div>
        <button onClick={fetchLogs} className="btn btn-secondary">
          <RefreshCw size={14} />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="table-container">
          <table className="custom-table" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Details</th>
                <th>Operator</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <span style={actionBadge(log.action)}>{log.action}</span>
                  </td>
                  <td style={{ color: '#ffffff', fontWeight: '500' }}>{log.details}</td>
                  <td style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                    {log.user}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px',
};

const actionBadge = (action) => {
  let bg = 'rgba(255,255,255,0.05)';
  let color = 'var(--text-secondary)';

  if (action.includes('CREATE')) {
    bg = 'rgba(16, 185, 129, 0.1)';
    color = '#10b981';
  } else if (action.includes('GENERATE') || action.includes('SHUFFLE')) {
    bg = 'rgba(59, 130, 246, 0.1)';
    color = '#3b82f6';
  } else if (action.includes('LOCK')) {
    bg = 'rgba(239, 68, 68, 0.1)';
    color = '#ef4444';
  } else if (action.includes('RESTORE')) {
    bg = 'rgba(245, 158, 11, 0.1)';
    color = '#f59e0b';
  }

  return {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '4px',
    background: bg,
    color,
    border: `1px solid ${color}44`,
  };
};

export default AuditLogs;
