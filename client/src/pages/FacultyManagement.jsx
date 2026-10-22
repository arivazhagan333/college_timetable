import { API_BASE } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, ShieldAlert, Award, Power, PowerOff, X, Save } from 'lucide-react';

const FacultyManagement = () => {
  const { token, promoteStaff } = useAuth();
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    staffId: '',
    name: '',
    shortName: '',
    phone: '',
    email: '',
    designation: 'Assistant Professor',
    role: 'Staff',
    isHOD: false,
    teachingEligibility: ['UG', 'PG']
  });

  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchFaculties = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/faculty`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setFaculties(data);
      } else {
        console.error('Expected an array of faculties, but got:', data);
        setFaculties([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  const handleEditClick = (faculty) => {
    setEditingFaculty(faculty);
    setFormData({
      name: faculty.name,
      shortName: faculty.shortName || '',
      phone: faculty.phone,
      email: faculty.email,
      designation: faculty.designation,
      role: faculty.role,
      isHOD: faculty.isHOD,
      teachingEligibility: faculty.teachingEligibility
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingFaculty(null);
    setFormData({
      staffId: '',
      name: '',
      shortName: '',
      phone: '',
      email: '',
      designation: 'Assistant Professor',
      role: 'Staff',
      isHOD: false,
      teachingEligibility: ['UG', 'PG']
    });
    setIsCreateModalOpen(true);
  };

  const handleToggleActive = async (faculty) => {
    try {
      const res = await fetch(`${API_BASE}/api/faculty/${faculty._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !faculty.isActive })
      });
      if (res.ok) {
        setMsg({ text: `Faculty ${faculty.name} ${!faculty.isActive ? 'activated' : 'deactivated'} successfully!`, type: 'success' });
        fetchFaculties();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePromoteAdmin = async (id) => {
    try {
      await promoteStaff(id);
      setMsg({ text: 'Staff promoted to Admin role successfully!', type: 'success' });
      fetchFaculties();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    try {
      let res;
      if (editingFaculty) {
        // Edit Mode
        res = await fetch(`${API_BASE}/api/faculty/${editingFaculty._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      } else {
        // Create Mode
        res = await fetch(`${API_BASE}/api/faculty`, {
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

      setMsg({ text: `Faculty ${editingFaculty ? 'updated' : 'created'} successfully!`, type: 'success' });
      setIsCreateModalOpen(false);
      fetchFaculties();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handleEligibilityChange = (eligibility) => {
    const list = [...formData.teachingEligibility];
    if (list.includes(eligibility)) {
      setFormData({ ...formData, teachingEligibility: list.filter(item => item !== eligibility) });
    } else {
      setFormData({ ...formData, teachingEligibility: [...list, eligibility] });
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Faculty...</div>;

  return (
    <div className="main-content">
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Faculty Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Configure teaching staff accounts, roles, eligibility and availability.</p>
        </div>
        <button onClick={handleCreateClick} className="btn btn-primary">
          <Plus size={16} />
          <span>Add Faculty</span>
        </button>
      </div>

      {msg.text && (
        <div style={msg.type === 'success' ? successAlert : errorAlert}>
          <div>{msg.text}</div>
        </div>
      )}

      {/* Faculty Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Role</th>
                <th>HOD Status</th>
                <th>Eligibility</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(faculties) && faculties.map((fac) => (
                <tr key={fac._id}>
                  <td style={{ fontWeight: '600' }}>{fac.staffId}</td>
                  <td>
                    <div>
                      <div style={{ fontWeight: '600', color: '#ffffff' }}>{fac.name} {fac.shortName && `(${fac.shortName})`}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fac.email} | {fac.phone}</div>
                    </div>
                  </td>
                  <td>{fac.designation}</td>
                  <td>
                    <span className={`badge ${fac.role === 'Super Admin' ? 'badge-danger' : fac.role === 'Admin' ? 'badge-success' : 'badge-info'}`}>
                      {fac.role}
                    </span>
                  </td>
                  <td>
                    {fac.isHOD ? (
                      <span className="badge badge-warning">HOD (12 hrs)</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Regular (16 hrs)</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {fac.teachingEligibility.map((el, i) => (
                        <span key={i} style={eligibilityTag}>{el}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${fac.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {fac.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleEditClick(fac)} 
                        style={actionIconBtn} 
                        title="Edit Details"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleToggleActive(fac)} 
                        style={actionIconBtn} 
                        title={fac.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {fac.isActive ? <PowerOff size={14} color="#ef4444" /> : <Power size={14} color="#10b981" />}
                      </button>
                      {fac.role === 'Staff' && (
                        <button 
                          onClick={() => handlePromoteAdmin(fac._id)} 
                          style={actionPromoteBtn}
                          title="Promote to Admin"
                        >
                          <Award size={14} />
                          <span>Promote</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Create/Edit Form */}
      {isCreateModalOpen && (
        <div style={modalOverlay}>
          <div className="glass-panel" style={modalContent}>
            <div style={modalHeader}>
              <h3>{editingFaculty ? 'Edit Faculty Details' : 'Add New Faculty'}</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ marginTop: '20px' }}>
              <div style={formRow}>
                {!editingFaculty && (
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Staff ID</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. FAC015" 
                      value={formData.staffId}
                      onChange={(e) => setFormData({ ...formData, staffId: e.target.value.toUpperCase() })}
                      required 
                    />
                  </div>
                )}
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Dr. P. Sowmiya" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Short Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. PS" 
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value.toUpperCase() })}
                    required 
                  />
                </div>
              </div>

              <div style={formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="e.g. 9443212341" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. name@gacsalem.edu.in" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required 
                  />
                </div>
              </div>

              <div style={formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Designation</label>
                  <select 
                    className="form-select"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  >
                    <option value="Associate Professor & HOD">Associate Professor & HOD</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '28px' }}>
                  <input 
                    type="checkbox" 
                    id="isHOD" 
                    checked={formData.isHOD}
                    onChange={(e) => setFormData({ ...formData, isHOD: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="isHOD" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Is HOD Faculty? (12hr Workload)</label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Teaching Eligibility</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['UG', 'PG', 'Allied'].map((elig) => (
                    <label key={elig} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.teachingEligibility.includes(elig)}
                        onChange={() => handleEligibilityChange(elig)}
                      />
                      <span>{elig}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>Save Faculty</span>
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

const actionPromoteBtn = {
  background: 'rgba(139, 92, 246, 0.1)',
  border: '1px solid rgba(139, 92, 246, 0.2)',
  color: 'var(--accent-secondary)',
  borderRadius: '6px',
  padding: '6px 12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: '600',
};

const eligibilityTag = {
  fontSize: '10px',
  fontWeight: '600',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  padding: '2px 6px',
  borderRadius: '4px',
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
  maxWidth: '540px',
  padding: '30px',
  maxHeight: '90vh',
  overflowY: 'auto',
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

const formRow = {
  display: 'flex',
  gap: '16px',
};
export default FacultyManagement;
