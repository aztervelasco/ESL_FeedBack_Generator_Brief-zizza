import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, User, BookOpen, ChevronDown, ChevronUp, Copy, Check, Info, Loader2, Cloud, HardDrive, Edit2, Trash2, X, Save, Filter, SlidersHorizontal } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const LOCAL_STORAGE_KEY = 'esl_feedback_local_records';

/**
 * Format a record's timestamp into a human-friendly string.
 * Priority: created_at (full datetime) → date (date only)
 * Output: "June 11, 2026 · 3:45 PM"
 */
function formatDateTime(record) {
  const raw = record.created_at || record.date;
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    // If we have created_at with time info, show full datetime
    if (record.created_at) {
      const datePart = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${datePart} · ${timePart}`;
    }
    // date-only fallback
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  } catch {
    return raw;
  }
}

function GenderBadge({ gender }) {
  if (!gender) return null;
  const isMale = gender.toLowerCase() === 'male';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={
        isMale
          ? { background: 'rgba(59,130,246,0.13)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }
          : { background: 'rgba(236,72,153,0.12)', color: '#f9a8d4', border: '1px solid rgba(236,72,153,0.25)' }
      }
    >
      {isMale ? '♂ Male' : '♀ Female'}
    </span>
  );
}

function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Filter states
  const [genderFilter, setGenderFilter] = useState('All');
  const [lessonFilter, setLessonFilter] = useState('All');

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const getLocalRecords = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      return stored.map(r => ({ ...r, source: 'local' }));
    } catch { return []; }
  };

  const fetchRecords = async () => {
    setLoading(true); setErrorMsg('');
    const localRecords = getLocalRecords();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${API_BASE_URL}/api/records`, { signal: controller.signal });
      if (!response.ok) throw new Error('Server error');
      const cloudData = await response.json();
      const cloudWithSource = cloudData.map(r => ({ ...r, source: 'cloud' }));
      const localIds = new Set(localRecords.map(r => r.id));
      const cloudFiltered = cloudWithSource.filter(r => !localIds.has(r.id));
      const merged = [...localRecords, ...cloudFiltered].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
      setRecords(merged);
    } catch (err) {
      if (err.name === 'AbortError') {
        setErrorMsg('Server took too long to respond. Showing local records only.');
      } else {
        setErrorMsg('Could not connect to cloud database. Showing local records only.');
      }
      setRecords(localRecords);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  // Derive unique lesson units for the dropdown
  const lessonOptions = useMemo(() => {
    const units = records
      .map(r => r.lesson_unit)
      .filter(u => u && u.trim() !== '');
    return ['All', ...Array.from(new Set(units)).sort()];
  }, [records]);

  // Filtered records (search + gender + lesson)
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = !searchQuery || r.student_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGender = genderFilter === 'All' || (r.gender || '').toLowerCase() === genderFilter.toLowerCase();
      const matchesLesson = lessonFilter === 'All' || r.lesson_unit === lessonFilter;
      return matchesSearch && matchesGender && matchesLesson;
    });
  }, [records, searchQuery, genderFilter, lessonFilter]);

  const hasActiveFilters = genderFilter !== 'All' || lessonFilter !== 'All' || searchQuery !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setGenderFilter('All');
    setLessonFilter('All');
  };

  const toggleExpand = (id) => {
    if (editingId === id) return;
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleCopy = async (text, id) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch {}
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditData({
      student_name: record.student_name || '',
      date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
      teacher_name: record.teacher_name || '',
      lesson_unit: record.lesson_unit || '',
      gender: record.gender || '',
      feedback_text: record.feedback_text || ''
    });
    setExpandedId(record.id);
  };

  const handleSaveEdit = async (id, source) => {
    if (!editData.student_name || !editData.date || !editData.feedback_text) {
      alert('Student Name, Date, and Feedback Text are required.');
      return;
    }
    setIsSavingEdit(true);
    try {
      if (source === 'cloud') {
        const response = await fetch(`${API_BASE_URL}/api/records/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: editData.student_name,
            date: editData.date,
            teacherName: editData.teacher_name,
            lessonUnit: editData.lesson_unit,
            gender: editData.gender,
            feedbackText: editData.feedback_text
          })
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to update cloud record');
        }
        const updated = await response.json();
        setRecords(prev => prev.map(r => r.id === id ? { ...updated, source: 'cloud' } : r));
      } else {
        const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        const updatedStored = stored.map(r => r.id === id ? { ...r, ...editData } : r);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedStored));
        setRecords(prev => prev.map(r => r.id === id ? { ...r, ...editData } : r));
      }
      setEditingId(null);
      setEditData({});
    } catch (err) {
      alert(err.message || 'Error saving changes.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id, source) => {
    if (!window.confirm('Are you sure you want to permanently delete this observation record?')) return;
    try {
      if (source === 'cloud') {
        const response = await fetch(`${API_BASE_URL}/api/records/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to delete record from cloud');
        }
      } else {
        const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stored.filter(r => r.id !== id)));
      }
      setRecords(prev => prev.filter(r => r.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      alert(err.message || 'Error deleting record.');
    }
  };

  // Shared input style using CSS variables
  const inputStyle = {
    background: 'var(--input-bg)',
    border: '1px solid var(--border-color)',
    color: 'var(--input-text)',
    borderRadius: '10px',
    padding: '9px 12px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    paddingRight: '32px'
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Hero */}
      <div
        className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
        style={{ background: 'var(--gradient-banner)', border: '1px solid var(--banner-border)' }}
      >
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.4) 0%, transparent 60%)' }} />
        <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--banner-text)' }}>
            Observation History
          </h2>
          <p className="text-sm sm:text-base max-w-xl leading-relaxed" style={{ color: 'var(--banner-subtext)' }}>
            Browse, edit, and delete past feedback records. Filter by gender or lesson unit.
          </p>
        </div>
      </div>

      {/* Search & Filters Panel */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        {/* Search row */}
        <form onSubmit={e => { e.preventDefault(); }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '38px' }}
              placeholder="Search by student name..."
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </button>
          )}
        </form>

        {/* Filter dropdowns row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <SlidersHorizontal className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
            <div className="relative flex-1">
              <select
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
            <div className="relative flex-1">
              <select
                value={lessonFilter}
                onChange={e => setLessonFilter(e.target.value)}
                style={selectStyle}
              >
                {lessonOptions.map(opt => (
                  <option key={opt} value={opt}>{opt === 'All' ? 'All Lesson Units' : opt}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
            </div>
          </div>
          {/* Result count */}
          <div className="flex items-center px-3 rounded-xl text-sm font-medium flex-shrink-0" style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            {loading ? '...' : `${filteredRecords.length} record${filteredRecords.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fcd34d' }}>
          <Info className="h-5 w-5 flex-shrink-0" /><span>{errorMsg}</span>
        </div>
      )}

      {/* Records List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="inline-flex p-4 rounded-2xl mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Info className="h-8 w-8" style={{ color: 'var(--text-secondary)' }} />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>No Records Found</h3>
            <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
              {hasActiveFilters
                ? 'No records match your current filters. Try adjusting or clearing them.'
                : 'No feedback has been saved yet. Generate and save some feedback to get started!'}
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const isExpanded = expandedId === record.id;
            const isCopied = copiedId === record.id;
            const isLocal = record.source === 'local';
            const isEditing = editingId === record.id;

            return (
              <div
                key={record.id}
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${isExpanded ? 'rgba(99,102,241,0.4)' : 'var(--border-color)'}`,
                  boxShadow: isExpanded ? '0 0 20px rgba(99,102,241,0.08)' : 'none'
                }}
              >
                {/* Card Header */}
                <div onClick={() => toggleExpand(record.id)} className="p-5 flex items-center gap-4 cursor-pointer select-none transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                  <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Student + date */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{record.student_name}</h4>
                        <GenderBadge gender={record.gender} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateTime(record)}</span>
                      </div>
                    </div>
                    {/* Teacher */}
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <User className="h-4 w-4" /><span>{record.teacher_name || '—'}</span>
                    </div>
                    {/* Lesson */}
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <BookOpen className="h-4 w-4" /><span>{record.lesson_unit || '—'}</span>
                    </div>
                  </div>

                  {/* Badges & actions */}
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={isLocal
                        ? { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }
                        : { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
                    >
                      {isLocal ? <HardDrive className="h-3 w-3" /> : <Cloud className="h-3 w-3" />}
                      {isLocal ? 'Local' : 'Cloud'}
                    </span>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleCopy(record.feedback_text, record.id); }}
                      className="p-2 rounded-lg transition-colors"
                      style={{
                        background: isCopied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isCopied ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
                        color: isCopied ? '#34d399' : 'var(--text-secondary)'
                      }}
                      title="Copy feedback"
                    >
                      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                    {!isEditing && (
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-4 border-t space-y-4 animate-fadeIn" style={{ borderColor: 'var(--border-color)' }}>
                    {isEditing ? (
                      /* EDIT MODE */
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Student Name</label>
                            <input
                              type="text"
                              value={editData.student_name}
                              onChange={e => setEditData(prev => ({ ...prev, student_name: e.target.value }))}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Class Date</label>
                            <input
                              type="date"
                              value={editData.date}
                              onChange={e => setEditData(prev => ({ ...prev, date: e.target.value }))}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Gender</label>
                            <div className="relative">
                              <select
                                value={editData.gender}
                                onChange={e => setEditData(prev => ({ ...prev, gender: e.target.value }))}
                                style={selectStyle}
                              >
                                <option value="">— Select Gender —</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                              </select>
                              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Teacher Name</label>
                            <input
                              type="text"
                              value={editData.teacher_name}
                              onChange={e => setEditData(prev => ({ ...prev, teacher_name: e.target.value }))}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Lesson / Unit</label>
                            <input
                              type="text"
                              value={editData.lesson_unit}
                              onChange={e => setEditData(prev => ({ ...prev, lesson_unit: e.target.value }))}
                              style={inputStyle}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Feedback Text</label>
                          <textarea
                            value={editData.feedback_text}
                            onChange={e => setEditData(prev => ({ ...prev, feedback_text: e.target.value }))}
                            rows={5}
                            className="px-3 py-2 text-sm rounded-lg w-full outline-none resize-vertical leading-relaxed"
                            style={inputStyle}
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(record.id, record.source)}
                            disabled={isSavingEdit}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-95"
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 10px rgba(16,185,129,0.2)' }}
                          >
                            {isSavingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            <span>Save Changes</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingId(null); setEditData({}); }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* READ-ONLY VIEW */
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                          <h5 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Saved Feedback</h5>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{record.feedback_text}</p>
                        </div>

                        {record.checked_items && Object.keys(record.checked_items).length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>Observations Selected</h5>
                            <div className="space-y-2">
                              {Object.entries(record.checked_items).map(([cat, items]) => (
                                <div key={cat}>
                                  <span className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>{cat}:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {items.map(item => (
                                      <span key={item} className="px-2.5 py-0.5 rounded-full text-xs" style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}>{item}</span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                          <button
                            type="button"
                            onClick={() => startEdit(record)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-blue-400 transition-all hover:bg-blue-600/10"
                            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit Record</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(record.id, record.source)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-red-400 transition-all hover:bg-red-600/10"
                            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Record</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
