import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BookOpen, Plus, Trash2, CheckCircle2, ArrowRight, Layers, AlertCircle, Loader2 } from 'lucide-react';

export default function ExamSetup({ activeExam, setActiveExam, onComplete }) {
  const [exams, setExams] = useState([]);
  const [examName, setExamName] = useState('Data Science Examination');
  const [subject, setSubject] = useState('Data Science');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Flexible exam structure preset
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
      alert('Please specify the examination title and course subject.');
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
      if (onComplete) onComplete();
    } catch (err) {
      alert('Failed to create exam record: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId, e) => {
    e.stopPropagation();
    if (!window.confirm('Confirm deletion of this examination record and associated student submissions?')) {
      return;
    }

    setDeletingId(examId);
    try {
      await api.deleteExam(examId);
      if (activeExam?.id === examId) {
        setActiveExam(null);
      }
      await fetchExams();
    } catch (err) {
      alert('Deletion failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const updatePart = (index, field, value) => {
    const updated = [...structure];
    updated[index][field] = value;
    setStructure(updated);
  };

  const addPart = () => {
    const nextPartLabel = String.fromCharCode(65 + structure.length);
    setStructure([
      ...structure,
      { part: nextPartLabel, num_questions: 5, marks_per_question: 2, type: 'Short_Answer' }
    ]);
  };

  const removePart = (index) => {
    if (structure.length <= 1) {
      alert('An examination structure must include at least one part.');
      return;
    }
    setStructure(structure.filter((_, idx) => idx !== index));
  };

  const calculatedTotalMarks = structure.reduce(
    (sum, p) => sum + (parseInt(p.num_questions) || 0) * (parseInt(p.marks_per_question) || 0),
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Existing Course Examinations */}
      {exams.length > 0 && (
        <div className="academic-card p-5 bg-white space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Active Course Examinations ({exams.length})
            </h3>
            <span className="text-xs text-slate-400 font-medium">Select an examination session</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {exams.map((ex) => {
              const isSelected = activeExam?.id === ex.id;
              return (
                <div
                  key={ex.id}
                  onClick={() => setActiveExam(ex)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{ex.exam_name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{ex.subject}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteExam(ex.id, e)}
                      disabled={deletingId === ex.id}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Delete Examination Record"
                    >
                      {deletingId === ex.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-600 font-semibold">{ex.total_marks} Marks</span>
                    {isSelected && (
                      <span className="academic-badge badge-blue py-0.5 px-2 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-blue-700" /> Active Session
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Examination Structure Setup Form */}
      <div className="academic-card p-6 bg-white space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Configure Examination Structure
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Define the syllabus code, section weightages, and question distribution (0 questions allowed for unused sections).
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Maximum Score</span>
            <span className="text-xl font-bold text-slate-900">{calculatedTotalMarks} Marks</span>
          </div>
        </div>

        <form onSubmit={handleCreateExam} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Examination Title</label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g., Data Science Final Assessment"
                className="academic-input w-full px-3.5 py-2 text-xs font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Course / Subject Code</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Data Science (DS-301)"
                className="academic-input w-full px-3.5 py-2 text-xs font-medium"
                required
              />
            </div>
          </div>

          {/* Parts Setup */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Examination Sections & Question Weightages
              </h3>
              <button
                type="button"
                onClick={addPart}
                className="academic-button-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" /> Add Section
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {structure.map((part, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-700">Section</span>
                      <input
                        type="text"
                        value={part.part}
                        onChange={(e) => updatePart(idx, 'part', e.target.value)}
                        className="academic-input w-14 px-2 py-1 text-xs font-bold text-center uppercase"
                      />
                    </div>
                    {structure.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePart(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Number of Questions</label>
                    <input
                      type="number"
                      min="0"
                      value={part.num_questions}
                      onChange={(e) => updatePart(idx, 'num_questions', Math.max(0, parseInt(e.target.value) || 0))}
                      className="academic-input w-full px-2.5 py-1.5 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Marks per Question</label>
                    <input
                      type="number"
                      min="1"
                      value={part.marks_per_question}
                      onChange={(e) => updatePart(idx, 'marks_per_question', Math.max(1, parseInt(e.target.value) || 1))}
                      className="academic-input w-full px-2.5 py-1.5 text-xs font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="academic-button-primary px-5 py-2.5 flex items-center gap-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {loading ? 'Creating Examination Session...' : 'Create Examination & Proceed'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
