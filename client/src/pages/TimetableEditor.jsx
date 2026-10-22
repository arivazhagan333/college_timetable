import { API_BASE } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, RefreshCw, Lock, Unlock, AlertTriangle, ShieldAlert, Sparkles, Check } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = ['P1', 'P2', 'P3', 'P4', 'P5'];

const TimetableEditor = () => {
  const { token } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [timetable, setTimetable] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [currentSchedule, setCurrentSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [valResult, setValResult] = useState({ valid: true, conflicts: [] });
  const [msg, setMsg] = useState({ text: '', type: '' });
  
  // Drag-and-drop state
  const [draggedItem, setDraggedItem] = useState(null); // { type: 'new' | 'existing', data: allocation | cell }

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const clsRes = await fetch(`${API_BASE}/api/classes`, { headers });
      if (clsRes.ok) {
        const clsData = await clsRes.json();
        if (Array.isArray(clsData)) {
          setClasses(clsData);
          if (clsData.length > 0) {
            setSelectedClassId(prev => prev || clsData[0]._id);
          }
        }
      }

      const allocRes = await fetch(`${API_BASE}/api/allocations`, { headers });
      if (allocRes.ok) {
        const allocData = await allocRes.json();
        if (Array.isArray(allocData)) {
          setAllocations(allocData);
        }
      }

      // Fetch timetable
      const ttRes = await fetch(`${API_BASE}/api/timetable`, { headers });
      if (ttRes.ok) {
        const ttData = await ttRes.json();
        if (ttData && Array.isArray(ttData.schedule)) {
          setTimetable(ttData);
          setIsLocked(ttData.isLocked);
          setCurrentSchedule(ttData.schedule);
          
          // Validate
          const valRes = await fetch(`${API_BASE}/api/timetable/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ schedule: ttData.schedule })
          });
          if (valRes.ok) {
            const valData = await valRes.json();
            setValResult(valData);
          }
        }
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

  const handleClassChange = (e) => {
    setSelectedClassId(e.target.value);
  };

  // Find cell details for selected class
  const getCellEntry = (day, period) => {
    return currentSchedule.find(entry => 
      entry.class?._id === selectedClassId && 
      entry.day === day && 
      entry.period === period
    );
  };

  // Drag Handlers
  const handleDragStartFromSidebar = (e, alloc) => {
    if (isLocked) return;
    setDraggedItem({ type: 'new', data: alloc });
    e.dataTransfer.setData('text/plain', 'sidebar');
  };

  const handleDragStartFromGrid = (e, day, period, entry) => {
    if (isLocked) return;
    setDraggedItem({ type: 'existing', data: { day, period, entry } });
    e.dataTransfer.setData('text/plain', 'grid');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetDay, targetPeriod) => {
    e.preventDefault();
    if (!draggedItem || isLocked) return;

    let newSchedule = [...currentSchedule];

    if (draggedItem.type === 'new') {
      const alloc = draggedItem.data;
      
      // Remove any existing entry in target slot for this class
      newSchedule = newSchedule.filter(entry => 
        !(entry.class?._id === selectedClassId && entry.day === targetDay && entry.period === targetPeriod)
      );

      // Add new entry
      newSchedule.push({
        day: targetDay,
        period: targetPeriod,
        class: alloc.class,
        subject: alloc.subject,
        faculty: alloc.faculty
      });

    } else if (draggedItem.type === 'existing') {
      const { day: sourceDay, period: sourcePeriod, entry } = draggedItem.data;

      // Swap logic or Move logic
      const targetEntry = getCellEntry(targetDay, targetPeriod);

      if (targetEntry) {
        // Swap: source gets target's details, target gets source's details
        newSchedule = newSchedule.map(item => {
          if (item.class?._id === selectedClassId && item.day === sourceDay && item.period === sourcePeriod) {
            return { ...item, subject: targetEntry.subject, faculty: targetEntry.faculty };
          }
          if (item.class?._id === selectedClassId && item.day === targetDay && item.period === targetPeriod) {
            return { ...item, subject: entry.subject, faculty: entry.faculty };
          }
          return item;
        });
      } else {
        // Move: update source cell to target cell
        newSchedule = newSchedule.map(item => {
          if (item.class?._id === selectedClassId && item.day === sourceDay && item.period === sourcePeriod) {
            return { ...item, day: targetDay, period: targetPeriod };
          }
          return item;
        });
      }
    }

    setDraggedItem(null);
    
    // Check validation on backend before applying
    try {
      const valRes = await fetch(`${API_BASE}/api/timetable/validate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ schedule: newSchedule })
      });
      const valData = await valRes.json();
      
      if (!valData.valid) {
        // Show conflicts, but let them make edits. We can warn them.
        setValResult(valData);
        setMsg({ text: `Warning: This placement introduces ${valData.conflicts.length} conflict(s).`, type: 'error' });
      } else {
        setValResult(valData);
        setMsg({ text: 'Valid allocation placement.', type: 'success' });
      }

      setCurrentSchedule(newSchedule);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCellClickToRemove = (day, period) => {
    if (isLocked) return;
    const newSchedule = currentSchedule.filter(entry => 
      !(entry.class?._id === selectedClassId && entry.day === day && entry.period === period)
    );
    setCurrentSchedule(newSchedule);
    setMsg({ text: 'Slot removed. Click Save to persist changes.', type: 'warning' });
  };

  const handleSave = async () => {
    setMsg({ text: '', type: '' });
    try {
      const res = await fetch(`${API_BASE}/api/timetable/save`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ schedule: currentSchedule })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMsg({ 
        text: `Changes saved successfully! Status: ${data.timetable.status}`, 
        type: data.timetable.status === 'Validated' ? 'success' : 'error' 
      });
      fetchData();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handleLockUnlock = async () => {
    setMsg({ text: '', type: '' });
    try {
      const res = await fetch(`${API_BASE}/api/timetable/lock`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          isLocked: !isLocked,
          status: !isLocked ? 'Locked' : 'Validated'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setIsLocked(data.isLocked);
      setMsg({ text: `Timetable ${data.isLocked ? 'locked' : 'unlocked'} successfully!`, type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Editor...</div>;

  // Filter allocations mapped to current class
  const classAllocations = allocations.filter(a => a.class?._id === selectedClassId);

  // Calculate allocation remaining hours
  const getAllocUsage = (alloc) => {
    const assignedCount = currentSchedule.filter(entry => 
      entry.class?._id === selectedClassId && 
      entry.subject?._id === alloc.subject?._id && 
      entry.faculty?._id === alloc.faculty?._id
    ).length;
    
    return {
      assigned: assignedCount,
      total: alloc.weeklyHours,
      remaining: alloc.weeklyHours - assignedCount
    };
  };

  return (
    <div className="main-content">
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Timetable Grid Editor</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Drag and drop cards to configure class schedules with real-time constraint validation.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleLockUnlock} 
            className="btn btn-secondary"
            style={{ border: `1px solid ${isLocked ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}` }}
          >
            {isLocked ? <Lock size={16} color="#ef4444" /> : <Unlock size={16} color="#10b981" />}
            <span>{isLocked ? 'Unlock Schedule' : 'Finalize & Lock'}</span>
          </button>
          
          <button 
            onClick={handleSave} 
            className="btn btn-primary"
            disabled={isLocked}
          >
            <Save size={16} />
            <span>Save Timetable</span>
          </button>
        </div>
      </div>

      {msg.text && (
        <div style={msg.type === 'success' ? successAlert : errorAlert}>
          <div>{msg.text}</div>
        </div>
      )}

      {/* Selector & Info Panel */}
      <div className="glass-panel" style={selectorPanel}>
        <div className="form-group" style={{ margin: 0, width: '300px' }}>
          <label className="form-label">Select Class to Display</label>
          <select className="form-select" value={selectedClassId} onChange={handleClassChange}>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name} ({c.program})</option>
            ))}
          </select>
        </div>

        <div style={validationInfoPanel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Validation:</span>
            <span className={`badge badge-${valResult.valid ? 'success' : 'danger'}`}>
              {valResult.valid ? 'VALID' : 'INVALID'}
            </span>
          </div>
          {valResult.conflicts.length > 0 && (
            <span style={{ fontSize: '12px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={14} />
              {valResult.conflicts.length} conflict(s) present in system
            </span>
          )}
        </div>
      </div>

      {/* Main Workspace: Sidebar on left (Allocations list), Grid on right */}
      <div style={workspaceLayout}>
        {/* Left Side: Drag Cards */}
        <div className="glass-panel" style={cardSidebarStyle}>
          <h3 style={sidebarTitleStyle}>Workload Cards</h3>
          <p style={sidebarHelpStyle}>Drag cards into the calendar grid cells on the right.</p>
          
          <div style={cardsContainerStyle}>
            {classAllocations.map((alloc) => {
              const usage = getAllocUsage(alloc);
              const isDepleted = usage.remaining <= 0;

              return (
                <div 
                  key={alloc._id}
                  draggable={!isDepleted && !isLocked}
                  onDragStart={(e) => handleDragStartFromSidebar(e, alloc)}
                  style={draggableCardStyle(isDepleted)}
                >
                  <div style={cardHeaderStyle}>
                    <span style={cardCodeStyle}>{alloc.subject?.courseCode}</span>
                    <span style={cardHrsStyle(isDepleted)}>
                      {usage.assigned} / {usage.total} hrs
                    </span>
                  </div>
                  <div style={cardSubjectTitleStyle}>{alloc.subject?.name}</div>
                  <div style={cardFacultyStyle} title={alloc.faculty?.name}>Staff: {alloc.faculty?.shortName || alloc.faculty?.name}</div>
                  
                  {isDepleted && (
                    <div style={depletedOverlayStyle}>
                      <Check size={14} />
                      <span>All Hrs Placed</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Timetable Grid */}
        <div style={{ flex: 1 }}>
          <div className="timetable-grid-wrapper">
            {/* Header: Periods */}
            <div className="timetable-header-grid">
              <div className="timetable-cell timetable-cell-header timetable-day-label">Day</div>
              {PERIODS.map(p => (
                <div key={p} className="timetable-cell timetable-cell-header">
                  {p}
                  <span style={clockTimeLabel(p)}>
                    {p === 'P1' && '09:30 - 10:30'}
                    {p === 'P2' && '10:30 - 11:30'}
                    {p === 'P3' && '11:30 - 12:30'}
                    {p === 'P4' && '01:30 - 02:30'}
                    {p === 'P5' && '02:30 - 03:30'}
                  </span>
                </div>
              ))}
            </div>

            {/* Rows: Days */}
            {DAYS.map(day => (
              <div key={day} className="timetable-row-grid">
                <div className="timetable-cell timetable-day-label">{day}</div>
                {PERIODS.map(period => {
                  const entry = getCellEntry(day, period);
                  
                  return (
                    <div 
                      key={period} 
                      className="timetable-cell"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day, period)}
                      style={{ background: entry ? 'rgba(139, 92, 246, 0.03)' : 'transparent' }}
                    >
                      {entry ? (
                        <div 
                          draggable={!isLocked}
                          onDragStart={(e) => handleDragStartFromGrid(e, day, period, entry)}
                          className="timetable-entry-card"
                          style={{ position: 'relative' }}
                        >
                          <span style={entryCode}>{entry.subject?.courseCode}</span>
                          <span style={entrySub}>{entry.subject?.name}</span>
                          <span style={entryFac} title={entry.faculty?.name}>{entry.faculty?.shortName || entry.faculty?.name}</span>
                          
                          {!isLocked && (
                            <button 
                              onClick={() => handleCellClickToRemove(day, period)}
                              style={removeBtnStyle}
                              title="Clear Cell"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="timetable-cell-free">Free</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
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

const selectorPanel = {
  padding: '20px 30px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
  flexWrap: 'wrap',
  gap: '16px',
};

const validationInfoPanel = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '6px',
};

const workspaceLayout = {
  display: 'flex',
  gap: '24px',
  alignItems: 'flex-start',
};

const cardSidebarStyle = {
  width: '280px',
  padding: '20px',
  alignSelf: 'stretch',
};

const sidebarTitleStyle = {
  fontSize: '16px',
  fontWeight: '700',
  marginBottom: '4px',
};

const sidebarHelpStyle = {
  fontSize: '11px',
  color: 'var(--text-muted)',
  marginBottom: '16px',
};

const cardsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  maxHeight: '500px',
  overflowY: 'auto',
  paddingRight: '6px',
};

const draggableCardStyle = (isDepleted) => ({
  background: isDepleted ? 'rgba(255, 255, 255, 0.02)' : 'rgba(139, 92, 246, 0.08)',
  border: `1px solid ${isDepleted ? 'rgba(255, 255, 255, 0.04)' : 'rgba(139, 92, 246, 0.2)'}`,
  borderRadius: '8px',
  padding: '12px',
  cursor: isDepleted ? 'not-allowed' : 'grab',
  position: 'relative',
  opacity: isDepleted ? 0.5 : 1,
  transition: 'all 0.2s ease',
});

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px',
};

const cardCodeStyle = {
  fontSize: '10px',
  fontWeight: '700',
  color: 'var(--accent-secondary)',
  background: 'rgba(192, 132, 252, 0.1)',
  padding: '2px 6px',
  borderRadius: '4px',
};

const cardHrsStyle = (isDepleted) => ({
  fontSize: '11px',
  fontWeight: '700',
  color: isDepleted ? 'var(--text-muted)' : '#ffffff',
});

const cardSubjectTitleStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#ffffff',
  marginBottom: '4px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const cardFacultyStyle = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
};

const depletedOverlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  color: '#34d399',
  fontSize: '12px',
  fontWeight: '600',
};

const clockTimeLabel = (period) => ({
  display: 'block',
  fontSize: '9px',
  color: 'var(--text-muted)',
  fontWeight: 'normal',
  marginTop: '2px',
});

const entryCode = {
  fontSize: '9px',
  fontWeight: '700',
  color: 'var(--accent-secondary)',
  alignSelf: 'flex-start',
};

const entrySub = {
  fontSize: '11px',
  fontWeight: '600',
  color: '#ffffff',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const entryFac = {
  fontSize: '10px',
  fontWeight: '500',
  color: 'var(--text-secondary)',
};

const removeBtnStyle = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  background: '#ef4444',
  color: '#ffffff',
  border: 'none',
  borderRadius: '50%',
  width: '14px',
  height: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '10px',
  cursor: 'pointer',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
export default TimetableEditor;
