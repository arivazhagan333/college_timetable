import { API_BASE } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, RefreshCw } from 'lucide-react';

const SettingsPage = () => {
  const { token } = useAuth();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateSetting = async (key, val) => {
    setUpdatingKey(key);
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key, value: val })
      });
      if (res.ok) {
        setSuccessMsg(`Setting "${key}" updated successfully!`);
        fetchSettings();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingKey('');
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Settings...</div>;

  return (
    <div className="main-content">
      <div>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>System Settings</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
          Configure constraints, default workload limits, periods per day, and semester details.
        </p>
      </div>

      {successMsg && (
        <div style={successAlert}>
          {successMsg}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {settings.map((set) => (
            <div key={set._id} style={settingRowStyle}>
              <div style={{ flex: 2 }}>
                <h3 style={{ fontSize: '15px', color: '#ffffff' }}>{set.description || set.key}</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Key: {set.key}</span>
              </div>

              <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center' }}>
                {set.key === 'noConsecutivePeriods' ? (
                  <select 
                    className="form-select"
                    value={set.value.toString()}
                    onChange={(e) => handleUpdateSetting(set.key, e.target.value === 'true')}
                    disabled={updatingKey === set.key}
                  >
                    <option value="true">ON (Enforced)</option>
                    <option value="false">OFF (Ignored)</option>
                  </select>
                ) : typeof set.value === 'number' ? (
                  <input 
                    type="number" 
                    className="form-input" 
                    defaultValue={set.value}
                    onBlur={(e) => handleUpdateSetting(set.key, parseInt(e.target.value))}
                    disabled={updatingKey === set.key}
                  />
                ) : (
                  <input 
                    type="text" 
                    className="form-input" 
                    defaultValue={set.value.toString()}
                    onBlur={(e) => handleUpdateSetting(set.key, e.target.value)}
                    disabled={updatingKey === set.key}
                  />
                )}
                
                {updatingKey === set.key && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Saving...</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Styles
const settingRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '20px',
  borderBottom: '1px solid var(--border-color)',
  flexWrap: 'wrap',
  gap: '16px',
};

const successAlert = {
  background: 'var(--color-success-bg)',
  border: '1px solid rgba(16, 185, 129, 0.3)',
  color: '#a7f3d0',
  padding: '14px 20px',
  borderRadius: '10px',
  marginBottom: '24px',
};
export default SettingsPage;
