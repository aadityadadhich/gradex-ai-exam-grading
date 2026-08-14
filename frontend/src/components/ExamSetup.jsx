import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BookOpen, Plus, Trash2, CheckCircle2, ArrowRight, Layers } from 'lucide-react';

export default function ExamSetup({ activeExam, setActiveExam, onComplete }) {
  const [exams, setExams] = useState([]);
  const [examName, setExamName] = useState('Data Science Examination');
  const [subject, setSubject] = useState('Data Science');
  const [loading, setLoading] = useState(false);

  // Flexible exam structure preset (Part I: MCQs, Part II: Short Answer)
  const [structure, setStructure] = useState([
    { part: 'I', num_questions: 20, marks_per_question: 1, type: 'MCQ' },
    { part: 'II', num_questions: 15, marks_per_question: 2, type: 'Short_Answer' }
  ]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.listExams();
      setExams(res.data);
      if (res.data.length > 0 && !activeExam) {
        setActiveExam(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examName || !subject) {
      alert('Please fill in exam name and subject.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createExam({
        exam_name: examName,
        subject: subject,
        exam_structure: structure
      });
      setActiveExam(res.data);
      await fetchExams();
      alert(`Exam "${res.data.exam_name}" created successfully!`);
      if (onComplete) onComplete();
    } catch (err) {
      alert('Failed to create exam: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExam = (exam) => {
    setActiveExam(exam);
  };

  const updatePart = (index, field, value) => {
    const updated = [...structure];
    updated[index][field] = value;
    setStructure(updated);
  };

  const addPart = () => {
    const nextPartLabel = String.fromCharCode(65 + structure.length); // A, B, C...
    setStructure([
      ...structure,
      { part: nextPartLabel, num_questions: 5, marks_per_question: 2, type: 'Short_Answer' }
    ]);
  };

  const removePart = (index) => {
    if (structure.length <= 1) {
      alert('An exam must have at least one part.');
      return;
    }
    setStructure(structure.filter((_, idx) => idx !== index));
  };

  const calculatedTotalMarks = structure.reduce(
    (sum, p) => sum + (parseInt(p.num_questions) || 0) * (parseInt(p.marks_per_question) || 0),
    0
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Existing Exams Selector */}
      {exams.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Existing Exams ({exams.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exams.map((ex) => {
              const isSelected = activeExam?.id === ex.id;
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleSelectExam(ex)}
                  className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-900/20'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-base">{ex.exam_name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div className="text-xs text-slate-400">
                    Subject: <span className="text-slate-200">{ex.subject}</span> | Total: <span className="text-purple-300 font-bold">{ex.total_marks} Marks</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Create New Exam Form */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-purple-400" />
              Create Exam Structure
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Define the subject, question types, and parts breakdown (Set 0 for parts not needed).
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Calculated Total Marks</span>
            <span className="text-2xl font-extrabold text-emerald-400">{calculatedTotalMarks}</span>
          </div>
        </div>

        <form onSubmit={handleCreateExam} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Exam Title</label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. Data Science Examination"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Subject / Course</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Data Science"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Exam Parts Setup */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Exam Parts Breakdown
              </h3>
              <button
                type="button"
                onClick={addPart}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Exam Part
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {structure.map((part, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4 relative group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-purple-400">Part</span>
                      <input
                        type="text"
                        value={part.part}
                        onChange={(e) => updatePart(idx, 'part', e.target.value)}
                        className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm font-bold text-purple-300 uppercase text-center"
                      />
                    </div>
                    {structure.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePart(idx)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        title="Remove section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Number of Questions (0 allowed)</label>
                    <input
                      type="number"
                      min="0"
                      value={part.num_questions}
                      onChange={(e) => updatePart(idx, 'num_questions', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Marks per Question</label>
                    <input
                      type="number"
                      min="1"
                      value={part.marks_per_question}
                      onChange={(e) => updatePart(idx, 'marks_per_question', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              {loading ? 'Creating Exam...' : 'Create Exam & Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
