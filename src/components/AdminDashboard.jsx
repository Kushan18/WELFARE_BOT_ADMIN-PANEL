import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

export default function AdminDashboard({ adminKey: propAdminKey, onExit }) {
  const storedKey = localStorage.getItem('adminKey') || '';
  const [adminKey, setAdminKey] = useState(propAdminKey || storedKey);
  const [keyPrompt, setKeyPrompt] = useState(!propAdminKey && !storedKey);
  const [tempKey, setTempKey] = useState('');

  const [activeTab, setActiveTab] = useState('analytics');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animationKey, setAnimationKey] = useState(0); // Used to re-trigger animations
  const [triggerFetch, setTriggerFetch] = useState(0);
  const [loginRecorded, setLoginRecorded] = useState(false);

  // Tab Data States
  const [analyticsData, setAnalyticsData] = useState(null);
  const [scrapedStats, setScrapedStats] = useState(null);
  const [usersData, setUsersData] = useState(null);
  const [conversationsData, setConversationsData] = useState(null);
  const [feedbacksData, setFeedbacksData] = useState(null);
  const [schemesData, setSchemesData] = useState(null);
  const [schemesCount, setSchemesCount] = useState(null);
  const [newSchemesData, setNewSchemesData] = useState(null);
  const [deletedSchemes, setDeletedSchemes] = useState(null);
  const [deletedUsers, setDeletedUsers] = useState(null);
  const [deletedTabSection, setDeletedTabSection] = useState('schemes');
  const [viewingChatSession, setViewingChatSession] = useState(null);
  const [viewingUserDetails, setViewingUserDetails] = useState(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [activeChatMessages, setActiveChatMessages] = useState(null);
  const [scrapeHistoryData, setScrapeHistoryData] = useState(null);
  const [deletedScrapeHistoryData, setDeletedScrapeHistoryData] = useState(null);
  const [auditLogsData, setAuditLogsData] = useState(null);
  const [auditLogsCount, setAuditLogsCount] = useState(null);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditTargetTypeFilter, setAuditTargetTypeFilter] = useState('');
  const [scrapeHistoryTab, setScrapeHistoryTab] = useState('active'); // 'active' or 'deleted'
  const [expandedRunId, setExpandedRunId] = useState(null);
  const [expandedRunDetails, setExpandedRunDetails] = useState(null);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState(null);
  const [selectedSchemes, setSelectedSchemes] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Scheme Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState(null);
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);

  // Edit Modal State
  const [editingScheme, setEditingScheme] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Toasts State
  const [toasts, setToasts] = useState([]);
  const addToast = (msg) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2800);
  };

  const API = import.meta.env.VITE_API_URL || '';
  const headers = adminKey ? { 'X-Admin-API-Key': adminKey.trim() } : {};

  useEffect(() => {
    if (adminKey) {
      setKeyPrompt(false);
      localStorage.setItem('adminKey', adminKey);
      
      if (!loginRecorded) {
        axios.post(API + '/admin/login', {}, { headers: { 'X-Admin-API-Key': adminKey.trim() } })
          .then(() => setLoginRecorded(true))
          .catch(e => console.error("Login logging failed", e));
      }

      fetchTabData(activeTab, false);
    } else {
      localStorage.removeItem('adminKey');
      setLoginRecorded(false);
    }
  }, [adminKey, activeTab, loginRecorded]);

  useEffect(() => {
    if (adminKey && triggerFetch > 0) {
      fetchTabData(activeTab, true);
    }
  }, [triggerFetch]);

  const fetchTabData = async (tab, forceRefresh = false) => {
    if (!adminKey) {
      setError('Admin API key is required');
      return;
    }

    // Skip if already loaded and not forcing a refresh
    if (!forceRefresh) {
      if (tab === 'analytics' && analyticsData) return;
      if (tab === 'users' && usersData) return;
      if (tab === 'conversations' && conversationsData) return;
      if (tab === 'schemes' && schemesData) return;
      if (tab === 'newSchemes' && newSchemesData) return;
      if (tab === 'deleted' && deletedSchemes) return;
      if (tab === 'scrapeHistory' && scrapeHistoryData && deletedScrapeHistoryData) return;
      if (tab === 'audit' && auditLogsData) return;
      if (tab === 'feedbacks' && feedbacksData) return;
    }

    setLoading(true);
    setError('');

    try {
      const params = [];
      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
      if (filterVerified !== null) params.push(`verified=${filterVerified}`);
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      const query = params.length ? `?${params.join('&')}` : '';

      if (tab === 'analytics') {
        const [anRes, scrapedRes] = await Promise.all([
          axios.get(API + '/admin/analytics', { headers }),
          axios.get(API + '/admin/scraped', { headers })
        ]);
        setAnalyticsData(anRes.data);
        setScrapedStats(scrapedRes.data || { total: 0, verified: 0, unverified: 0, recent: [] });
      } else if (tab === 'users') {
        const res = await axios.get(API + '/admin/users', { headers });
        setUsersData(res.data.users || []);
      } else if (tab === 'conversations') {
        const res = await axios.get(API + '/admin/conversations', { headers });
        setConversationsData(res.data.conversations || []);
      } else if (tab === 'schemes') {
        const res = await axios.get(API + '/admin/all_schemes' + query, { headers });
        setSchemesData(res.data.all_schemes || []);
        setSchemesCount(res.data.count || 0);
      } else if (tab === 'newSchemes') {
        const res = await axios.get(API + '/admin/new' + query, { headers });
        setNewSchemesData(res.data.new_schemes || []);
      } else if (tab === 'deleted') {
        const [schemesRes, usersRes] = await Promise.all([
          axios.get(API + '/admin/deleted' + query, { headers }),
          axios.get(API + '/admin/deleted_users', { headers })
        ]);
        setDeletedSchemes(schemesRes.data.deleted_schemes || []);
        setDeletedUsers(usersRes.data || []);
      } else if (tab === 'scrapeHistory') {
        const runsRes = await axios.get(API + '/admin/scraped', { headers });
        const data = runsRes.data;
        const mockRuns = (data.recent || []).map(r => ({
          _id: r._id,
          run_id: r._id,
          started_at: r.scraped_at || new Date().toISOString(),
          total_found: 1,
          new_count: 1,
          auto_verified_count: r.verified ? 1 : 0,
          pending_count: r.verified ? 0 : 1,
          status: 'success'
        }));
        setScrapeHistoryData({
          stats: {
            total_runs: data.total || 0,
            overall_auto_verified: data.verified || 0,
            overall_pending: data.unverified || 0
          },
          runs: mockRuns
        });
        setDeletedScrapeHistoryData({ stats: {}, deleted_runs: [] });
      } else if (tab === 'audit') {
        const auditParams = [];
        if (searchTerm) auditParams.push(`search=${encodeURIComponent(searchTerm)}`);
        if (auditActionFilter) auditParams.push(`action=${encodeURIComponent(auditActionFilter)}`);
        if (auditTargetTypeFilter) auditParams.push(`target_type=${encodeURIComponent(auditTargetTypeFilter)}`);
        if (startDate) auditParams.push(`from_date=${startDate}`);
        if (endDate) auditParams.push(`to_date=${endDate}`);
        const auditQuery = auditParams.length ? `?${auditParams.join('&')}` : '';
        const res = await axios.get(API + '/admin/audit_logs' + auditQuery, { headers });
        setAuditLogsData(res.data.audit_logs || []);
        setAuditLogsCount(res.data.count || 0);
      } else if (tab === 'feedbacks') {
        const res = await axios.get(API + '/admin/feedbacks' + query, { headers });
        setFeedbacksData(res.data.feedbacks || []);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Invalid admin API key. Please re-enter.');
        setKeyPrompt(true);
      } else {
        setError('Failed to fetch data. Check your connection.');
      }
    } finally {
      setLoading(false);
      setAnimationKey(prev => prev + 1); // Trigger rowIn animation stagger
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTabData(activeTab, true);
    setIsRefreshing(false);
  };

  const applyFilters = () => {
    setTriggerFetch(t => t + 1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterVerified(null);
    setAuditActionFilter('');
    setAuditTargetTypeFilter('');
    setStartDate('');
    setEndDate('');
    setTriggerFetch(t => t + 1);
  };

  // ----- Modal helpers -----
  const openEditModal = async (scheme) => {
    try {
      let endpoint = '';
      if (scheme.source === 'official') endpoint = `/admin/schemes/${scheme._id}`;
      else if (scheme.source === 'raw') endpoint = `/admin/raw/${scheme._id}`;
      else if (scheme.source === 'new') endpoint = `/admin/new/${scheme._id}`;
      else endpoint = `/admin/schemes/${scheme._id}`;

      const res = await axios.get(`${API}${endpoint}`, { headers });
      const fullScheme = res.data.success ? res.data.data : res.data;
      setEditingScheme(fullScheme);
      setEditForm({
        name: fullScheme.name || '',
        description: fullScheme.description || '',
        state: fullScheme.state || '',
        occupation: fullScheme.occupation || '',
        age: fullScheme.age || '',
        land_size: fullScheme.land_size || '',
        income_bracket: fullScheme.income_bracket || '',
        gender: fullScheme.gender || '',
        applyLink: fullScheme.apply_link || '',
        source: fullScheme.source || '',
        verified: fullScheme.verified || false
      });
    } catch (e) {
      addToast('Failed to load scheme details.');
    }
  };
  const fetchRunDetails = async (runId) => {
    if (expandedRunId === runId) {
      setExpandedRunId(null);
      return;
    }
    setExpandedRunId(runId);
    try {
      const res = await axios.get(API + `/admin/scrape_runs/${runId}`, { headers });
      setExpandedRunDetails(res.data);
    } catch (e) {
      addToast('Failed to load run details.');
    }
  };

  const closeEditModal = () => {
    setEditingScheme(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveSchemeEdits = async () => {
    if (!editingScheme) return;
    const updates = { ...editingScheme };
    try {
      const url = `/admin/schemes/${editingScheme._id}`;

      await axios.put(API + url, updates, { headers });
      addToast('Edits saved successfully.');
      handleRefresh(); // Refresh current tab to reflect changes
      closeEditModal();
    } catch {
      addToast('Failed to save edits.');
    }
  };

  const handleVerifyWithCheck = async (scheme) => {
    if (scheme.verified) {
      addToast('Scheme is already verified.');
      return;
    }
    const required = ['name', 'description', 'state'];
    const missing = required.filter((f) => !scheme[f] || scheme[f].trim() === '');
    if (missing.length > 0) {
      openEditModal({ ...scheme, missing });
      addToast('Missing required fields: ' + missing.join(', '));
      return;
    }
    try {
      await axios.patch(API + `/admin/schemes/${scheme._id}/verify`, {}, { headers });
      addToast(`Verified: ${scheme.name || 'Unnamed'}`);
      handleRefresh();
    } catch {
      addToast('Verify failed.');
    }
  };

  const handleRejectScheme = async (scheme) => {
    if (!scheme.verified) {
      addToast('Scheme is already unverified.');
      return;
    }
    try {
      await axios.patch(API + `/admin/schemes/${scheme._id}/reject`, {}, { headers });
      addToast(`Rejected: ${scheme.name || 'Unnamed'}`);
      handleRefresh();
    } catch {
      addToast('Reject failed.');
    }
  };

  const handleDeleteScheme = async (scheme) => {
    if (!window.confirm(`Delete this ${scheme.source} scheme?`)) return;
    try {
      const url = `/admin/schemes/${scheme._id}`;

      await axios.delete(API + url, { headers });
      addToast(`Deleted: ${scheme.name || 'Unnamed'}`);
      handleRefresh();
    } catch (e) {
      addToast('Delete failed.');
    }
  };

  const handleRestoreScheme = async (scheme) => {
    try {
      await axios.post(API + `/admin/deleted/${scheme._id}/restore`, {}, { headers });
      addToast(`Restored: ${scheme.name || 'Unnamed'}`);
      handleRefresh();
    } catch {
      addToast('Restore failed.');
    }
  }

const handleHardDeleteScheme = async (scheme) => {
  if (!window.confirm(`Permanently delete this ${scheme.source} scheme? This cannot be undone.`)) return;
  try {
    await axios.delete(API + `/admin/deleted/${scheme._id}/hard`, { headers });
    addToast(`Permanently deleted: ${scheme.name || 'Unnamed'}`);
    handleRefresh();
  } catch {
    addToast('Permanent delete failed.');
  }
}

  const handleSelectScheme = (schemeId) => {
    setSelectedSchemes(prev => prev.includes(schemeId) ? prev.filter(id => id !== schemeId) : [...prev, schemeId]);
  };

  const handleSelectAll = (schemesList) => {
    if (selectedSchemes.length === schemesList.length) {
      setSelectedSchemes([]);
    } else {
      setSelectedSchemes(schemesList.map(s => s._id));
    }
  };

  const handleBulkDelete = async (sourceType, currentSchemesList) => {
    if (selectedSchemes.length === 0) return;
    if (!window.confirm(`Delete ${selectedSchemes.length} selected schemes?`)) return;
    try {
      const items = selectedSchemes.map(id => {
        const scheme = currentSchemesList.find(s => s._id === id);
        return { id, source: scheme ? scheme.source : 'official' };
      });
      await axios.post(API + '/admin/schemes/bulk_delete', items, { headers });
      addToast(`Deleted ${selectedSchemes.length} schemes`);
      setSelectedSchemes([]);
      handleRefresh();
    } catch (e) {
      addToast('Bulk delete failed.');
    }
  };

  const handleBulkHardDelete = async () => {
    if (selectedSchemes.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedSchemes.length} schemes?`)) return;
    try {
      await axios.post(API + '/admin/deleted/bulk_hard_delete', selectedSchemes, { headers });
      addToast(`Permanently deleted ${selectedSchemes.length} schemes`);
      setSelectedSchemes([]);
      handleRefresh();
    } catch (e) {
      addToast('Bulk delete failed.');
    }
  };

  const handleDeleteScrapeRun = async (run) => {
    if (!window.confirm(`Delete this scrape run?\nThis will permanently remove all ${run.total_found} schemes found in this run.`)) return;
    try {
      await axios.delete(API + `/admin/scrape_runs/${run.run_id}`, { headers });
      addToast(`Scrape run deleted \u2014 ${run.total_found} schemes removed`);
      handleRefresh();
    } catch (e) {
      addToast('Delete failed.');
    }
  };

  const handleRestoreScrapeRun = async (run) => {
    const schemeCount = run.schemes ? run.schemes.length : 0;
    if (!window.confirm(`Restore this scrape run?\nThis will bring back all ${schemeCount} schemes into New/Pending review.`)) return;
    try {
      await axios.post(API + `/admin/deleted_scrapes/${run.run_id}/restore`, {}, { headers });
      addToast(`Scrape run restored \u2014 ${schemeCount} schemes returned to New`);
      handleRefresh();
    } catch (e) {
      addToast('Restore failed.');
    }
  };
  
  const handleDeleteLegacyUsers = async () => {
    if (!window.confirm('Delete all users who have no phone number on record?')) return;
    try {
      const res = await axios.delete(API + '/admin/users/legacy', { headers });
      addToast(`Deleted ${res.data.deleted_count} legacy users.`);
      handleRefresh();
    } catch {
      addToast('Failed to delete legacy users.');
    }
  };

  const handleChangePin = async (user) => {
    if (!newPinValue || newPinValue.length < 4) {
      alert("PIN must be at least 4 digits");
      return;
    }
    try {
      await axios.put(API + `/admin/users/${user.session_id}/pin`, { pin: newPinValue }, { headers });
      addToast('PIN updated successfully.');
      setNewPinValue('');
      setViewingUserDetails({...user, pin: newPinValue});
    } catch {
      addToast('Failed to update PIN.');
    }
  };

  const handleDeleteUser = async (sid) => {
    if (!window.confirm('Are you sure you want to delete this user profile?')) return;
    try {
      await axios.delete(API + `/admin/users/${sid}`, { headers });
      setUsersData(usersData.filter(u => u.session_id !== sid));
      addToast('User deleted.');
    } catch {
      addToast('Failed to delete user.');
    }
  };

  const handleRestoreUser = async (user) => {
    try {
      await axios.post(API + `/admin/deleted_users/${user.session_id}/restore`, {}, { headers });
      setDeletedUsers(prev => prev.filter(u => u.session_id !== user.session_id));
      addToast('User restored.');
    } catch (e) {
      addToast('Failed to restore user.');
    }
  };

  const handleHardDeleteUser = async (user) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try {
      await axios.delete(API + `/admin/deleted_users/${user.session_id}/hard`, { headers });
      setDeletedUsers(prev => prev.filter(u => u.session_id !== user.session_id));
      addToast('User permanently deleted.');
    } catch (e) {
      addToast('Failed to permanently delete user.');
    }
  };

  const tabs = [
    { key: 'analytics', label: 'Analytics', count: null },
    { key: 'users', label: 'Users', count: analyticsData?.users?.total || usersData?.length },
    { key: 'conversations', label: 'Sessions', count: analyticsData?.conversations?.total || conversationsData?.length },
    { key: 'schemes', label: 'Schemes', count: schemesCount !== null ? schemesCount : schemesData?.length },
    { key: 'newSchemes', label: 'New', count: scrapedStats?.unverified || newSchemesData?.length },
    { key: 'deleted', label: 'Deleted', count: deletedSchemes?.length },
    { key: 'scrapeHistory', label: 'Scraper', count: scrapeHistoryData?.count },
    { key: 'feedbacks', label: 'Feedbacks', count: feedbacksData?.length },
    { key: 'audit', label: 'Audit Log', count: null },
  ];

  const getAnimationDelay = (index) => {
    const cappedIndex = Math.min(index, 8);
    return `${cappedIndex * 15}ms`;
  };

  if (keyPrompt) {
    return (
      <div className='admin-root' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', minWidth: '350px' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
             <svg width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='#4f46e5' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
             </svg>
          </div>
          <h2 style={{ marginBottom: '24px', color: '#1f2937', fontSize: '24px', fontWeight: '600' }}>Admin Login</h2>
          <input
            type='password'
            placeholder='Enter Admin API Key'
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '16px', boxSizing: 'border-box' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAdminKey(tempKey);
              }
            }}
            autoFocus
          />
          <button 
            onClick={() => setAdminKey(tempKey)} 
            style={{ width: '100%', padding: '12px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: 'pointer', fontWeight: '500' }}
          >
            Secure Access
          </button>
          {error && <div style={{ color: '#ef4444', marginTop: '16px', fontSize: '14px' }}>{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className='admin-root'>
      <div className='admin-header'>
        <div className='admin-header-left'>
          <button className='btn-back' onClick={onExit}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'>
              <path d='M19 12H5M12 19l-7-7 7-7'/>
            </svg>
            Chatbot
          </button>
          <h1 className='admin-title'>Admin Control Center</h1>
        </div>
        <button className='refresh-btn' onClick={handleRefresh} disabled={loading}>
          <span className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`}>↻</span>
          Refresh
        </button>
      </div>

      <div className='tabs'>
        {tabs.map(tab => {
          const isDisabled = tab.count === 0 && (tab.key === 'newSchemes' || tab.key === 'deleted');
          return (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.count !== null && tab.count !== undefined && <span className="count">({tab.count})</span>}
            </button>
          );
        })}
      </div>

      {error && <div className='admin-error' style={{padding: '10px 32px', color: 'var(--error)'}}>{error}</div>}

      <div className='admin-content' key={animationKey}>
        {/* Skeleton loader if data is not yet available but we are loading */}
        {loading && (
          <div style={{opacity: 0.5}}>
             <div className="skeleton-row"></div>
             <div className="skeleton-row"></div>
             <div className="skeleton-row"></div>
          </div>
        )}

        {/* Analytics Panel */}
        {!loading && activeTab === 'analytics' && analyticsData && (
          <div className='analytics-view'>
            <div className='metrics-grid'>
              <div className='stat-card animate-row' style={{animationDelay: getAnimationDelay(0), cursor: 'pointer'}} onClick={() => setActiveTab('users')}>
                <div className='label'>Total Users</div>
                <div className='num'>{analyticsData.users?.total || 0}</div>
                <div className='metric-sub'>Completed Onboarding: {analyticsData.users?.completed_onboarding || 0}</div>
                <div className='metric-sub'>Recent (24h): {analyticsData.users?.recent || 0}</div>
              </div>
              <div className='stat-card animate-row' style={{animationDelay: getAnimationDelay(1), cursor: 'pointer'}} onClick={() => setActiveTab('conversations')}>
                <div className='label'>Chat Exchanges</div>
                <div className='num'>{analyticsData.conversations?.total || 0}</div>
                <div className='metric-sub'>Active Last 24h: {analyticsData.conversations?.recent || 0}</div>
              </div>
              <div className='stat-card animate-row' style={{animationDelay: getAnimationDelay(2), cursor: 'pointer'}} onClick={() => setActiveTab('schemes')}>
                <div className='label'>Total Schemes</div>
                <div className='num'>{analyticsData.schemes?.total || 0}</div>
                <div className='metric-sub' style={{display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px'}}>
                  <div><span style={{color:'var(--success)', fontWeight:'bold'}}>Verified:</span> {analyticsData.schemes?.verified || 0}</div>
                  <div><span style={{color:'var(--error)', fontWeight:'bold'}}>Unverified:</span> {analyticsData.schemes?.unverified || 0}</div>
                  <div><span style={{color:'var(--text-secondary)', fontWeight:'bold'}}>Deleted:</span> {analyticsData.schemes?.deleted || 0}</div>
                </div>
              </div>
              {scrapedStats && (
                <div className='stat-card animate-row' style={{animationDelay: getAnimationDelay(3), cursor: 'pointer'}} onClick={() => setActiveTab('scrapeHistory')}>
                  <div className='label'>Scraped Stats</div>
                  <div className='num'>{scrapedStats.total || 0}</div>
                  <div className='metric-sub'>Verified: {scrapedStats.verified || 0}</div>
                  <div className='metric-sub'>Unverified: {scrapedStats.unverified || 0}</div>
                </div>
              )}
                {/* Admin Actions Block */}
                <div className='stat-card animate-row' style={{animationDelay: getAnimationDelay(4), cursor: 'pointer'}} onClick={() => setActiveTab('audit')}>
                  <div className='label'>Admin Actions</div>
                  <div className='num'>View Audit Log</div>
                </div>
                {/* Feedback Block */}
                <div className='stat-card animate-row' style={{animationDelay: getAnimationDelay(5), cursor: 'pointer'}} onClick={() => setActiveTab('feedbacks')}>
                  <div className='label'>User Feedback</div>
                  <div className='num'>Feedbacks</div>
                </div>
                {/* Sessions Block */}
                <div className='stat-card animate-row' style={{animationDelay: getAnimationDelay(6), cursor: 'pointer'}} onClick={() => setActiveTab('conversations')}>
                  <div className='label'>User Sessions</div>
                  <div className='num'>Sessions</div>
                </div>
            </div>
          </div>
        )}

        {/* Users Panel */}
        {!loading && activeTab === 'users' && usersData && (
          <div className='users-view'>
            <div className='schemes-filters animate-row' style={{animationDelay: getAnimationDelay(0), marginBottom: '15px'}}>
              <div style={{ marginLeft: 'auto' }}>
                <button className='btn-bulk delete' onClick={handleDeleteLegacyUsers}>Delete Legacy Users (No Phone)</button>
              </div>
            </div>
            <div className='table-container'>
              <table className='admin-table'>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Details</th>
                    <th>Join Info</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(!usersData || usersData.length === 0) ? (
                    <tr><td colSpan='4' className='text-center'>No registered users found.</td></tr>
                  ) : (
                    usersData.map((u, i) => {
                      const name = u.name || 'Anonymous';
                      const initials = name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
                      return (
                        <tr key={u.session_id || i} className="user-row animate-row" style={{animationDelay: getAnimationDelay(i)}}>
                          <td>
                            <div className="user-info">
                              <div className="avatar">{initials}</div>
                              <div>
                                <strong>{name}</strong>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                  {u.phone_number ? u.phone_number : <span style={{ color: 'var(--error)' }}>No Phone (Legacy)</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{fontSize:'12px', color:'var(--text-secondary)'}}>
                              {u.state || 'N/A'} • {u.occupation || 'N/A'} • {u.gender || 'N/A'} • {u.age || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <div style={{fontSize:'12px', color:'var(--text-secondary)'}}>
                              {u.language_preference?.toUpperCase() || 'EN'}
                            </div>
                          </td>
                          <td>
                            <div className='action-cell'>
                              <button className='btn-table-action btn-verify' onClick={() => {
                                setViewingUserDetails(u);
                                setActiveChatMessages(null);
                                axios.get(API + '/conversation/' + u.session_id, { headers }).then(res => {
                                  setActiveChatMessages(res.data.messages || []);
                                }).catch(e => {
                                  setActiveChatMessages([]);
                                });
                              }} style={{marginRight: '8px'}}>View</button>
                              <button className='btn-table-action btn-delete' onClick={() => handleDeleteUser(u.session_id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sessions Panel */}
        {!loading && activeTab === 'conversations' && conversationsData && (
          <SessionsPanel data={conversationsData} getAnimationDelay={getAnimationDelay} />
        )}

        {/* Schemes Panel */}
        {!loading && activeTab === 'schemes' && schemesData && (
          <>
            <div className='schemes-filters animate-row' style={{animationDelay: getAnimationDelay(0)}}>
              <input type='text' placeholder='Search...' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <select value={filterVerified===null?'all':filterVerified.toString()} onChange={e => {
                const val = e.target.value;
                setFilterVerified(val==='all'?null:val==='true');
              }}>
                <option value='all'>All Status</option>
                <option value='true'>Verified</option>
                <option value='false'>Unverified</option>
              </select>
              <input type='date' value={startDate} onChange={e => setStartDate(e.target.value)} />
              <input type='date' value={endDate} onChange={e => setEndDate(e.target.value)} />
              <button onClick={applyFilters}>Apply Filters</button>
              <button onClick={clearFilters} style={{background: 'var(--bg-glass)', border: '1px solid var(--border)'}}>Clear Filters</button>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                <button className={`btn-bulk ${isSelectionMode ? 'cancel' : ''}`} onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedSchemes([]); }}>
                  {isSelectionMode ? 'Cancel Selection' : 'Select Multiple'}
                </button>
                {isSelectionMode && selectedSchemes.length > 0 && (
                  <button className='btn-bulk delete' onClick={() => handleBulkDelete('official', schemesData)}>Delete Selected ({selectedSchemes.length})</button>
                )}
              </div>
            </div>
            
            {(!schemesData || schemesData.length === 0) ? (
              <div className="empty-state animate-row" style={{animationDelay: getAnimationDelay(1)}}>No schemes found matching the criteria.</div>
            ) : (
              <div className='table-container'>
                <table className='admin-table'>

                  <thead>
                                        <tr>
                      {isSelectionMode && (
                        <th>
                          <input type="checkbox" checked={schemesData && schemesData.length > 0 && selectedSchemes.length === schemesData.length} onChange={() => handleSelectAll(schemesData)} />
                        </th>
                      )}
                      <th>Name</th><th>State</th><th>Verified</th><th>Source</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemesData.map((s, i) => (
                      <tr key={s._id || i} className={`scheme-row animate-row ${s.verified ? 'verified' : 'unverified'} ${s.source === 'raw' ? 'raw' : ''}`} style={{animationDelay: getAnimationDelay(i+1)}}>
                        {isSelectionMode && (
                          <td>
                            <input type="checkbox" checked={selectedSchemes.includes(s._id)} onChange={() => handleSelectScheme(s._id)} />
                          </td>
                        )}
                        <td>
                          <div className="name-cell">
                            {s.verified && <span className="star" title="Verified">★</span>}
                            <span className="scheme-name">{s.name || 'Unnamed'}</span>
                          </div>
                        </td>
                        <td>{s.state || 'N/A'}</td>
                        <td>
                          {s.verified ? <span className="badge badge-yes">Yes</span> : <span className="badge badge-no">No</span>}
                        </td>
                        <td>{s.source}</td>
                        <td className='action-cell'>
                            <button className='btn-table-action btn-edit' onClick={() => openEditModal(s)}>Edit</button>
                            <button className='btn-table-action btn-verify' onClick={() => handleVerifyWithCheck(s)} disabled={s.verified}>Verify</button>
                            <button className='btn-table-action btn-reject' onClick={() => handleRejectScheme(s)} disabled={!s.verified}>Reject</button>
                            <button className='btn-table-action btn-delete' onClick={() => handleDeleteScheme(s)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* New Schemes Panel */}
        {!loading && activeTab === 'newSchemes' && newSchemesData && (
          <>
            <div className='schemes-filters animate-row' style={{animationDelay: getAnimationDelay(0)}}>
              <input type='text' placeholder='Search by name or keyword...' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <select value={filterVerified===null?'all':filterVerified.toString()} onChange={e => {
                const val = e.target.value;
                setFilterVerified(val==='all'?null:val==='true');
              }}>
                <option value='all'>All Status</option>
                <option value='true'>Verified</option>
                <option value='false'>Unverified</option>
              </select>
               <input type='date' value={startDate} onChange={e => setStartDate(e.target.value)} />
               <input type='date' value={endDate} onChange={e => setEndDate(e.target.value)} />
               <button onClick={applyFilters}>Apply Filters</button>
               <button onClick={clearFilters} style={{background: 'var(--bg-glass)', border: '1px solid var(--border)'}}>Clear Filters</button>
               <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                 <button className={`btn-bulk ${isSelectionMode ? 'cancel' : ''}`} onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedSchemes([]); }}>
                   {isSelectionMode ? 'Cancel Selection' : 'Select Multiple'}
                 </button>
                 {isSelectionMode && selectedSchemes.length > 0 && (
                   <button className='btn-bulk delete' onClick={() => handleBulkDelete('new', newSchemesData)}>Delete Selected ({selectedSchemes.length})</button>
                 )}
               </div>
            </div>
            
            {(!newSchemesData || newSchemesData.length === 0) ? (
               <div className="empty-state animate-row" style={{animationDelay: getAnimationDelay(1)}}>No new entries yet — new scraped schemes will appear here for review once found.</div>
            ) : (
              <div className='table-container'>
                <table className='admin-table'>

                  <thead>
                                        <tr>
                      {isSelectionMode && (
                        <th>
                          <input type="checkbox" checked={newSchemesData && newSchemesData.length > 0 && selectedSchemes.length === newSchemesData.length} onChange={() => handleSelectAll(newSchemesData)} />
                        </th>
                      )}
                      <th>Name</th><th>State</th><th>Verified</th><th>Source</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newSchemesData.map((s, i) => (
                      <tr key={s._id || i} className={`scheme-row animate-row ${s.verified ? 'verified' : 'unverified'}`} style={{animationDelay: getAnimationDelay(i+1)}}>
                        {isSelectionMode && (
                          <td>
                            <input type="checkbox" checked={selectedSchemes.includes(s._id)} onChange={() => handleSelectScheme(s._id)} />
                          </td>
                        )}
                        <td>
                          <div className="name-cell">
                            {s.verified && <span className="star" title="Verified">★</span>}
                            <span className="scheme-name">{s.name || 'Unnamed'}</span>
                          </div>
                        </td>
                        <td>{s.state || 'N/A'}</td>
                        <td>
                          {s.verified ? <span className="badge badge-yes">Yes</span> : <span className="badge badge-no">No</span>}
                        </td>
                        <td>{s.source || 'new'}</td>
                        <td className='action-cell'>
                          <button className='btn-table-action btn-edit' onClick={() => openEditModal(s)}>Edit</button>
                          <button className='btn-table-action btn-verify' onClick={() => handleVerifyWithCheck(s)} disabled={s.verified}>Verify</button>
                          <button className='btn-table-action btn-reject' onClick={() => handleRejectScheme(s)} disabled={!s.verified}>Reject</button>
                          <button className='btn-table-action btn-delete' onClick={() => handleDeleteScheme(s)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Deleted Panel */}
        {!loading && activeTab === 'deleted' && deletedSchemes && (
          <>
            <div className='schemes-filters animate-row' style={{animationDelay: getAnimationDelay(0), marginBottom: '15px'}}>
              <button onClick={() => setDeletedTabSection('schemes')} style={deletedTabSection === 'schemes' ? {} : {background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-secondary)'}}>Deleted Schemes</button>
              <button onClick={() => setDeletedTabSection('users')} style={deletedTabSection === 'users' ? {} : {background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-secondary)'}}>Deleted Users</button>
              
              {deletedTabSection === 'schemes' && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                  <button className={`btn-bulk ${isSelectionMode ? 'cancel' : ''}`} onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedSchemes([]); }}>
                    {isSelectionMode ? 'Cancel Selection' : 'Select Multiple'}
                  </button>
                  {isSelectionMode && selectedSchemes.length > 0 && (
                    <button className='btn-bulk delete' onClick={() => handleBulkHardDelete()}>Permanently Delete Selected ({selectedSchemes.length})</button>
                  )}
                </div>
              )}
            </div>

            {deletedTabSection === 'schemes' && (
              <div className='table-container'>
                <table className='admin-table'>

                  <thead>
                                        <tr>
                      {isSelectionMode && (
                        <th>
                          <input type="checkbox" checked={deletedSchemes && deletedSchemes.length > 0 && selectedSchemes.length === deletedSchemes.length} onChange={() => handleSelectAll(deletedSchemes)} />
                        </th>
                      )}
                      <th>Name</th><th>State</th><th>Source</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!deletedSchemes || deletedSchemes.length === 0) ? (
                      <tr><td colSpan='4' className='text-center'>No deleted schemes.</td></tr>
                    ) : (
                      deletedSchemes.map((s, i) => (
                                                <tr key={s._id || i} className="animate-row" style={{animationDelay: getAnimationDelay(i)}}>
                          {isSelectionMode && (
                            <td>
                              <input type="checkbox" checked={selectedSchemes.includes(s._id)} onChange={() => handleSelectScheme(s._id)} />
                            </td>
                          )}
                          <td>{s.name || 'Unnamed'}</td>
                          <td>{s.state || 'N/A'}</td>
                          <td>{s.source}</td>
                          <td className='action-cell'>
                            <button className='btn-table-action btn-restore' onClick={() => handleRestoreScheme(s)}>Restore</button>
                            <button className='btn-table-action btn-hard-delete' onClick={() => handleHardDeleteScheme(s)}>Delete Permanently</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {deletedTabSection === 'users' && deletedUsers && (
              <div className='table-container'>
                <table className='admin-table'>
                  <thead>
                    <tr><th>Session ID</th><th>State</th><th>Language</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {(!deletedUsers || deletedUsers.length === 0) ? (
                      <tr><td colSpan='4' className='text-center'>No deleted users.</td></tr>
                    ) : (
                      deletedUsers.map((u, i) => (
                        <tr key={u.session_id || i} className="animate-row" style={{animationDelay: getAnimationDelay(i)}}>
                          <td>
                            <div className="name-cell">
                              <span className="scheme-name" style={{fontFamily: 'monospace'}}>{u.session_id}</span>
                            </div>
                          </td>
                          <td>{u.state?.user_state || 'N/A'}</td>
                          <td>{u.language_preference?.toUpperCase() || 'EN'}</td>
                          <td className='action-cell'>
                            <button className='btn-table-action btn-verify' onClick={() => {
                              setViewingChatSession(u.session_id);
                              setActiveChatMessages(null);
                              axios.get(API + '/conversation/' + u.session_id, { headers }).then(res => {
                                setActiveChatMessages(res.data.messages || []);
                              }).catch(e => {
                                setActiveChatMessages([]);
                              });
                            }} style={{marginRight: '8px'}}>View Chat</button>
                            <button className='btn-table-action btn-restore' onClick={() => handleRestoreUser(u)}>Restore</button>
                            <button className='btn-table-action btn-hard-delete' onClick={() => handleHardDeleteUser(u)}>Delete Permanently</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Scraper History Panel */}
        {!loading && activeTab === 'scrapeHistory' && scrapeHistoryData && deletedScrapeHistoryData && (
          <>
            <div className='schemes-filters animate-row' style={{animationDelay: getAnimationDelay(0), marginBottom: '15px', display: 'flex', gap: '10px'}}>
              <button onClick={() => setScrapeHistoryTab('active')} style={scrapeHistoryTab === 'active' ? {} : {background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-secondary)'}}>Active Runs</button>
              <button onClick={() => setScrapeHistoryTab('deleted')} style={scrapeHistoryTab === 'deleted' ? {} : {background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-secondary)'}}>Deleted Runs</button>
              <button onClick={() => {
                if (window.confirm("Do you really want to scrap data now?")) {
                  axios.post(API + '/scraper/run', {}, { headers })
                    .then(res => alert(res.data.message || "Scraping started!"))
                    .catch(err => alert("Failed to start scraper."));
                }
              }} style={{background: 'var(--accent)', marginLeft: 'auto'}}>Scrap Data</button>
            </div>

            {scrapeHistoryTab === 'active' ? (
              <>
                <div className='summary-cards animate-row' style={{animationDelay: getAnimationDelay(1)}}>
                  <div className='card card-primary'>
                    <h3>Total Scrapes</h3>
                    <p className='big-stat'>{scrapeHistoryData.stats.total_runs}</p>
                  </div>
                  <div className='card card-info'>
                    <h3>Overall Auto-Verified</h3>
                    <p className='big-stat'>{scrapeHistoryData.stats.overall_auto_verified}</p>
                  </div>
                  <div className='card card-warning'>
                    <h3>Overall Pending</h3>
                    <p className='big-stat'>{scrapeHistoryData.stats.overall_pending}</p>
                  </div>
                </div>

                <div className='table-container mt-4'>
                  <table className='admin-table'>
                    <thead>
                      <tr>
                        <th>Date / Time</th>
                        <th>Total Found</th>
                        <th>New</th>
                        <th>Auto-Verified</th>
                        <th>Pending</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!scrapeHistoryData.runs || scrapeHistoryData.runs.length === 0) ? (
                        <tr><td colSpan='7' className='text-center'>No scrape runs recorded yet.</td></tr>
                      ) : (
                        (scrapeHistoryData.runs || []).map((run, i) => (
                          <React.Fragment key={run._id || i}>
                            <tr 
                              className={`animate-row clickable-row ${expandedRunId === run.run_id ? 'expanded' : ''}`} 
                              style={{animationDelay: getAnimationDelay(i + 1)}}
                              onClick={() => fetchRunDetails(run.run_id)}
                            >
                              <td>{new Date(run.started_at).toLocaleString()}</td>
                              <td>{run.total_found}</td>
                              <td>{run.new_count}</td>
                              <td>{run.auto_verified_count}</td>
                              <td>{run.pending_count}</td>
                              <td>
                                <span className={`badge badge-${run.status === 'success' ? 'yes' : run.status === 'partial' ? 'warn' : run.status === 'deleted' ? 'no' : 'no'}`}>
                                  {run.status}
                                </span>
                              </td>
                              <td className='action-cell'>
                                {run.status !== 'deleted' && (
                                  <button className='btn-table-action btn-delete' onClick={(e) => { e.stopPropagation(); handleDeleteScrapeRun(run); }}>Delete</button>
                                )}
                              </td>
                            </tr>
                            {expandedRunId === run.run_id && (
                              <tr className="expanded-details-row">
                                <td colSpan="7">
                                  <div className="run-details">
                                    {run.error_message && (
                                      <div className="run-error">
                                        <strong>Error:</strong> {run.error_message}
                                      </div>
                                    )}
                                    <h4>Schemes in this run:</h4>
                                    {!expandedRunDetails ? (
                                      <div>Loading...</div>
                                    ) : (
                                      <ul className="run-schemes-list">
                                        {(!expandedRunDetails.schemes_data || expandedRunDetails.schemes_data.length === 0) ? (
                                          <li>No scheme details found.</li>
                                        ) : (
                                          (expandedRunDetails.schemes_data || []).map((s, idx) => (
                                            <li key={idx}>
                                              <span className="scheme-name">{s.name}</span>
                                              {s.verified ? <span className="badge badge-yes">Verified</span> : <span className="badge badge-warn">Pending</span>}
                                            </li>
                                          ))
                                        )}
                                      </ul>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className='table-container mt-4'>
                <table className='admin-table'>
                  <thead>
                    <tr>
                      <th>Date of Original Scrape</th>
                      <th>Schemes Deleted</th>
                      <th>Deleted At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!deletedScrapeHistoryData.deleted_runs || deletedScrapeHistoryData.deleted_runs.length === 0) ? (
                      <tr><td colSpan='4' className='text-center'>No deleted scrape runs.</td></tr>
                    ) : (
                      (deletedScrapeHistoryData.deleted_runs || []).map((run, i) => (
                        <tr key={run._id || i} className="animate-row" style={{animationDelay: getAnimationDelay(i + 1)}}>
                          <td>{new Date(run.original_scraped_at).toLocaleString()}</td>
                          <td>{run.schemes ? run.schemes.length : 0}</td>
                          <td>{new Date(run.deleted_at).toLocaleString()}</td>
                          <td className='action-cell'>
                            <button className='btn-table-action btn-restore' onClick={() => handleRestoreScrapeRun(run)}>Restore</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Audit Log Tab */}
        {!loading && activeTab === 'audit' && auditLogsData && (
          <>
            <div className='schemes-filters animate-row' style={{animationDelay: getAnimationDelay(0)}}>
              <input 
                type='text' 
                placeholder='Search admin or target...' 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyFilters()}
              />
              <select value={auditActionFilter} onChange={e => setAuditActionFilter(e.target.value)}>
                <option value=''>All Actions</option>
                <option value='login'>Login</option>
                <option value='read'>Read</option>
                <option value='verify'>Verify</option>
                <option value='reject'>Reject</option>
                <option value='edit'>Edit</option>
                <option value='delete'>Delete</option>
                <option value='restore'>Restore</option>
              </select>
              <select value={auditTargetTypeFilter} onChange={e => setAuditTargetTypeFilter(e.target.value)}>
                <option value=''>All Targets</option>
                <option value='system'>System</option>
                <option value='scheme'>Scheme</option>
                <option value='user'>User</option>
                <option value='session'>Session</option>
                <option value='analytics'>Analytics</option>
                <option value='scrapes'>Scrapes</option>
                <option value='conversations'>Conversations</option>
              </select>
              <input type='date' value={startDate} onChange={e => setStartDate(e.target.value)} title="From Date" />
              <input type='date' value={endDate} onChange={e => setEndDate(e.target.value)} title="To Date" />
              <button onClick={applyFilters}>Apply</button>
              <button onClick={clearFilters} style={{background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-secondary)'}}>Clear</button>
            </div>
            
            <div className='table-container mt-4 animate-row' style={{animationDelay: getAnimationDelay(1)}}>
              <table className='admin-table'>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Target Type</th>
                    <th>Target Name/ID</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {(!auditLogsData || auditLogsData.length === 0) ? (
                    <tr><td colSpan='6' className='text-center'>No audit logs found.</td></tr>
                  ) : (
                    auditLogsData.map((log, i) => (
                      <tr key={log._id || i}>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>{log.admin_id}</td>
                        <td>
                          <span className={`badge badge-${
                            log.action === 'verify' || log.action === 'restore' ? 'yes' : 
                            log.action === 'delete' || log.action === 'reject' ? 'no' : 'warn'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{textTransform: 'capitalize'}}>{log.target_type}</td>
                        <td>{log.target_name || log.target_id}</td>
                        <td>{log.details || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Edit Modal Overlay */}
        {editingScheme && (
           <div className='modal-overlay' onClick={e => e.target === e.currentTarget && closeEditModal()}>
             <div className='modal-content'>
               <div className='modal-header'>
                 <h3>Edit Scheme Details</h3>
                 <button className='modal-close' onClick={closeEditModal}>✖</button>
               </div>
               <div className='modal-body'>
                 <label>Name</label>
                 <input name='name' value={editForm.name} onChange={handleEditChange} />
                 
                 <label>Description</label>
                 <textarea name='description' value={editForm.description} onChange={handleEditChange} style={{minHeight: '80px'}} />
                 
                 <label>State</label>
                 <input name='state' value={editForm.state} onChange={handleEditChange} />
                 
                 <label>Occupation</label>
                 <input name='occupation' value={editForm.occupation} onChange={handleEditChange} />
                 
                 <div style={{display: 'flex', gap: '12px'}}>
                   <div style={{flex: 1}}>
                     <label>Age</label>
                     <input name='age' type='number' value={editForm.age} onChange={handleEditChange} />
                   </div>
                   <div style={{flex: 1}}>
                     <label>Land Size (acres)</label>
                     <input name='land_size' type='number' value={editForm.land_size} onChange={handleEditChange} />
                   </div>
                 </div>

                 <label>Annual Income</label>
                 <input name='income_bracket' value={editForm.income_bracket} onChange={handleEditChange} />
                 
                 <label>Gender</label>
                 <select name='gender' value={editForm.gender} onChange={handleEditChange}>
                   <option value=''>Select</option>
                   <option value='Male'>Male</option>
                   <option value='Female'>Female</option>
                   <option value='Other'>Other</option>
                 </select>
                 
                 <label>Apply Link</label>
                 <input name='applyLink' value={editForm.applyLink} onChange={handleEditChange} />
                 
                 <div style={{display: 'flex', gap: '12px', marginTop: '8px'}}>
                    <div style={{flex: 1}}>
                      <label>Source</label>
                      <input name='source' value={editForm.source} disabled={true} />
                    </div>
                    <div style={{flex: 1}}>
                      <label>Verified Status</label>
                      <input name='verified' value={editForm.verified ? 'Yes' : 'No (Pending)'} disabled={true} />
                    </div>
                 </div>
               </div>
               <div className='modal-footer'>
                 <button className='btn-cancel' onClick={closeEditModal}>Cancel</button>
                 <button className='btn-save' onClick={saveSchemeEdits}>Save Changes</button>
               </div>
             </div>
           </div>
        )}

        {/* Feedbacks Tab */}
        {!loading && activeTab === 'feedbacks' && feedbacksData && (
          <div className='table-container mt-4 animate-row' style={{animationDelay: getAnimationDelay(1)}}>
            <table className='admin-table'>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Session/User</th>
                  <th>Rating</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(!feedbacksData || feedbacksData.length === 0) ? (
                  <tr><td colSpan='4' className='text-center'>No feedbacks yet.</td></tr>
                ) : (
                  feedbacksData.map((fb, i) => (
                    <React.Fragment key={fb._id || i}>
                      <tr className="animate-row" style={{animationDelay: getAnimationDelay(i + 1), cursor: 'pointer'}} onClick={() => setExpandedFeedbackId(expandedFeedbackId === fb._id ? null : fb._id)}>
                        <td>{new Date(fb.timestamp).toLocaleString()}</td>
                        <td>
                          {fb.user_name && fb.user_name !== 'Unknown' ? fb.user_name : fb.session_id}
                        </td>
                        <td>
                          {'⭐'.repeat(fb.rating)} ({fb.rating}/5)
                        </td>
                        <td>
                          <button className='btn-table-action btn-view' onClick={(e) => { e.stopPropagation(); setExpandedFeedbackId(expandedFeedbackId === fb._id ? null : fb._id); }}>
                            {expandedFeedbackId === fb._id ? 'Collapse' : 'View'}
                          </button>
                        </td>
                      </tr>
                      {expandedFeedbackId === fb._id && (
                        <tr className="expanded-details-row">
                          <td colSpan="4">
                            <div className="run-details" style={{padding: '1rem', background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '0.5rem', marginBottom: '0.5rem'}}>
                              <div style={{marginBottom: '1rem'}}>
                                <strong style={{color: 'var(--primary)'}}>Opinion/Comment:</strong>
                                <p style={{marginTop: '0.5rem', whiteSpace: 'pre-wrap'}}>{fb.opinion || 'No opinion provided.'}</p>
                              </div>
                              <div>
                                <strong style={{color: 'var(--primary)'}}>Suggestion:</strong>
                                <p style={{marginTop: '0.5rem', whiteSpace: 'pre-wrap'}}>{fb.suggestion || 'No suggestion provided.'}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
      {/* View Chat Modal */}
      {viewingChatSession && (
        <div className="modal-overlay" onClick={() => setViewingChatSession(null)}>
          <div className="modal-content animate-pop" onClick={e => e.stopPropagation()} style={{maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column'}}>
            <div className="modal-header">
              <h2>Chat History</h2>
              <p style={{fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px'}}>Session: {viewingChatSession}</p>
              <button className="close-btn" onClick={() => setViewingChatSession(null)}>×</button>
            </div>
            <div className="modal-body" style={{flex: 1, overflowY: 'auto', padding: '20px', background: 'var(--bg-main)'}}>
              {(() => {
                if (activeChatMessages === null) {
                  return <div className="empty-state">Loading chat history...</div>;
                }
                if (activeChatMessages.length === 0) {
                  return <div className="empty-state">No messages found.</div>;
                }
                return activeChatMessages.map((msg, idx) => (
                  <div key={idx} style={{marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    
                    {/* Message Box */}
                    <div style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                      <span style={{fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase'}}>{msg.role}</span>
                      <div style={{
                        background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-glass)',
                        color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {msg.text}
                      </div>
                    </div>

                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {viewingUserDetails && (
        <div className="modal-overlay" onClick={() => { setViewingUserDetails(null); setNewPinValue(''); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2>User Profile: {viewingUserDetails.name || 'Anonymous'}</h2>
              <button className="close-btn" onClick={() => { setViewingUserDetails(null); setNewPinValue(''); }}>×</button>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', background: 'var(--bg-main)' }}>
              
              <div style={{ padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent)' }}>Contact & Security</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Phone Number</label>
                    <div style={{ fontWeight: '500', fontSize: '16px' }}>{viewingUserDetails.phone_number || 'N/A'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Current PIN</label>
                    <div style={{ fontWeight: '500', fontSize: '16px', letterSpacing: '2px' }}>
                      {viewingUserDetails.pin ? '****' : 'Not Set'}
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '15px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Change PIN</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="New 4-digit PIN" 
                      value={newPinValue} 
                      onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-primary)', width: '150px' }}
                    />
                    <button onClick={() => handleChangePin(viewingUserDetails)} className="btn-table-action btn-edit" style={{ padding: '8px 15px' }}>Update PIN</button>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <h4 style={{ margin: '0', padding: '15px', borderBottom: '1px solid var(--border)', background: 'var(--bg-color)' }}>Conversation History</h4>
                <div className="chat-messages-container" style={{ flex: 1, overflowY: 'auto', padding: '15px', minHeight: '300px' }}>
                  {(() => {
                    if (activeChatMessages === null) {
                      return <div className="empty-state">Loading chat history...</div>;
                    }
                    if (activeChatMessages.length === 0) {
                      return <div className="empty-state">No conversation history found.</div>;
                    }
                    return activeChatMessages.map((msg, idx) => (
                      <div key={idx} style={{marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        <div style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                          <span style={{fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase'}}>{msg.role}</span>
                          <div style={{
                            background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-glass)',
                            color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

// Extracted component for Sessions to handle individual expand states
function SessionsPanel({ data, getAnimationDelay }) {
  const [expandedId, setExpandedId] = useState(null);

  if (data.length === 0) {
    return <div className="empty-state animate-row" style={{animationDelay: getAnimationDelay(0)}}>No session histories recorded.</div>;
  }

  return (
    <div className='conversations-view'>
      <div className='conversations-list'>
        {data.map((session, i) => (
          <div
            key={session.id || i}
            className={`sess-card animate-row ${expandedId === (session.session_id || i) ? 'expanded' : ''}`}
            style={{animationDelay: getAnimationDelay(i)}}
            onClick={() => setExpandedId(expandedId === (session.session_id || i) ? null : (session.session_id || i))}
          >
            <div className="sess-card-header">
              <span className="sess-id">{(session.session_id || 'UNKNOWN').substring(0, 16)}...</span>
              <span className="ts">{new Date(session.timestamp).toLocaleString()}</span>
            </div>
            <p><b>User:</b> {session.user_message}</p>
            <p className="bot-line"><b>Bot:</b> {session.bot_reply}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
