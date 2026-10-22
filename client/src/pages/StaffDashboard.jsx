import { API_BASE } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, BookOpen, Clock, Award, Compass, Printer } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = ['P1', 'P2', 'P3', 'P4', 'P5'];

const StaffDashboard = () => {
  const { token, user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // Find current day name
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const currentDay = DAYS.includes(todayName) ? todayName : 'Monday';

  const fetchTimetable = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/timetable`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter timetable entries for current staff user
        const staffSchedule = (data.schedule || []).filter(entry => 
          entry.faculty?._id === user.id
        );
        setSchedule(staffSchedule);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchTimetable();
    }
  }, [user, token]);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Staff Portal...</div>;

  // Compute daily workload counts
  const dailyWorkload = {};
  DAYS.forEach(day => {
    dailyWorkload[day] = schedule.filter(s => s.day === day).length;
  });

  const totalAssigned = schedule.length;
  const targetHrs = user.isHOD ? 12 : 16;

  // Filter today's teaching slots
  const todayClasses = schedule
    .filter(s => s.day === currentDay)
    .sort((a, b) => PERIODS.indexOf(a.period) - PERIODS.indexOf(b.period));

  // Build weekly schedule grid
  const getWeeklyGrid = () => {
    const grid = {};
    DAYS.forEach(day => {
      grid[day] = {};
      PERIODS.forEach(period => {
        grid[day][period] = null;
      });
    });

    schedule.forEach(entry => {
      grid[entry.day][entry.period] = entry;
    });

    return grid;
  };

  const weeklyGrid = getWeeklyGrid();

  return (
    <div className="main-content">
      {/* Welcome Banner */}
      <div style={welcomeBannerStyle}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>Welcome back, {user.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Designation: {user.isHOD ? 'Department HOD' : 'Associate/Assistant Professor'} | Mathematics
          </p>
        </div>
        <div style={workloadPillStyle(totalAssigned === targetHrs)}>
          <Clock size={16} />
          <span>Workload Status: <strong>{totalAssigned} / {targetHrs} periods</strong></span>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '30px' }}>
        {/* Daily Distribution Card */}
        <div className="glass-card" style={statCardStyle}>
          <h3 style={cardTitleStyle}>Daily Workload</h3>
          <div style={dailyBarContainer}>
            {DAYS.map(day => (
              <div key={day} style={dayBarItem}>
                <span style={dayLabelStyle}>{day.substring(0, 3)}</span>
                <div style={barBackground}>
                  <div style={barFill(dailyWorkload[day])} />
                </div>
                <span style={dayCountStyle}>{dailyWorkload[day]} hrs</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info card */}
        <div className="glass-card" style={statCardStyle}>
          <h3 style={cardTitleStyle}>HOD Allotment Rules</h3>
          <div style={ruleListStyle}>
            <div style={ruleItemStyle}>
              <Award size={14} color="var(--accent-secondary)" />
              <span>HOD Target: 12 periods/week</span>
            </div>
            <div style={ruleItemStyle}>
              <Award size={14} color="var(--accent-secondary)" />
              <span>Regular Target: 16 periods/week (3x4 days, 2x2 days)</span>
            </div>
            <div style={ruleItemStyle}>
              <Award size={14} color="var(--accent-secondary)" />
              <span>Hard Rule: No consecutive teaching periods allowed</span>
            </div>
          </div>
        </div>

        {/* Print quick summary */}
        <div className="glass-card" style={statCardStyle}>
          <h3 style={cardTitleStyle}>Quick Actions</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Export or print your personal weekly timetable copy.
          </p>
          <button onClick={() => window.print()} className="btn btn-secondary" style={{ width: '100%' }}>
            <Printer size={16} />
            <span>Print My Timetable</span>
          </button>
        </div>
      </div>

      {/* Today's Timetable Section */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--accent-primary)" />
          <span>Today's Classes ({currentDay})</span>
        </h2>
        
        {todayClasses.length > 0 ? (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {todayClasses.map((item, idx) => (
              <div key={idx} style={todayClassCardStyle}>
                <span style={todayPeriodBadge}>{item.period}</span>
                <h4 style={{ fontSize: '15px', color: '#ffffff', margin: '4px 0' }}>{item.subject?.name}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <span>Class: <strong>{item.class?.name}</strong></span>
                  <span className="badge badge-info">{item.subject?.medium}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
            No scheduled classes for today! Enjoy your prep time.
          </div>
        )}
      </div>

      {/* Weekly Timetable grid */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass size={18} color="var(--accent-secondary)" />
          <span>My Weekly Timetable Template</span>
        </h2>

        <div className="timetable-grid-wrapper">
          <div className="timetable-header-grid">
            <div className="timetable-cell timetable-cell-header timetable-day-label">Day</div>
            {PERIODS.map(p => (
              <div key={p} className="timetable-cell timetable-cell-header">
                {p}
              </div>
            ))}
          </div>

          {DAYS.map(day => (
            <div key={day} className="timetable-row-grid">
              <div className="timetable-cell timetable-day-label">{day}</div>
              {PERIODS.map(period => {
                const entry = weeklyGrid[day][period];
                
                return (
                  <div key={period} className="timetable-cell">
                    {entry ? (
                      <div style={entryCardStyle}>
                        <span style={entrySubjectStyle}>{entry.subject?.name}</span>
                        <span style={entryClassStyle}>Class: {entry.class?.name}</span>
                        <span style={entryMediumStyle}>{entry.subject?.medium}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11px' }}>Free</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
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
  flexWrap: 'wrap',
  gap: '16px',
};

const workloadPillStyle = (isMatched) => ({
  background: isMatched ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
  border: `1px solid ${isMatched ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  color: isMatched ? '#34d399' : '#fbbf24',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const statCardStyle = {
  padding: '20px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

const cardTitleStyle = {
  fontSize: '15px',
  marginBottom: '12px',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '8px',
};

const dailyBarContainer = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const dayBarItem = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '12px',
};

const dayLabelStyle = {
  width: '32px',
  color: 'var(--text-secondary)',
  fontWeight: '600',
};

const barBackground = {
  flex: 1,
  height: '8px',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '4px',
  overflow: 'hidden',
};

const barFill = (count) => {
  const percent = (count / 3) * 100;
  let bg = 'var(--accent-primary)';
  if (count === 3) bg = 'linear-gradient(to right, #8b5cf6, #c084fc)';
  if (count === 2) bg = '#3b82f6';
  
  return {
    width: `${percent}%`,
    height: '100%',
    background: bg,
    borderRadius: '4px',
  };
};

const dayCountStyle = {
  width: '40px',
  textAlign: 'right',
  color: '#ffffff',
  fontWeight: '600',
};

const ruleListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const ruleItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '12px',
  color: 'var(--text-secondary)',
};

const todayClassCardStyle = {
  flex: '1 1 200px',
  maxWidth: '280px',
  padding: '16px',
  background: 'rgba(139, 92, 246, 0.08)',
  border: '1px solid rgba(139, 92, 246, 0.2)',
  borderRadius: '10px',
  display: 'flex',
  flexDirection: 'column',
};

const todayPeriodBadge = {
  alignSelf: 'flex-start',
  background: 'var(--accent-primary)',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: 'bold',
  padding: '2px 8px',
  borderRadius: '4px',
};

const entryCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  padding: '6px',
  background: 'rgba(139, 92, 246, 0.06)',
  border: '1px solid rgba(139, 92, 246, 0.15)',
  borderRadius: '6px',
  width: '100%',
  height: '100%',
  justifyContent: 'center',
};

const entrySubjectStyle = {
  fontSize: '11px',
  fontWeight: '600',
  color: '#ffffff',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const entryClassStyle = {
  fontSize: '10px',
  color: 'var(--text-secondary)',
};

const entryMediumStyle = {
  fontSize: '9px',
  fontWeight: '700',
  color: 'var(--accent-secondary)',
};
export default StaffDashboard;
