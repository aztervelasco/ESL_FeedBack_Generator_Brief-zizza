import React, { useState } from 'react';
import { Copy, Check, Save, FileText, Loader2 } from 'lucide-react';

function FeedbackBox({ feedback, onChange, onSave, isSaving, hasSaved, saveMode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!feedback) return;
    try {
      await navigator.clipboard.writeText(feedback);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!feedback) return null;

  return (
    <div className="rounded-2xl overflow-hidden animate-fadeInUp" style={{ background: '#0e1420', border: '1px solid rgba(59,130,246,0.25)', boxShadow: '0 0 30px rgba(59,130,246,0.1)' }}>
      <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: '#1e2d42', background: 'rgba(59,130,246,0.06)' }}>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-400" />
          <span className="font-bold text-sm" style={{ color: '#e2e8f0' }}>Generated Feedback</span>
        </div>
        <div className="flex items-center gap-2">
          {saveMode === 'cloud' && hasSaved && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Check className="h-3 w-3" /> Saved to Cloud
            </span>
          )}
          {saveMode === 'local' && hasSaved && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Check className="h-3 w-3" /> Saved Locally
            </span>
          )}
          {!hasSaved && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
              Ready to review
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <textarea
          value={feedback}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className="w-full p-4 rounded-xl text-sm leading-relaxed resize-y focus:outline-none transition-all"
          style={{ background: '#080c14', border: '1px solid #1e2d42', color: '#cbd5e1', caretColor: '#3b82f6' }}
          placeholder="Your AI-generated feedback paragraph will appear here..."
          onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
          onBlur={e => e.target.style.borderColor = '#1e2d42'}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
          <p className="text-xs italic" style={{ color: '#4b6079' }}>
            You can edit the text above before saving or copying.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : '#1e2d42'}`, color: copied ? '#34d399' : '#94a3b8' }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || hasSaved}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: hasSaved
                  ? 'linear-gradient(135deg, #059669, #10b981)'
                  : isSaving
                    ? '#1e2d42'
                    : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                boxShadow: hasSaved
                  ? '0 0 15px rgba(16,185,129,0.3)'
                  : isSaving
                    ? 'none'
                    : '0 0 20px rgba(99,102,241,0.35)',
                opacity: isSaving ? 0.7 : 1,
                cursor: isSaving || hasSaved ? 'not-allowed' : 'pointer'
              }}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : hasSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              <span>{hasSaved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Record'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackBox;
