import { API_BASE } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

const ClassManagement = () => {
  const { token } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    department: 'Mathematics',
    program: 'B.Sc Mathematics',
    year: 'I',
    medium: 'English',
    type: 'Primary',
    roomNumber: ''
  });

  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/classes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setClasses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleEditClick = (cls) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      department: cls.department,
      program: cls.program,
      year: cls.year,
      medium: cls.medium,
      type: cls.type,
      roomNumber: cls.roomNumber || ''
    });
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      department: 'Mathematics',
      program: 'B.Sc Mathematics',
      year: 'I',
      medium: 'English',
      type: 'Primary',
      roomNumber: ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class/batch?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/classes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMsg({ text: 'Class deleted successfully!', type: 'success' });
        fetchClasses();
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
      if (editingClass) {
        res = await fetch(`${API_BASE}/api/classes/${editingClass._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch(`${API_BASE}/api/classes`, {
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

      setMsg({ text: `Class ${editingClass ? 'updated' : 'created'} successfully!`, type: 'success' });
      setIsModalOpen(false);
      fetchClasses();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Classes...</div>;

  return (
    <div className="main-content">
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Class & Batch Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Add, edit, and configure primary batches, allied classes, and cross-department offerings.</p>
        </div>
        <button onClick={handleCreateClick} className="btn btn-primary">
          <Plus size={16} />
          <span>Add Class</span>
        </button>
      </div>

      {msg.text && (
        <div style={msg.type === 'success' ? successAlert : errorAlert}>
          <div>{msg.text}</div>
        </div>
      )}

      {/* Classes List */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Class / Batch Name</th>
                <th>Room No</th>
                <th>Program</th>
                <th>Year</th>
                <th>Medium</th>
                <th>Type</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls._id}>
                  <td style={{ fontWeight: '700', color: '#ffffff' }}>{cls.name}</td>
                  <td style={{ fontWeight: '600' }}>{cls.roomNumber || '-'}</td>
                  <td>{cls.program}</td>
                  <td>{cls.year}</td>
                  <td>
                    <span className={`badge ${cls.medium === 'English' ? 'badge-info' : cls.medium === 'Tamil' ? 'badge-warning' : 'badge-secondary'}`}>
                      {cls.medium}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${cls.type === 'Primary' ? 'badge-success' : 'badge-info'}`}>
                      {cls.type}
                    </span>
                  </td>
                  <td>{cls.department}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleEditClick(cls)} 
                        style={actionIconBtn} 
                        title="Edit Details"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(cls._id)} 
                        style={actionIconBtn} 
                        title="Delete Class"
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
              <h3>{editingClass ? 'Edit Class Details' : 'Create New Class'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ marginTop: '20px' }}>
              <div style={formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Class Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. III B.Sc E/M" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Program</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. B.Sc Mathematics" 
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    required 
                  />
                </div>
              </div>

              <div style={formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Year</label>
                  <select 
                    className="form-select"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  >
                    <option value="I">I Year</option>
                    <option value="II">II Year</option>
                    <option value="III">III Year</option>
                    <option value="Allied">Allied/Other</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Medium</label>
                  <select 
                    className="form-select"
                    value={formData.medium}
                    onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                  >
                    <option value="English">English</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Class Type</label>
                  <select 
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Primary">Primary Department Batch</option>
                    <option value="Allied">Allied Class</option>
                    <option value="Cross-department">Cross-department Class</option>
                    <option value="Course-specific">Course-specific Class</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Department</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required 
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Room Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 17"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>Save Class</span>
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
export default ClassManagement;
