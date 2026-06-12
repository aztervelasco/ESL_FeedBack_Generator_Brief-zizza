import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import FormPage from './pages/FormPage';
import HistoryPage from './pages/HistoryPage';
import { BookOpen, History, Sparkles, Sun, Moon } from 'lucide-react';

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('esl_theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('esl_theme', theme);
  }, [theme]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col transition-colors duration-200" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 glass border-b transition-colors duration-200" style={{ borderColor: 'var(--border-color)' }}>
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 0 18px rgba(99,102,241,0.4)' }}>
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-none" style={{ color: 'var(--text-primary)' }}>ESL Feedback Hub</h1>
                <p className="text-xs transition-colors duration-200" style={{ color: 'var(--text-secondary)' }}>Observation & AI Generator</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <nav className="flex items-center space-x-1">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
                    }`
                  }
                  style={({ isActive }) => isActive ? { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' } : {}}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>New Feedback</span>
                </NavLink>
                <NavLink
                  to="/history"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                    }`
                  }
                  style={({ isActive }) => isActive ? { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' } : {}}
                >
                  <History className="h-4 w-4" />
                  <span>History</span>
                </NavLink>
              </nav>
              
              <button
                onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-xl border transition-all duration-200 cursor-pointer"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              >
                {theme === 'light' ? <Moon className="h-4 w-4 text-indigo-500" /> : <Sun className="h-4 w-4 text-amber-400" />}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<FormPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="py-5 text-center text-xs border-t transition-colors duration-200" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
          ESL Feedback Hub &mdash; Built for ESL Teachers &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </Router>
  );
}

export default App;
