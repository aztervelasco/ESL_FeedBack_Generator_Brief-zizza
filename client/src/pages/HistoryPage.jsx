import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, BookOpen, ChevronDown, ChevronUp, Copy, Check, Info, Loader2, Cloud, HardDrive, Edit2, Trash2, X, Save } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const LOCAL_STORAGE_KEY = 'esl_feedback_local_records';

function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const getLocalRecords = (filter = '') => {
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      const tagged = stored.map(r => ({ ...r, source: 'local' }));
      if (!filter) return tagged;
      return tagged.filter(r => r.student_name.toLowerCase().includes(filter.toLowerCase()));
    } catch { return []; }
  };

  const fetchRecords = async (filter = '') => {
    setLoading(true); setErrorMsg('');
    const localRecords = getLocalRecords(filter);
    try {
      const url = filter ? `${API_BASE_URL}/api/records?student=${encodeURIComponent(filter)}` : `${API_BASE_URL}/api/records`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Server error');
      const cloudData = await response.json();
      const cloudWithSource = cloudData.map(r => ({ ...r, source: 'cloud' }));
      const localIds = new Set(localRecords.map(r => r.id));
      const cloudFiltered = cloudWithSource.filter(r => !localIds.has(r.id));
      const merged = [...localRecords, ...cloudFiltered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecords(merged);
    } catch {
      setErrorMsg('Could not connect to cloud database. Showing local records only.');
      setRecords(localRecords);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchRecords(searchQuery); };
  const handleReset = () => { setSearchQuery(''); fetchRecords(''); };
  const toggleExpand = (id) => {
    // Prevent collapsing if we are currently editing this item
    if (editingId === id) return;
    setExpandedId(prev => prev === id ? null : id);
  };
  
  const handleCopy = async (text, id) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch {}
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditData({
      student_name: record.student_name,
      date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
      teacher_name: record.teacher_name || '',
      lesson_unit: record.lesson_unit || '',
      feedback_text: record.feedback_text || ''
    });
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
        // Local record
        const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        const updatedStored = stored.map(r => {
          if (r.id === id) {
            return {
              ...r,
              student_name: editData.student_name,
              date: editData.date,
              teacher_name: editData.teacher_name,
              lesson_unit: editData.lesson_unit,
              feedback_text: editData.feedback_text
            };
          }
          return r;
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedStored));
        
        setRecords(prev => prev.map(r => r.id === id ? {
          ...r,
          student_name: editData.student_name,
          date: editData.date,
          teacher_name: editData.teacher_name,
          lesson_unit: editData.lesson_unit,
          feedback_text: editData.feedback_text
        } : r));
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
    if (!window.confirm('Are you sure you want to permanently delete this observation record?')) {
      return;
    }
    try {
      if (source === 'cloud') {
        const response = await fetch(`${API_BASE_URL}/api/records/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to delete record from cloud');
        }
      } else {
        // Local record
        const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        const filtered = stored.filter(r => r.id !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      }
      setRecords(prev => prev.filter(r => r.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      alert(err.message || 'Error deleting record.');
    }
  };

  const inputStyle = { background: '#080c14', border: '1px solid #1e2d42', color: '#e2e8f0', borderRadius: '10px', padding: '10px 12px 10px 40px', fontSize: '14px', width: '100%', outline: 'none' };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Hero */}
      <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1430 0%, #141030 50%, #0e0e25 100%)', border: '1px solid #251d4a' }}>
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.3) 0%, transparent 60%)' }} />
        <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#f1f5f9' }}>Observation History</h2>
          <p className="text-sm sm:text-base max-w-xl leading-relaxed" style={{ color: '#94a3b8' }}>Browse, edit, and delete past feedback records from both cloud database and local storage.</p>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl p-4" style={{ background: '#0e1420', border: '1px solid #1e2d42' }}>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#4b6079' }} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={inputStyle} placeholder="Search by student name..." />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}>Search</button>
            {searchQuery && <button type="button" onClick={handleReset} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #1e2d42', color: '#94a3b8' }}>Reset</button>}
          </div>
        </form>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fcd34d' }}>
          <Info className="h-5 w-5 flex-shrink-0" /><span>{errorMsg}</span>
        </div>
      )}

      {/* Records */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ background: '#0e1420', border: '1px solid #1e2d42' }}>
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm" style={{ color: '#4b6079' }}>Loading records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: '#0e1420', border: '1px solid #1e2d42' }}>
            <div className="inline-flex p-4 rounded-2xl mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Info className="h-8 w-8" style={{ color: '#4b6079' }} />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#e2e8f0' }}>No Records Found</h3>
            <p className="text-sm max-w-sm mx-auto" style={{ color: '#4b6079' }}>
              {searchQuery ? `No records matching "${searchQuery}".` : 'No feedback has been saved yet. Generate and save some feedback to get started!'}
            </p>
          </div>
        ) : (
          records.map((record) => {
            const isExpanded = expandedId === record.id;
            const isCopied = copiedId === record.id;
            const isLocal = record.source === 'local';
            const isEditing = editingId === record.id;

            return (
              <div key={record.id} className="rounded-xl overflow-hidden transition-all duration-200" style={{ background: '#0e1420', border: `1px solid ${isExpanded ? 'rgba(99,102,241,0.35)' : '#1e2d42'}`, boxShadow: isExpanded ? '0 0 20px rgba(99,102,241,0.1)' : 'none' }}>
                {/* Header block click collapses/expands */}
                <div onClick={() => toggleExpand(record.id)} className="p-5 flex items-center gap-4 cursor-pointer select-none hover:bg-white/5 transition-colors">
                  <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <h4 className="font-bold text-base mb-1" style={{ color: '#e2e8f0' }}>{record.student_name}</h4>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4b6079' }}>
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(record.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#64748b' }}>
                      <User className="h-4 w-4" style={{ color: '#4b6079' }} /><span>{record.teacher_name || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#64748b' }}>
                      <BookOpen className="h-4 w-4" style={{ color: '#4b6079' }} /><span>{record.lesson_unit || '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={isLocal ? { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' } : { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                      {isLocal ? <HardDrive className="h-3 w-3" /> : <Cloud className="h-3 w-3" />}
                      {isLocal ? 'Local' : 'Cloud'}
                    </span>
                    <button type="button" onClick={e => { e.stopPropagation(); handleCopy(record.feedback_text, record.id); }} className="p-2 rounded-lg transition-colors" style={{ background: isCopied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isCopied ? 'rgba(16,185,129,0.3)' : '#1e2d42'}`, color: isCopied ? '#34d399' : '#64748b' }}>
                      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                    {!isEditing && <span style={{ color: '#4b6079' }}>{isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</span>}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-4 border-t space-y-4 animate-fadeIn" style={{ borderColor: '#1e2d42' }}>
                    {isEditing ? (
                      /* EDIT MODE VIEW */
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4b6079' }}>Student Name</label>
                            <input
                              type="text"
                              value={editData.student_name}
                              onChange={e => setEditData(prev => ({ ...prev, student_name: e.target.value }))}
                              className="px-3 py-2 text-sm rounded-lg w-full outline-none focus:border-blue-500/50"
                              style={{ background: '#080c14', border: '1px solid #1e2d42', color: '#e2e8f0' }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4b6079' }}>Class Date</label>
                            <input
                              type="date"
                              value={editData.date}
                              onChange={e => setEditData(prev => ({ ...prev, date: e.target.value }))}
                              className="px-3 py-2 text-sm rounded-lg w-full outline-none focus:border-blue-500/50"
                              style={{ background: '#080c14', border: '1px solid #1e2d42', color: '#e2e8f0' }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4b6079' }}>Teacher Name</label>
                            <input
                              type="text"
                              value={editData.teacher_name}
                              onChange={e => setEditData(prev => ({ ...prev, teacher_name: e.target.value }))}
                              className="px-3 py-2 text-sm rounded-lg w-full outline-none focus:border-blue-500/50"
                              style={{ background: '#080c14', border: '1px solid #1e2d42', color: '#e2e8f0' }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4b6079' }}>Lesson / Unit</label>
                            <input
                              type="text"
                              value={editData.lesson_unit}
                              onChange={e => setEditData(prev => ({ ...prev, lesson_unit: e.target.value }))}
                              className="px-3 py-2 text-sm rounded-lg w-full outline-none focus:border-blue-500/50"
                              style={{ background: '#080c14', border: '1px solid #1e2d42', color: '#e2e8f0' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4b6079' }}>Feedback Text</label>
                          <textarea
                            value={editData.feedback_text}
                            onChange={e => setEditData(prev => ({ ...prev, feedback_text: e.target.value }))}
                            rows={5}
                            className="px-3 py-2 text-sm rounded-lg w-full outline-none resize-vertical leading-relaxed focus:border-blue-500/50"
                            style={{ background: '#080c14', border: '1px solid #1e2d42', color: '#cbd5e1' }}
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
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #1e2d42', color: '#94a3b8' }}
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* READ-ONLY VIEW WITH ACTIONS */
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl" style={{ background: '#080c14', border: '1px solid #1e2d42' }}>
                          <h5 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4b6079' }}>Saved Feedback</h5>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#cbd5e1' }}>{record.feedback_text}</p>
                        </div>

                        {record.checked_items && Object.keys(record.checked_items).length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4b6079' }}>Observations Selected</h5>
                            <div className="space-y-2">
                              {Object.entries(record.checked_items).map(([cat, items]) => (
                                <div key={cat}>
                                  <span className="text-xs font-semibold block mb-1.5" style={{ color: '#64748b' }}>{cat}:</span>
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

                        <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: '#1e2d42' }}>
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
