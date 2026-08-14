import React, { useState } from 'react';
import Header from './components/Header';
import ExamSetup from './components/ExamSetup';
import RubricBot from './components/RubricBot';
import PDFUpload from './components/PDFUpload';
import ProcessingView from './components/ProcessingView';
import HitlDashboard from './components/HitlDashboard';
import ResultsViewer from './components/ResultsViewer';

export default function App() {
  const [activeTab, setActiveTab] = useState('setup');
  const [activeExam, setActiveExam] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9] text-slate-900 font-sans selection:bg-yellow-300">
      {/* Top Header & Navigation */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeExam={activeExam} 
      />

      {/* Main Interactive Work Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-slate-900 bg-white py-6 text-center text-xs font-black text-slate-900">
        <p>Gradex AI — Subjective Exam Evaluation & Grading Engine</p>
      </footer>
    </div>
  );
}
