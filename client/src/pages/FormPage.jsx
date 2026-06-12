import React, { useState, useEffect } from 'react';
import ChecklistSection from '../components/ChecklistSection';
import FeedbackBox from '../components/FeedbackBox';
import { Sparkles, Trash2, User, Calendar, BookOpen, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const CHECKLIST_SECTIONS = {
  "Engagement & Focus": {
    type: "single",
    items: [
      "Enthusiastic & focused throughout",
      "Participated well, but occasionally distracted",
      "Participated only when prompted/called on",
      "Quiet, hesitant, or needed constant encouragement"
    ]
  },
  "Parent Involvement": {
    type: "single",
    items: [
      "No parent present",
      "Parent nearby but let the student work independently",
      "Parent helped appropriately (clarified instructions / gave encouragement)",
      "Parent was too involved (answered for the student)"
    ]
  },
  "Answering & Sentences": {
    type: "multiple",
    items: [
      "Answered independently & correctly",
      "Answered confidently but needed choices/options",
      "Needed examples/models before responding",
      "Used complete, detailed sentences",
      "Gave short phrases / One-word answers",
      "Improved sentence structure after correction"
    ]
  },
  "Speaking & Pronunciation": {
    type: "multiple",
    items: [
      "Spoke confidently and clearly",
      "Became more confident as class progressed",
      "Hesitant to speak / Needed encouragement",
      "Minor pronunciation errors / Missed ending sounds",
      "Improved pronunciation after correction"
    ]
  },
  "Reading Skills": {
    type: "single",
    items: [
      "Read fluently and accurately",
      "Can read well, but struggles to speak/explain",
      "Minor reading errors / Needed occasional support",
      "Struggled with reading / Needed heavy guidance"
    ]
  },
  "Lesson Content (Vocab & Grammar)": {
    type: "multiple",
    items: [
      "Grasped concepts & new vocabulary quickly",
      "Good understanding, but minor grammar errors",
      "Frequent grammar errors / Needs continued practice",
      "Needed vocabulary support / Reminders to use target words",
      "Needed frequent repetition & step-by-step guidance"
    ]
  },
  "Mindset & Feedback": {
    type: "multiple",
    items: [
      "Strong logical/creative thinking (solved problems alone)",
      "Accepted corrections positively & self-corrected",
      "Showed improvement compared to previous classes",
      "Persistent despite challenges / Completed all activities"
    ]
  },
  "Parent Homework Suggestions": {
    type: "multiple-max-2",
    maxSelection: 2,
    items: [
      "Encourage answering in complete sentences",
      "Practice reading aloud for a few minutes daily",
      "Review today's new vocabulary and target words",
      "Encourage clear pronunciation practice",
      "Continue providing praise to build confidence"
    ]
  }
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const LOCAL_STORAGE_KEY = 'esl_feedback_local_records';

function FormPage() {
  const [studentName, setStudentName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [teacherName, setTeacherName] = useState(() => localStorage.getItem('esl_default_teacher_name') || 'Teacher Zizza');
  const [lessonUnit, setLessonUnit] = useState(() => localStorage.getItem('esl_last_lesson_unit') || '');
  const [gender, setGender] = useState('');
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
    const sectionConfig = CHECKLIST_SECTIONS[sectionName];
    const isSingle = sectionConfig?.type === 'single';

    setCheckedItems(prev => {
      const section = prev[sectionName] || {};
      
      let updatedSection;
      if (isSingle) {
        const isChecked = !!section[itemLabel];
        updatedSection = isChecked ? {} : { [itemLabel]: true };
      } else {
        const newVal = !section[itemLabel];
        updatedSection = { ...section, [itemLabel]: newVal };
        if (!updatedSection[itemLabel]) delete updatedSection[itemLabel];
      }

      const updated = { ...prev, [sectionName]: updatedSection };
      if (!updated[sectionName] || Object.keys(updated[sectionName]).length === 0) {
        delete updated[sectionName];
      }
      return updated;
    });
    setHasSaved(false);
    setSaveMode(null);
  };

  const handleQuickAutofill = () => {
    const preset = {
      "Engagement & Focus": { "Enthusiastic & focused throughout": true },
      "Parent Involvement": { "No parent present": true },
      "Answering & Sentences": { "Answered independently & correctly": true, "Used complete, detailed sentences": true },
      "Speaking & Pronunciation": { "Spoke confidently and clearly": true },
      "Reading Skills": { "Read fluently and accurately": true },
      "Lesson Content (Vocab & Grammar)": { "Grasped concepts & new vocabulary quickly": true },
      "Mindset & Feedback": { "Showed improvement compared to previous classes": true, "Accepted corrections positively & self-corrected": true }
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
    if (!gender) { setErrorMsg('Please select a student gender before generating feedback.'); return; }
    setIsGenerating(true);
    try {
      const payload = { studentName, date, teacherName, lessonUnit, checkedItems: getCheckedItemsForAPI(), customNotes, gender };
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
    const payload = { studentName, date, teacherName, lessonUnit, checkedItems: getCheckedItemsForAPI(), feedbackText: generatedFeedback, gender };
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
        const newRecord = { id: `local_${Date.now()}`, student_name: studentName, date, teacher_name: teacherName, lesson_unit: lessonUnit, checked_items: getCheckedItemsForAPI(), feedback_text: generatedFeedback, created_at: new Date().toISOString(), source: 'local', gender };
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
      setGender('');
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
      <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden transition-all duration-200" style={{ background: 'var(--gradient-banner)', border: '1px solid var(--banner-border)' }}>
        <div className="absolute inset-0 opacity-10 dark:opacity-30" style={{ background: 'radial-gradient(ellipse at top left, rgba(59,130,246,0.3) 0%, transparent 60%)' }} />
        <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--banner-text)' }}>
            Create Student Feedback
          </h2>
          <p className="text-sm sm:text-base max-w-2xl leading-relaxed" style={{ color: 'var(--banner-subtext)' }}>
            Fill in the student details, select observation items below, then click <span className="font-semibold text-blue-500 dark:text-blue-400">Generate Written Feedback</span> to create a personalized AI feedback paragraph.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerateFeedback} className="space-y-6">
        {/* Student Details Card */}
        <div className="rounded-2xl p-6 transition-colors duration-200" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-5 pb-4 border-b transition-colors duration-200" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Class Details</h3>
            <button type="button" onClick={handleClearForm} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer" style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <Trash2 className="h-3.5 w-3.5" /><span>Clear Form</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Student Name */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Student Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
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
                <div className="absolute left-0 right-0 mt-1 rounded-xl border z-50 overflow-hidden shadow-2xl max-h-48 overflow-y-auto" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                  {pastStudents
                    .filter(name => name.toLowerCase().includes(studentName.toLowerCase()) && name.toLowerCase() !== studentName.toLowerCase())
                    .map(name => (
                      <div
                        key={name}
                        className="px-4 py-2 text-sm transition-colors cursor-pointer hover:bg-blue-600/30"
                        style={{ color: 'var(--text-primary)' }}
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

            {/* Gender Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Gender *</label>
              <div className="relative">
                <select
                  required
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  style={{
                    ...inputStyle,
                    paddingLeft: '12px',
                    color: gender ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                >
                  <option value="" disabled>-- Gender --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            {/* Class Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Class Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
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
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Teacher Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
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
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Lesson / Unit</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
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
          <div className="mt-5 pt-4 border-t transition-colors duration-200" style={{ borderColor: 'var(--border-color)' }}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
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
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Observation Checklists</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleQuickAutofill}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-blue-600/20 cursor-pointer"
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
          {Object.entries(CHECKLIST_SECTIONS).map(([title, config]) => (
            <ChecklistSection
              key={title}
              title={title}
              items={config.items}
              type={config.type}
              maxSelection={config.maxSelection}
              selectedItems={checkedItems[title] || {}}
              onChange={(item) => handleCheckboxChange(title, item)}
            />
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
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-bold text-white transition-all duration-200 cursor-pointer"
          style={{
            background: isGenerating ? 'var(--border-color)' : 'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)',
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
