import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function ChecklistSection({ title, items, selectedItems = {}, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCount = items.filter(item => selectedItems[item]).length;

  return (
    <div className="rounded-xl overflow-hidden mb-3 transition-all duration-200" style={{ border: `1px solid ${selectedCount > 0 ? 'rgba(59,130,246,0.35)' : '#1e2d42'}`, background: '#0e1420' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>{title}</span>
          {selectedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
              {selectedCount} selected
            </span>
          )}
        </div>
        <span style={{ color: '#4b6079' }}>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-2 grid grid-cols-1 md:grid-cols-2 gap-2 border-t" style={{ borderColor: '#1e2d42' }}>
          {items.map((item) => {
            const isChecked = !!selectedItems[item];
            return (
              <label
                key={item}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer select-none transition-all duration-150"
                style={{
                  background: isChecked ? 'rgba(59,130,246,0.1)' : 'transparent',
                  border: `1px solid ${isChecked ? 'rgba(59,130,246,0.3)' : '#1e2d42'}`,
                }}
              >
                <input type="checkbox" checked={isChecked} onChange={() => onChange(item)} className="sr-only" />
                <div className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all" style={{ background: isChecked ? '#3b82f6' : 'transparent', border: `2px solid ${isChecked ? '#3b82f6' : '#3a4a60'}` }}>
                  {isChecked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-xs font-medium leading-tight" style={{ color: isChecked ? '#93c5fd' : '#94a3b8' }}>{item}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ChecklistSection;
