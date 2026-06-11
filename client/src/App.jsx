import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import FormPage from './pages/FormPage';
import HistoryPage from './pages/HistoryPage';
import { BookOpen, History, Sparkles } from 'lucide-react';

function App() {
  return (
    <Router>
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#080c14' }}>
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 glass border-b" style={{ borderColor: '#1e2d42' }}>
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 0 18px rgba(99,102,241,0.4)' }}>
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-none" style={{ color: '#f1f5f9' }}>ESL Feedback Hub</h1>
                <p className="text-xs" style={{ color: '#4b6079' }}>Observation & AI Generator</p>
              </div>
            </div>
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
        <footer className="py-5 text-center text-xs border-t" style={{ borderColor: '#1e2d42', color: '#4b6079' }}>
          ESL Feedback Hub &mdash; Built for ESL Teachers &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </Router>
  );
}

export default App;
