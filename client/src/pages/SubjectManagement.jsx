import { API_BASE } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

const SubjectManagement = () => {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [formData, setFormData] = useState({
    courseCode: '',
    name: '',
    weeklyHours: 4,
    medium: 'E/M',
    category: 'UG',
    department: 'Mathematics'
  });

  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchSubjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/subjects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSubjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleEditClick = (subject) => {
    setEditingSubject(subject);
    setFormData({
      courseCode: subject.courseCode,
      name: subject.name,
      weeklyHours: subject.weeklyHours,
      medium: subject.medium,
      category: subject.category,
      department: subject.department
    });
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingSubject(null);
    setFormData({
      courseCode: '',
      name: '',
      weeklyHours: 4,
      medium: 'E/M',
      category: 'UG',
      department: 'Mathematics'
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/subjects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMsg({ text: 'Subject deleted successfully!', type: 'success' });
        fetchSubjects();
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
      if (editingSubject) {
        res = await fetch(`${API_BASE}/api/subjects/${editingSubject._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch(`${API_BASE}/api/subjects`, {
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

      setMsg({ text: `Subject ${editingSubject ? 'updated' : 'created'} successfully!`, type: 'success' });
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Subjects...</div>;

  return (
    <div className="main-content">
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Subject Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Add, edit, and delete curriculum subjects, course codes, and hours.</p>
        </div>
        <button onClick={handleCreateClick} className="btn btn-primary">
          <Plus size={16} />
          <span>Add Subject</span>
        </button>
      </div>

      {msg.text && (
        <div style={msg.type === 'success' ? successAlert : errorAlert}>
          <div>{msg.text}</div>
        </div>
      )}

      {/* Subjects Grid */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Subject Name</th>
                <th>Medium</th>
                <th>Category</th>
                <th>Standard Hours</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub) => (
                <tr key={sub._id}>
                  <td style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>{sub.courseCode}</td>
                  <td style={{ fontWeight: '600', color: '#ffffff' }}>{sub.name}</td>
                  <td>
                    <span className={`badge ${sub.medium === 'E/M' ? 'badge-info' : sub.medium === 'T/M' ? 'badge-warning' : 'badge-secondary'}`}>
                      {sub.medium}
                    </span>
                  </td>
                  <td>{sub.category}</td>
                  <td>{sub.weeklyHours} hours/week</td>
                  <td>{sub.department}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleEditClick(sub)} 
                        style={actionIconBtn} 
                        title="Edit Details"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(sub._id)} 
                        style={actionIconBtn} 
                        title="Delete Subject"
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
              <h3>{editingSubject ? 'Edit Subject details' : 'Create New Subject'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ marginTop: '20px' }}>
              <div style={formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Course Code</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 23UMT10" 
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Subject Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. REAL ANALYSIS" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    required 
                  />
                </div>
              </div>

              <div style={formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Medium</label>
                  <select 
                    className="form-select"
                    value={formData.medium}
                    onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                  >
                    <option value="E/M">English Medium (E/M)</option>
                    <option value="T/M">Tamil Medium (T/M)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="UG">Undergraduate (UG)</option>
                    <option value="PG">Postgraduate (PG)</option>
                    <option value="Allied">Allied Math</option>
                  </select>
                </div>
              </div>

              <div style={formRow}>
                <div className="form-group" style={{ flex: 1 }}>
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
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>Save Subject</span>
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
export default SubjectManagement;
