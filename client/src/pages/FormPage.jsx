import React, { useState, useEffect } from 'react';
import ChecklistSection from '../components/ChecklistSection';
import FeedbackBox from '../components/FeedbackBox';
import { Sparkles, Trash2, User, Calendar, BookOpen, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const CHECKLIST_DATA = {
  "Attendance & Readiness": ["Arrived on time","Arrived a few minutes late","Joined very late / Absent","Camera & Mic working well","Tech / Internet difficulties","Had required materials ready","Unprepared with materials"],
  "Attitude & Behavior": ["Very enthusiastic & active","Participated when called on","Inconsistent / Rarely participated","Polite, respectful, cooperative","Cheerful and energetic","Serious and focused","Shy / Hesitant to respond","Easily frustrated / Upset","Maintained focus throughout","Distracted (looked away/toys)","Needed redirection / Left seat"],
  "Listening Skills": ["Understood instructions immediately","Needed repetition (once/multiple)","Followed directions accurately","Followed multi-step directions","Missed details / Needs visual cues","Needed teacher modeling","Difficulty understanding spoken English"],
  "Speaking Skills": ["Spoke confidently & willingly","Needed encouragement / Shy","Avoided speaking entirely","Answered independently","Used complete sentences","Expanded answers with details","Short phrases / One-word answers","Frequent \"I don't know\" responses","Spoke fluently with minor pauses","Struggled to express ideas","Fluency improved during lesson"],
  "Pronunciation": ["Clear, easy-to-understand speech","Minor pronunciation errors","Difficulty with new vocabulary","Difficulty with specific / ending sounds","Difficulty with word / sentence stress","Monotone delivery","Self-corrected errors reliably","Improved quickly after correction","Needs continuous practice"],
  "Vocabulary": ["Understood & used target words correctly","Remembered past vocabulary","Used vocabulary independently","Needed support / frequent reminders","Asked about unfamiliar words","Used context clues effectively","Misused words / Needs review"],
  "Grammar": ["Used target grammar accurately","Demonstrated rule understanding","Minor mistakes / Frequent errors","Needed sentence models","Self-corrected / Improved via feedback","Omitted important structures"],
  "Reading Skills": ["Read fluently and accurately","Minor / Frequent reading errors","Mispronounced words / Skipped words","Understood text / Answered CQ correctly","Identified key details / Predicted well","Inferred meaning from context","Needed guidance / Recalled poorly"],
  "Writing Skills (If Applicable)": ["Wrote independently and followed rules","Correct capitalization & punctuation","Neat handwriting / Spelled accurately","Minor / Frequent spelling errors","Organized ideas clearly / Needs prompts"],
  "Critical Thinking": ["Thought carefully / Explained reasoning","Used logic / Made connections","Asked thoughtful questions / Creative","Needed hints / Gave up easily","\"I don't know\" without trying"],
  "Response to Correction": ["Accepted corrections positively","Applied corrections immediately","Self-corrected / Modeled successfully","Discouraged / Ignored corrections"],
  "Parent/Support": ["Parent observed appropriately","Parent provided excessive help","Relied heavily on parent support","Worked independently with parent present"],
  "Progress Comparison": ["Significant / Steady progress seen","Maintained previous performance","Improved confidence & participation","Improved sound, vocabulary, or grammar","Needs reinforcement / Regression seen"]
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const LOCAL_STORAGE_KEY = 'esl_feedback_local_records';

function FormPage() {
  const [studentName, setStudentName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [teacherName, setTeacherName] = useState(() => localStorage.getItem('esl_default_teacher_name') || 'Teacher Zizza');
  const [lessonUnit, setLessonUnit] = useState(() => localStorage.getItem('esl_last_lesson_unit') || '');
  const [customNotes, setCustomNotes] = useState('');
  const [checkedItems, setCheckedItems] = useState({});
  const [generatedFeedback, setGeneratedFeedback] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [saveMode, setSaveMode] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Autocomplete suggestions
  const [pastStudents, setPastStudents] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchPastStudents = async () => {
      const names = new Set();
      // Load local history
      try {
        const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        stored.forEach(r => { if (r.student_name) names.add(r.student_name); });
      } catch {}
      // Load cloud history
      try {
        const res = await fetch(`${API_BASE_URL}/api/records`);
        if (res.ok) {
          const cloud = await res.json();
          cloud.forEach(r => { if (r.student_name) names.add(r.student_name); });
        }
      } catch {}
      setPastStudents(Array.from(names).sort());
    };
    fetchPastStudents();
  }, []);

  const handleTeacherNameChange = (val) => {
    setTeacherName(val);
    localStorage.setItem('esl_default_teacher_name', val);
  };

  const handleLessonUnitChange = (val) => {
    setLessonUnit(val);
    localStorage.setItem('esl_last_lesson_unit', val);
  };

  const handleCheckboxChange = (sectionName, itemLabel) => {
    setCheckedItems(prev => {
      const section = prev[sectionName] || {};
      const newVal = !section[itemLabel];
      const updatedSection = { ...section, [itemLabel]: newVal };
      if (!updatedSection[itemLabel]) delete updatedSection[itemLabel];
      const updated = { ...prev, [sectionName]: updatedSection };
      if (Object.keys(updated[sectionName]).length === 0) delete updated[sectionName];
      return updated;
    });
    setHasSaved(false);
    setSaveMode(null);
  };

  const handleQuickAutofill = () => {
    const preset = {
      "Attendance & Readiness": { "Arrived on time": true, "Camera & Mic working well": true, "Had required materials ready": true },
      "Attitude & Behavior": { "Very enthusiastic & active": true, "Polite, respectful, cooperative": true, "Maintained focus throughout": true },
      "Listening Skills": { "Understood instructions immediately": true, "Followed directions accurately": true },
      "Speaking Skills": { "Spoke confidently & willingly": true },
      "Pronunciation": { "Clear, easy-to-understand speech": true }
    };
    setCheckedItems(preset);
    setHasSaved(false);
    setSaveMode(null);
    setSuccessMsg('Autofilled checklist with standard positive behaviors!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const getCheckedItemsForAPI = () => {
    const apiData = {};
    Object.entries(checkedItems).forEach(([section, itemsObj]) => {
      const selected = Object.keys(itemsObj).filter(k => itemsObj[k]);
      if (selected.length > 0) apiData[section] = selected;
    });
    return apiData;
  };

  const getTotalCheckedCount = () => {
    let count = 0;
    Object.values(checkedItems).forEach(obj => { count += Object.keys(obj).length; });
    return count;
  };

  const handleGenerateFeedback = async (e) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg(''); setGeneratedFeedback('');
    if (!studentName.trim()) { setErrorMsg('Please enter a student name before generating feedback.'); return; }
    setIsGenerating(true);
    try {
      const payload = { studentName, date, teacherName, lessonUnit, checkedItems: getCheckedItemsForAPI(), customNotes };
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Failed to generate feedback'); }
      const data = await response.json();
      setGeneratedFeedback(data.feedback);
      setHasSaved(false); setSaveMode(null);
    } catch (error) {
      setErrorMsg(error.message || 'Server error. Make sure the backend is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!generatedFeedback) return;
    setIsSaving(true); setErrorMsg(''); setSuccessMsg('');
    const payload = { studentName, date, teacherName, lessonUnit, checkedItems: getCheckedItemsForAPI(), feedbackText: generatedFeedback };
    try {
      const response = await fetch(`${API_BASE_URL}/api/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Database save failed'); }
      setHasSaved(true); setSaveMode('cloud');
      setSuccessMsg('Record saved successfully to the cloud database!');
      if (!pastStudents.includes(studentName)) {
        setPastStudents(prev => [...prev, studentName].sort());
      }
    } catch (error) {
      console.warn('Cloud save failed, falling back to local storage:', error.message);
      try {
        const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        const newRecord = { id: `local_${Date.now()}`, student_name: studentName, date, teacher_name: teacherName, lesson_unit: lessonUnit, checked_items: getCheckedItemsForAPI(), feedback_text: generatedFeedback, created_at: new Date().toISOString(), source: 'local' };
        existing.unshift(newRecord);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
        setHasSaved(true); setSaveMode('local');
        setSuccessMsg('Cloud database not available. Record saved to local browser storage instead.');
        if (!pastStudents.includes(studentName)) {
          setPastStudents(prev => [...prev, studentName].sort());
        }
      } catch (localErr) {
        setErrorMsg('Failed to save record. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearForm = () => {
    if (window.confirm('Clear all fields and selections?')) {
      setStudentName(''); setDate(new Date().toISOString().split('T')[0]);
      setLessonUnit(localStorage.getItem('esl_last_lesson_unit') || '');
      setCustomNotes('');
      setCheckedItems({}); setGeneratedFeedback('');
      setHasSaved(false); setSaveMode(null);
      setErrorMsg(''); setSuccessMsg('');
    }
  };

  const inputStyle = {
    background: '#080c14',
    border: '1px solid #1e2d42',
    color: '#e2e8f0',
    borderRadius: '10px',
    padding: '10px 12px 10px 36px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const handleInputFocus = (e) => { e.target.style.borderColor = 'rgba(59,130,246,0.5)'; };
  const handleInputBlur = (e) => { e.target.style.borderColor = '#1e2d42'; };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Hero Banner */}
      <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #141d35 50%, #0f1a2e 100%)', border: '1px solid #1e3a5f' }}>
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at top left, rgba(59,130,246,0.3) 0%, transparent 60%)' }} />
        <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#f1f5f9' }}>
            Create Student Feedback
          </h2>
          <p className="text-sm sm:text-base max-w-2xl leading-relaxed" style={{ color: '#94a3b8' }}>
            Fill in the student details, select observation items below, then click <span className="font-semibold text-blue-400">Generate Written Feedback</span> to create a personalized AI feedback paragraph.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerateFeedback} className="space-y-6">
        {/* Student Details Card */}
        <div className="rounded-2xl p-6" style={{ background: '#0e1420', border: '1px solid #1e2d42' }}>
          <div className="flex items-center justify-between mb-5 pb-4 border-b" style={{ borderColor: '#1e2d42' }}>
            <h3 className="font-bold text-base" style={{ color: '#e2e8f0' }}>Class Details</h3>
            <button type="button" onClick={handleClearForm} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <Trash2 className="h-3.5 w-3.5" /><span>Clear Form</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Student Name */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4b6079' }}>Student Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#4b6079' }} />
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={e => {
                    setStudentName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="e.g. Leo Lee"
                  style={inputStyle}
                  onFocusCapture={handleInputFocus}
                  onBlurCapture={handleInputBlur}
                />
              </div>
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && studentName && pastStudents.filter(name => name.toLowerCase().includes(studentName.toLowerCase()) && name.toLowerCase() !== studentName.toLowerCase()).length > 0 && (
                <div className="absolute left-0 right-0 mt-1 rounded-xl border z-50 overflow-hidden shadow-2xl max-h-48 overflow-y-auto" style={{ background: '#0e1420', borderColor: '#1e2d42' }}>
                  {pastStudents
                    .filter(name => name.toLowerCase().includes(studentName.toLowerCase()) && name.toLowerCase() !== studentName.toLowerCase())
                    .map(name => (
                      <div
                        key={name}
                        className="px-4 py-2 text-sm text-slate-300 hover:bg-blue-600/30 cursor-pointer transition-colors"
                        onMouseDown={() => {
                          setStudentName(name);
                          setShowSuggestions(false);
                        }}
                      >
                        {name}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Class Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4b6079' }}>Class Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#4b6079' }} />
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
            </div>

            {/* Teacher Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4b6079' }}>Teacher Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#4b6079' }} />
                <input
                  type="text"
                  value={teacherName}
                  onChange={e => handleTeacherNameChange(e.target.value)}
                  placeholder="e.g. Teacher Zizza"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
            </div>

            {/* Lesson / Unit */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4b6079' }}>Lesson / Unit</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#4b6079' }} />
                <input
                  type="text"
                  value={lessonUnit}
                  onChange={e => handleLessonUnitChange(e.target.value)}
                  placeholder="e.g. Unit 3, Lesson 2"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
            </div>
          </div>

          {/* Custom Notes Section */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor: '#1e2d42' }}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4b6079' }}>
              Custom Notes / Unique Details (Optional)
            </label>
            <textarea
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              placeholder="e.g. Student lost a tooth today, had a birthday, or struggled with the word 'elephant'..."
              rows={2}
              style={{ ...inputStyle, paddingLeft: '12px', resize: 'vertical' }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>
        </div>

        {/* Checklists */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="font-bold text-lg" style={{ color: '#e2e8f0' }}>Observation Checklists</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleQuickAutofill}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-blue-600/20"
                style={{ color: '#60a5fa', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
              >
                ✨ Quick Autofill (Great Class)
              </button>
              {getTotalCheckedCount() > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                  {getTotalCheckedCount()} selected
                </span>
              )}
            </div>
          </div>
          {Object.entries(CHECKLIST_DATA).map(([title, items]) => (
            <ChecklistSection key={title} title={title} items={items} selectedItems={checkedItems[title] || {}} onChange={(item) => handleCheckboxChange(title, item)} />
          ))}
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fca5a5' }}>
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-400" /><span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' }}>
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" /><span>{successMsg}</span>
          </div>
        )}

        {/* Generate Button */}
        <button
          type="submit"
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-bold text-white transition-all duration-200"
          style={{
            background: isGenerating ? '#1e2d42' : 'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)',
            boxShadow: isGenerating ? 'none' : '0 0 30px rgba(99,102,241,0.35)',
            transform: isGenerating ? 'none' : 'translateY(0)',
            cursor: isGenerating ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={e => { if (!isGenerating) e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
        >
          {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          <span>{isGenerating ? 'Generating Feedback with AI...' : 'Generate Written Feedback'}</span>
        </button>
      </form>

      {/* Feedback Box */}
      {generatedFeedback && (
        <FeedbackBox
          feedback={generatedFeedback}
          onChange={setGeneratedFeedback}
          onSave={handleSaveRecord}
          isSaving={isSaving}
          hasSaved={hasSaved}
          saveMode={saveMode}
        />
      )}
    </div>
  );
}

export default FormPage;
