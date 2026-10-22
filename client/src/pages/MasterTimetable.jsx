import { API_BASE } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Printer, Download, Filter, FileText } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = ['P1', 'P2', 'P3', 'P4', 'P5'];

const DAY_ORDER_MAP = {
  'Monday': 'Day I',
  'Tuesday': 'Day II',
  'Wednesday': 'Day III',
  'Thursday': 'Day IV',
  'Friday': 'Day V',
  'Saturday': 'Day VI'
};

const MasterTimetable = () => {
  const { token } = useAuth();
  const [timetable, setTimetable] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [viewMode, setViewMode] = useState('class'); // 'class' | 'faculty'
  const [filterId, setFilterId] = useState('');

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const facRes = await fetch(`${API_BASE}/api/faculty`, { headers });
      const facData = await facRes.json();
      if (Array.isArray(facData)) setFaculties(facData);

      const clsRes = await fetch(`${API_BASE}/api/classes`, { headers });
      const clsData = await clsRes.json();
      if (Array.isArray(clsData)) setClasses(clsData);

      // Fetch timetable
      const ttRes = await fetch(`${API_BASE}/api/timetable`, { headers });
      if (ttRes.ok) {
        const ttData = await ttRes.json();
        setTimetable(ttData);
      }

      if (clsData.length > 0) {
        setFilterId(clsData[0]._id);
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

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'class') {
      setFilterId(classes[0]?._id || '');
    } else if (mode === 'faculty') {
      setFilterId(faculties[0]?._id || '');
    } else {
      setFilterId('');
    }
  };

  const getSortedPrimaryClasses = () => {
    const classOrder = [
      'II M.Sc',
      'I M.Sc',
      'III B.Sc E/M',
      'III B.Sc T/M',
      'II B.Sc E/M',
      'II B.Sc T/M',
      'I B.Sc E/M',
      'I B.Sc T/M'
    ];
    
    return classes
      .filter(c => c.type === 'Primary')
      .sort((a, b) => {
        let indexA = classOrder.indexOf(a.name);
        let indexB = classOrder.indexOf(b.name);
        if (indexA === -1) indexA = 99;
        if (indexB === -1) indexB = 99;
        return indexA - indexB;
      });
  };

  const formatCellContent = (entry) => {
    if (!entry) return '-';
    const subName = entry.subject?.name?.toLowerCase() || '';
    const subCode = entry.subject?.courseCode?.toLowerCase() || '';
    const facName = entry.faculty?.shortName || '';
    
    if (subName.includes('english') || subCode.includes('aec') || subCode.includes('eng')) {
      return `ENG${facName ? ` - ${facName}` : ''}`;
    }
    if (subName.includes('tamil') || subName.includes('ethical values') || subCode.includes('tam')) {
      return `TAM${facName ? ` - ${facName}` : ''}`;
    }
    
    return facName || 'FREE';
  };

  const getAlliedEntriesForCell = (day, period) => {
    if (!timetable || !timetable.schedule) return [];
    return timetable.schedule.filter(entry => 
      entry.day === day && 
      entry.period === period && 
      entry.class?.type === 'Allied'
    );
  };

  const formatAlliedEntry = (entry) => {
    const className = entry.class?.name || '';
    const facName = entry.faculty?.shortName || '';
    
    let classAbbr = className;
    if (className.toUpperCase().includes('STATISTICS')) classAbbr = 'STAT';
    else if (className.toUpperCase().includes('PHYSICS')) classAbbr = 'PHY';
    else if (className.toUpperCase().includes('CHEMISTRY')) classAbbr = 'CHEM';
    else if (className.toUpperCase().includes('COMPUTER SCIENCE')) classAbbr = 'CS';
    else if (className.toUpperCase().includes('GEOLOGY')) classAbbr = 'GEO';
    else if (className.toUpperCase().includes('BCA')) classAbbr = 'BCA';
    else if (className.toUpperCase().includes('MCA')) classAbbr = 'MCA';
    
    return `${classAbbr} - ${facName || 'FREE'}`;
  };

  const getFilteredGrid = () => {
    if (!timetable || !timetable.schedule) return null;

    const grid = {};
    DAYS.forEach(day => {
      grid[day] = {};
      PERIODS.forEach(period => {
        grid[day][period] = null;
      });
    });

    timetable.schedule.forEach(entry => {
      if (viewMode === 'class' && entry.class?._id === filterId) {
        grid[entry.day][entry.period] = entry;
      } else if (viewMode === 'faculty' && entry.faculty?._id === filterId) {
        grid[entry.day][entry.period] = entry;
      }
    });

    return grid;
  };

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = () => {
    if (!timetable || !timetable.schedule) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Day,Period,Class,Subject,Faculty,Medium\n";

    timetable.schedule.forEach(entry => {
      const row = [
        entry.day,
        entry.period,
        `"${entry.class?.name || ''}"`,
        `"${entry.subject?.name || ''}"`,
        `"${entry.faculty?.name || ''}"`,
        `"${entry.subject?.medium || ''}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timetable_export_${viewMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Master Timetable...</div>;

  const filteredGrid = getFilteredGrid();
  const selectedName = viewMode === 'class' 
    ? classes.find(c => c._id === filterId)?.name 
    : faculties.find(f => f._id === filterId)?.name;

  return (
    <div className="main-content">
      {/* Header */}
      <div style={headerStyle} className="no-print">
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>College Master Timetable</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View, search and print class-wise or staff-wise weekly timetable templates.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handlePrint} className="btn btn-secondary">
            <Printer size={16} />
            <span>Print Layout</span>
          </button>
          <button onClick={exportCSV} className="btn btn-secondary">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="glass-panel no-print" style={filterPanelStyle}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => handleViewModeChange('class')} 
            className="btn" 
            style={toggleBtnStyle(viewMode === 'class')}
          >
            Class-Wise
          </button>
          <button 
            onClick={() => handleViewModeChange('faculty')} 
            className="btn" 
            style={toggleBtnStyle(viewMode === 'faculty')}
          >
            Staff-Wise
          </button>
          <button 
            onClick={() => handleViewModeChange('department')} 
            className="btn" 
            style={toggleBtnStyle(viewMode === 'department')}
          >
            Department-Wide
          </button>
        </div>

        {viewMode !== 'department' && (
          <div className="form-group" style={{ margin: 0, width: '280px' }}>
            <label className="form-label">
              Select {viewMode === 'class' ? 'Class Batch' : 'Faculty Member'}
            </label>
            <select 
              className="form-select" 
              value={filterId} 
              onChange={(e) => setFilterId(e.target.value)}
            >
              {viewMode === 'class' ? (
                classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)
              ) : (
                faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)
              )}
            </select>
          </div>
        )}
      </div>

      {/* Grid Display */}
      {filteredGrid || viewMode === 'department' ? (
        viewMode === 'department' ? (
          <div className="glass-panel" style={{ padding: '30px', overflowX: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                GOVERNMENT ARTS COLLEGE (AUTONOMOUS), SALEM - 636007
              </h2>
              <h3 style={{ fontSize: '18px', margin: '6px 0', color: 'var(--text-secondary)' }}>
                DEPARTMENT OF MATHEMATICS
              </h3>
              <span style={{ fontSize: '15px', color: 'var(--accent-secondary)', fontWeight: '600' }}>
                MASTER TIME TABLE - ACADEMIC YEAR 2026-2027 (ODD SEM)
              </span>
            </div>

            <table className="custom-table department-master-table" style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid var(--border-color)' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ border: '1px solid var(--border-color)', padding: '12px', width: '80px', textAlign: 'center' }}>DAY</th>
                  <th style={{ border: '1px solid var(--border-color)', padding: '12px', width: '120px', textAlign: 'left' }}>CLASS</th>
                  <th style={{ border: '1px solid var(--border-color)', padding: '12px', width: '80px', textAlign: 'center' }}>ROOM</th>
                  <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>1 (09:30-10:30)</th>
                  <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>2 (10:30-11:30)</th>
                  <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>3 (11:30-12:30)</th>
                  <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>4 (01:30-02:30)</th>
                  <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>5 (02:30-03:30)</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => {
                  const sortedClasses = getSortedPrimaryClasses();
                  const dayOrderLabel = DAY_ORDER_MAP[day] || day;
                  const rowSpanCount = sortedClasses.length + 1; // primary classes + Allied row

                  return (
                    <React.Fragment key={day}>
                      {sortedClasses.map((cls, idx) => {
                        const cells = PERIODS.map(period => {
                          const entry = timetable?.schedule?.find(e => 
                            e.day === day && 
                            e.class?._id === cls._id && 
                            e.period === period
                          );
                          return entry;
                        });

                        return (
                          <tr key={`${day}-${cls._id}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            {idx === 0 && (
                              <td 
                                rowSpan={rowSpanCount} 
                                style={{ 
                                  border: '1px solid var(--border-color)', 
                                  padding: '12px', 
                                  textAlign: 'center', 
                                  fontWeight: '750', 
                                  color: 'var(--accent-secondary)',
                                  background: 'rgba(255,255,255,0.01)',
                                  writingMode: 'vertical-lr',
                                  transform: 'rotate(180deg)',
                                  verticalAlign: 'middle',
                                  fontSize: '18px',
                                  letterSpacing: '2px'
                                }}
                              >
                                {dayOrderLabel}
                              </td>
                            )}
                            <td style={{ border: '1px solid var(--border-color)', padding: '12px', fontWeight: '600', color: '#ffffff' }}>
                              {cls.name}
                            </td>
                            <td style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>
                              {cls.roomNumber || '-'}
                            </td>
                            {cells.map((entry, pIdx) => (
                              <td 
                                key={pIdx} 
                                style={{ 
                                  border: '1px solid var(--border-color)', 
                                  padding: '8px', 
                                  textAlign: 'center',
                                  verticalAlign: 'middle' 
                                }}
                                title={entry ? `${entry.subject?.name} (${entry.subject?.courseCode})\nFaculty: ${entry.faculty?.name}` : 'Free Period'}
                              >
                                {entry ? (
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
                                    {formatCellContent(entry)}
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                      
                      {/* Allied row for this day */}
                      <tr key={`${day}-allied`} style={{ borderBottom: '2px solid var(--border-color)', background: 'rgba(255,255,255,0.005)' }}>
                        <td style={{ border: '1px solid var(--border-color)', padding: '12px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
                          ALLIED
                        </td>
                        <td style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          -
                        </td>
                        {PERIODS.map((period, pIdx) => {
                          const alliedEntries = getAlliedEntriesForCell(day, period);
                          return (
                            <td 
                              key={pIdx} 
                              style={{ 
                                border: '1px solid var(--border-color)', 
                                padding: '8px', 
                                textAlign: 'center',
                                verticalAlign: 'middle'
                              }}
                            >
                              {alliedEntries.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                  {alliedEntries.map(entry => (
                                    <div 
                                      key={entry._id} 
                                      style={{ 
                                        fontSize: '11px', 
                                        fontWeight: '600', 
                                        color: 'var(--text-secondary)',
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        width: '100%',
                                        textAlign: 'center'
                                      }}
                                      title={`${entry.class?.name}\nSubject: ${entry.subject?.name}\nFaculty: ${entry.faculty?.name}`}
                                    >
                                      {formatAlliedEntry(entry)}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '30px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-display)' }}>
                Weekly Timetable Allocation
              </h2>
              <span style={{ fontSize: '15px', color: 'var(--accent-secondary)', fontWeight: '600' }}>
                {selectedName} | Government Arts College (A), Salem-7
              </span>
            </div>

            <div className="timetable-grid-wrapper">
              <div className="timetable-header-grid">
                <div className="timetable-cell timetable-cell-header timetable-day-label">Day</div>
                {PERIODS.map(p => (
                  <div key={p} className="timetable-cell timetable-cell-header">
                    {p}
                    <span style={clockTimeLabel}>{p === 'P1' ? '09:30-10:30' : p === 'P2' ? '10:30-11:30' : p === 'P3' ? '11:30-12:30' : p === 'P4' ? '01:30-02:30' : '02:30-03:30'}</span>
                  </div>
                ))}
              </div>

              {DAYS.map(day => (
                <div key={day} className="timetable-row-grid">
                  <div className="timetable-cell timetable-day-label">{day}</div>
                  {PERIODS.map(period => {
                    const entry = filteredGrid[day][period];
                    
                    return (
                      <div key={period} className="timetable-cell">
                        {entry ? (
                          <div style={entryDisplayCard}>
                            {viewMode === 'class' ? (
                              <>
                                <span style={entryCode}>{entry.subject?.courseCode}</span>
                                <span style={entrySubject}>{entry.subject?.name}</span>
                                <span style={entryFaculty} title={entry.faculty?.name}>{entry.faculty?.shortName || entry.faculty?.name}</span>
                              </>
                            ) : (
                              <>
                                <span style={entryCode}>{entry.subject?.courseCode}</span>
                                <span style={entrySubject}>{entry.subject?.name}</span>
                                <span style={entryClass}>{entry.class?.name}</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '12px' }}>
                            Free Period
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No timetable schedule generated yet. Please generate one from the admin dashboard.
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

const filterPanelStyle = {
  padding: '20px 30px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
  flexWrap: 'wrap',
  gap: '16px',
};

const toggleBtnStyle = (isActive) => ({
  background: isActive ? 'linear-gradient(135deg, var(--accent-primary) 0%, #7c3aed 100%)' : 'rgba(255, 255, 255, 0.05)',
  color: '#ffffff',
  border: `1px solid ${isActive ? 'transparent' : 'var(--border-color)'}`,
  fontWeight: isActive ? '600' : '400',
});

const clockTimeLabel = {
  display: 'block',
  fontSize: '9px',
  color: 'var(--text-muted)',
  fontWeight: 'normal',
  marginTop: '2px',
};

const entryDisplayCard = {
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
  padding: '6px',
  background: 'rgba(139, 92, 246, 0.08)',
  border: '1px solid rgba(139, 92, 246, 0.15)',
  borderRadius: '6px',
  width: '100%',
  height: '100%',
  justifyContent: 'center',
};

const entryCode = {
  fontSize: '9px',
  fontWeight: '700',
  color: 'var(--accent-secondary)',
};

const entrySubject = {
  fontSize: '11px',
  fontWeight: '600',
  color: '#ffffff',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const entryFaculty = {
  fontSize: '10px',
  color: 'var(--text-secondary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const entryClass = {
  fontSize: '10px',
  color: 'var(--text-secondary)',
  fontWeight: '600',
};
export default MasterTimetable;
