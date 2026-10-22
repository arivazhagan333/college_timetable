import { API_BASE } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Edit2, AlertTriangle, CheckCircle, Info, Save, X } from 'lucide-react';

const AllocationManagement = () => {
  const { token } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlloc, setEditingAlloc] = useState(null);

  const [formData, setFormData] = useState({
    faculty: '',
    subject: '',
    class: '',
    weeklyHours: 4
  });

  const [msg, setMsg] = useState({ text: '', type: '' });

  // Calculate workloads dynamically for alerts
  const [facWorkloads, setFacWorkloads] = useState({});
  const [clsWorkloads, setClsWorkloads] = useState({});

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [facRes, subRes, clsRes, allocRes] = await Promise.all([
        fetch(`${API_BASE}/api/faculty`, { headers }),
        fetch(`${API_BASE}/api/subjects`, { headers }),
        fetch(`${API_BASE}/api/classes`, { headers }),
        fetch(`${API_BASE}/api/allocations`, { headers })
      ]);

      const [facs, subs, clss, allocs] = await Promise.all([
        facRes.json(),
        subRes.json(),
        clsRes.json(),
        allocRes.json()
      ]);

      if (Array.isArray(facs)) setFaculties(facs);
      if (Array.isArray(subs)) setSubjects(subs);
      if (Array.isArray(clss)) setClasses(clss);
      if (Array.isArray(allocs)) setAllocations(allocs);

      if (Array.isArray(facs) && Array.isArray(clss) && Array.isArray(allocs)) {
        // Calculate workloads
        const fw = {};
        const cw = {};

        // Initialize
        facs.forEach(f => {
          fw[f._id] = { name: f.name, allocated: 0, required: f.isHOD ? 12 : 16 };
        });
        clss.forEach(c => {
          cw[c._id] = { name: c.name, allocated: 0, max: 30 };
        });

        // Sum
        allocs.forEach(a => {
          if (a.faculty && fw[a.faculty._id]) {
            fw[a.faculty._id].allocated += a.weeklyHours;
          }
          if (a.class && cw[a.class._id]) {
            cw[a.class._id].allocated += a.weeklyHours;
          }
        });

        setFacWorkloads(fw);
        setClsWorkloads(cw);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClick = () => {
    setEditingAlloc(null);
    setFormData({
      faculty: faculties[0]?._id || '',
      subject: subjects[0]?._id || '',
      class: classes[0]?._id || '',
      weeklyHours: 4
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (alloc) => {
    setEditingAlloc(alloc);
    setFormData({
      faculty: alloc.faculty?._id || '',
      subject: alloc.subject?._id || '',
      class: alloc.class?._id || '',
      weeklyHours: alloc.weeklyHours
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this allocation?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/allocations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMsg({ text: 'Allocation deleted successfully!', type: 'success' });
        fetchData();
      } else {
        const data = await res.json();
        throw new Error(data.message);
      }
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    try {
      let res;
      if (editingAlloc) {
        res = await fetch(`${API_BASE}/api/allocations/${editingAlloc._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch(`${API_BASE}/api/allocations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed.');

      setMsg({ text: `Allocation saved successfully!`, type: 'success' });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Allocations...</div>;

  // Check if there are active violations
  const facultyViolations = Object.values(facWorkloads).filter(w => w.allocated !== w.required);
  const classViolations = Object.values(clsWorkloads).filter(w => w.allocated > w.max);

  return (
    <div className="main-content">
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Faculty-Subject Allocation</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Define teaching workloads by mapping faculty to subjects and classes with weekly hours.</p>
        </div>
        <button onClick={handleCreateClick} className="btn btn-primary">
          <Plus size={16} />
          <span>New Allocation</span>
        </button>
      </div>

      {msg.text && (
        <div style={msg.type === 'success' ? successAlert : errorAlert}>
          <div>{msg.text}</div>
        </div>
      )}

      {/* Warnings & Alerts Dashboard */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Faculty Workload Status */}
        <div className="glass-panel" style={warningCard}>
          <h3 style={warningTitle}>
            <Info size={16} color="var(--accent-secondary)" />
            <span>Faculty Workload Alignment</span>
          </h3>
          <div style={warningList}>
            {facultyViolations.length > 0 ? (
              facultyViolations.map((v, i) => (
                <div key={i} style={warningItem(true)}>
                  <AlertTriangle size={14} color="#ef4444" />
                  <span>{v.name}: <strong>{v.allocated} / {v.required}</strong> hours allocated.</span>
                </div>
              ))
            ) : (
              <div style={cleanStatus}>
                <CheckCircle size={16} color="#10b981" />
                <span>All faculty workload mappings match requirements (HOD: 12 hrs, Regular: 16 hrs).</span>
              </div>
            )}
          </div>
        </div>

        {/* Class Capacity Status */}
        <div className="glass-panel" style={warningCard}>
          <h3 style={warningTitle}>
            <AlertTriangle size={16} color="#f59e0b" />
            <span>Class Capacity Alerts</span>
          </h3>
          <div style={warningList}>
            {classViolations.length > 0 ? (
              classViolations.map((v, i) => (
                <div key={i} style={warningItem(true)}>
                  <AlertTriangle size={14} color="#ef4444" />
                  <span>Class "{v.name}" requires <strong>{v.allocated}</strong> hours (Max capacity is {v.max} periods).</span>
                </div>
              ))
            ) : (
              <div style={cleanStatus}>
                <CheckCircle size={16} color="#10b981" />
                <span>All classes are within the 30-period weekly slot capacity limit.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Faculty Member</th>
                <th>Subject</th>
                <th>Class / Batch</th>
                <th>Medium</th>
                <th>Hours / Week</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((alloc) => (
                <tr key={alloc._id}>
                  <td style={{ fontWeight: '600', color: '#ffffff' }}>{alloc.faculty?.name} ({alloc.faculty?.shortName})</td>
                  <td>
                    <div>
                      <div style={{ fontWeight: '600' }}>{alloc.subject?.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Code: {alloc.subject?.courseCode}</div>
                    </div>
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--accent-secondary)' }}>{alloc.class?.name}</td>
                  <td>
                    <span className={`badge ${alloc.subject?.medium === 'E/M' ? 'badge-info' : alloc.subject?.medium === 'T/M' ? 'badge-warning' : 'badge-secondary'}`}>
                      {alloc.subject?.medium || 'E/M'}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700' }}>{alloc.weeklyHours} periods</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleEditClick(alloc)} 
                        style={actionIconBtn} 
                        title="Edit Hours"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(alloc._id)} 
                        style={actionIconBtn} 
                        title="Remove Mapping"
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Create/Edit Form */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div className="glass-panel" style={modalContent}>
            <div style={modalHeader}>
              <h3>{editingAlloc ? 'Edit Allocation' : 'Create Allocation'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Select Faculty</label>
                <select 
                  className="form-select"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  required
                >
                  {faculties.map(f => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.isHOD ? 'HOD' : 'Regular'} - Current: {facWorkloads[f._id]?.allocated || 0} hrs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Subject</label>
                <select 
                  className="form-select"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                >
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.courseCode} - {s.medium})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Class / Batch</label>
                <select 
                  className="form-select"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  required
                >
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} (Current: {clsWorkloads[c._id]?.allocated || 0} hrs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Weekly Hours</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="1" 
                  max="10"
                  value={formData.weeklyHours}
                  onChange={(e) => setFormData({ ...formData, weeklyHours: parseInt(e.target.value) })}
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>Save Allocation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px',
};

const actionIconBtn = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  padding: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-secondary)',
  transition: 'all 0.2s ease',
};

const warningCard = {
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '280px',
};

const warningTitle = {
  fontSize: '15px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '8px',
  marginBottom: '12px',
};

const warningList = {
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const warningItem = (isViolation) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '12px',
  color: isViolation ? '#fca5a5' : 'var(--text-secondary)',
  background: isViolation ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.02)',
  padding: '6px 10px',
  borderRadius: '6px',
  border: `1px solid ${isViolation ? 'rgba(239, 68, 68, 0.15)' : 'var(--border-color)'}`,
});

const cleanStatus = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '13px',
  color: '#a7f3d0',
  padding: '12px',
  background: 'rgba(16, 185, 129, 0.08)',
  borderRadius: '8px',
  border: '1px solid rgba(16, 185, 129, 0.15)',
};

const successAlert = {
  background: 'var(--color-success-bg)',
  border: '1px solid rgba(16, 185, 129, 0.3)',
  color: '#a7f3d0',
  padding: '14px 20px',
  borderRadius: '10px',
  marginBottom: '24px',
};

const errorAlert = {
  background: 'var(--color-danger-bg)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: '#fca5a5',
  padding: '14px 20px',
  borderRadius: '10px',
  marginBottom: '24px',
};

const modalOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContent = {
  width: '100%',
  maxWidth: '480px',
  padding: '30px',
  background: 'var(--bg-card)',
};

const modalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '12px',
};

const closeBtn = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};
export default AllocationManagement;
