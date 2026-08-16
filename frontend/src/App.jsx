import React, { useState } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import ExamSetup from './components/ExamSetup';
import RubricBot from './components/RubricBot';
import PDFUpload from './components/PDFUpload';
import ProcessingView from './components/ProcessingView';
import HitlDashboard from './components/HitlDashboard';
import ResultsViewer from './components/ResultsViewer';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gradex_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('setup');
  const [activeExam, setActiveExam] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('gradex_user', JSON.stringify(userData));
    } catch (e) {}
    setActiveTab(userData.role === 'TEACHER' ? 'setup' : 'student');
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('gradex_user');
    } catch (e) {}
  };

  // If not authenticated, display Login screen
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top University Navigation Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeExam={activeExam} 
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Interactive Work Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Candidate / Student Portal */}
        {user.role === 'STUDENT' && (
          <StudentDashboard user={user} />
        )}

        {/* Faculty / Examiner Workspace */}
        {user.role === 'TEACHER' && (
          <>
            {activeTab === 'setup' && (
              <ExamSetup 
                activeExam={activeExam} 
                setActiveExam={setActiveExam} 
                onComplete={() => setActiveTab('rubric')} 
              />
            )}

            {activeTab === 'rubric' && (
              <RubricBot 
                activeExam={activeExam} 
                onNext={() => setActiveTab('upload')} 
              />
            )}

            {activeTab === 'upload' && (
              <PDFUpload 
                activeExam={activeExam} 
                onNext={() => setActiveTab('process')} 
              />
            )}

            {activeTab === 'process' && (
              <ProcessingView 
                activeExam={activeExam} 
                onComplete={() => setActiveTab('hitl')} 
              />
            )}

            {activeTab === 'hitl' && (
              <HitlDashboard 
                activeExam={activeExam} 
                onComplete={() => setActiveTab('results')} 
              />
            )}

            {activeTab === 'results' && (
              <ResultsViewer 
                activeExam={activeExam} 
              />
            )}
          </>
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-medium">
        <p>Gradex Academic Assessment Authority • Automated Examination & Evaluation Infrastructure</p>
      </footer>
    </div>
  );
}
