import { API_BASE } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, ArrowRight, Info, Users, Clock } from 'lucide-react';

const ConflictDashboard = () => {
  const { token } = useAuth();
  const [conflicts, setConflicts] = useState([]);
  const [facultyWorkloads, setFacultyWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConflictsAndWorkloads = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch faculties & allocations to compute workload statistics
      const facRes = await fetch(`${API_BASE}/api/faculty`, { headers });
      const facs = await facRes.json();

      const allocRes = await fetch(`${API_BASE}/api/allocations`, { headers });
      const allocs = await allocRes.json();

      // Fetch timetable and validate it to get active conflicts
      const ttRes = await fetch(`${API_BASE}/api/timetable`, { headers });
      let ttConflicts = [];
      let schedule = [];
      
      if (ttRes.ok) {
        const tt = await ttRes.json();
        schedule = tt.schedule || [];
        
        const valRes = await fetch(`${API_BASE}/api/timetable/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ schedule })
        });
        if (valRes.ok) {
          const valData = await valRes.json();
          ttConflicts = valData.conflicts;
        }
      }

      // Compute workloads
      const list = facs.map(f => {
        const required = f.isHOD ? 12 : 16;
        const allocated = allocs.filter(a => a.faculty?._id === f._id).reduce((sum, item) => sum + item.weeklyHours, 0);
        const assigned = schedule.filter(s => s.faculty?._id === f._id).length;
        
        let status = 'Complete';
        if (assigned < required) status = 'Underallocated';
        if (assigned > required) status = 'Overallocated';
        
        // Check if this teacher is involved in any active conflicts
        const hasConflict = ttConflicts.some(c => c.faculty === f.name);
        if (hasConflict) status = 'Conflict';

        return {
          id: f._id,
          name: f.name,
          role: f.isHOD ? 'HOD' : 'Regular',
          required,
          allocated,
          assigned,
          status
        };
      });

      setConflicts(ttConflicts);
      setFacultyWorkloads(list);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflictsAndWorkloads();
  }, []);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Conflict Dashboard...</div>;

  return (
    <div className="main-content">
      <div>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Conflict & Workload Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
          Identify double bookings, workload mismatches, and consecutive period violations.
        </p>
      </div>

      <div className="grid-2" style={{ marginBottom: '30px' }}>
        {/* Active Conflicts List */}
        <div className="glass-panel" style={panelCard}>
          <div style={panelHeader}>
            <AlertTriangle size={20} color={conflicts.length > 0 ? '#ef4444' : '#10b981'} />
            <h3 style={{ fontSize: '18px' }}>Active System Conflicts ({conflicts.length})</h3>
          </div>
          
          <div style={conflictsContainer}>
            {conflicts.length > 0 ? (
              conflicts.map((conf, index) => (
                <div key={index} style={conflictItemStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-danger">{conf.type}</span>
                    {conf.day && conf.period && (
                      <span style={conflictTime}>{conf.day} ({conf.period})</span>
                    )}
                  </div>
                  <p style={conflictReason}>{conf.reason}</p>
                </div>
              ))
            ) : (
              <div style={cleanPanel}>
                <CheckCircle size={28} color="#10b981" />
                <h4 style={{ color: '#34d399', fontWeight: '600' }}>No Active Conflicts!</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  The timetable matches all required rules perfectly.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Workload Status Panel */}
        <div className="glass-panel" style={panelCard}>
          <div style={panelHeader}>
            <Clock size={20} color="var(--accent-secondary)" />
            <h3 style={{ fontSize: '18px' }}>Faculty Workload Tracking</h3>
          </div>

          <div style={workloadListContainer}>
            <table className="custom-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>Role</th>
                  <th>Req. Hrs</th>
                  <th>Assigned</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {facultyWorkloads.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: '600', color: '#ffffff' }}>{f.name}</td>
                    <td>{f.role}</td>
                    <td>{f.required} hrs</td>
                    <td style={{ fontWeight: '700' }}>{f.assigned} hrs</td>
                    <td>
                      <span className={`badge ${
                        f.status === 'Complete' ? 'badge-success' :
                        f.status === 'Underallocated' ? 'badge-info' :
                        f.status === 'Overallocated' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const panelCard = {
  padding: '24px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

const panelHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '12px',
  marginBottom: '16px',
};

const conflictsContainer = {
  flex: 1,
  overflowY: 'auto',
  maxHeight: '400px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const conflictItemStyle = {
  background: 'rgba(239, 68, 68, 0.06)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  borderRadius: '8px',
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const conflictTime = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  fontWeight: '600',
};

const conflictReason = {
  fontSize: '13px',
  color: 'var(--text-primary)',
};

const cleanPanel = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  textAlign: 'center',
  marginTop: 'auto',
  marginBottom: 'auto',
};

const workloadListContainer = {
  flex: 1,
  overflowY: 'auto',
  maxHeight: '400px',
};
export default ConflictDashboard;
