import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { UserCheck, CheckCircle2, Edit3, SkipForward, AlertCircle, FileText, Sparkles, Loader2 } from 'lucide-react';

export default function HitlDashboard({ activeExam, onComplete }) {
  const [item, setItem] = useState(null);
  const [counts, setCounts] = useState({ total_evaluations: 0, pending_reviews: 0, completed_reviews: 0 });
  const [overrideScore, setOverrideScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeExam) {
      loadQueueItem();
    }
  }, [activeExam]);

  const loadQueueItem = async () => {
    if (!activeExam) return;
    setLoading(true);
    try {
      const [itemRes, countRes] = await Promise.all([
        api.getNextHitlItem(activeExam.id).catch(() => ({ data: null })),
        api.getHitlCount(activeExam.id).catch(() => ({ data: {} }))
      ]);

      if (countRes.data) {
        setCounts(countRes.data);
      }

      if (itemRes.data) {
        setItem(itemRes.data);
        setOverrideScore(itemRes.data.suggested_marks?.toString() || '0');
        setFeedback('');
      } else {
        setItem(null);
      }
    } catch (err) {
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action) => {
    if (!item || !activeExam) return;
    setSubmitting(true);
    try {
      const finalMarks = action === 'APPROVED' ? item.suggested_marks : parseFloat(overrideScore) || 0.0;
      await api.submitHitlReview(activeExam.id, item.evaluation_id, {
        action: action,
        final_marks: finalMarks,
        teacher_feedback: feedback
      });
      await loadQueueItem();
    } catch (err) {
      alert('Error submitting review: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeExam) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-100 border-2 border-slate-900 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <span className="text-xs text-slate-800 font-extrabold uppercase block">Total Evaluations</span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">{counts.total_evaluations || 0}</span>
        </div>
        <div className="bg-emerald-100 border-2 border-slate-900 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <span className="text-xs text-slate-800 font-extrabold uppercase block">Auto-Passed (Sc &ge; 70%)</span>
          <span className="text-3xl font-black text-emerald-800 mt-1 block">{counts.auto_passed || 0}</span>
        </div>
        <div className="bg-rose-100 border-2 border-slate-900 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <span className="text-xs text-slate-800 font-extrabold uppercase block">Pending HITL Queue</span>
          <span className="text-3xl font-black text-rose-800 mt-1 block">{counts.pending_reviews || 0}</span>
        </div>
        <div className="bg-purple-100 border-2 border-slate-900 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <span className="text-xs text-slate-800 font-extrabold uppercase block">Teacher Verified</span>
          <span className="text-3xl font-black text-purple-900 mt-1 block">{counts.completed_reviews || 0}</span>
        </div>
      </div>

      {loading ? (
        <div className="neo-box p-12 text-center text-slate-700 font-bold flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-purple-700" /> Loading HITL Review Queue...
        </div>
      ) : !item ? (
        <div className="neo-box p-12 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="text-xl font-black text-slate-900">HITL Review Queue Completed!</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto font-medium">
            All flagged questions have been verified by teachers or passed high-confidence criteria.
          </p>
        </div>
      ) : (
        /* Split Screen HITL Review Interface */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Pane: Student Answer Extract */}
          <div className="neo-box p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <span className="text-xs font-black font-mono text-purple-900 bg-purple-200 border-2 border-slate-900 px-3 py-1 rounded-lg">
                Roll No: {item.roll_no}
              </span>
              <span className="text-xs font-black px-3 py-1 bg-yellow-200 text-slate-900 border-2 border-slate-900 rounded-lg">
                Question {item.question_id} (Max: {item.max_marks} Marks)
              </span>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase text-slate-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-900" /> Extracted Student OCR Text
              </h4>
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto border-2 border-slate-900">
                {item.ocr_text_preview || 'No text extracted.'}
              </div>
            </div>
          </div>

          {/* Right Pane: AI Evaluation Reasoning & Overrides */}
          <div className="neo-box p-6 space-y-6">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-700" /> AI Evaluation Breakdown
              </h3>
              <div className="text-right">
                <span className="text-[10px] uppercase font-black text-slate-600 block">Confidence Score</span>
                <span className="text-xs font-black px-2 py-0.5 bg-rose-200 border-2 border-slate-900 rounded-lg text-slate-900">
                  {Math.round(item.confidence_score * 100)}% (Flagged)
                </span>
              </div>
            </div>

            {/* Extracted & Matched Keywords Tags */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-900 mb-1.5">
                  Extracted Student Keywords
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {item.student_extracted_keywords?.map((kw, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-100 border-2 border-slate-900 text-xs font-bold rounded-lg text-slate-900">
                      {kw.keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-900 mb-1.5">
                  Rubric Keyword Matches
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {item.matched_keywords?.map((mk, idx) => (
                    <span key={idx} className="px-2 py-1 bg-emerald-200 border-2 border-slate-900 text-xs font-bold rounded-lg text-slate-900">
                      ✓ {mk.student_keyword} &rarr; {mk.rubric_keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-yellow-50 border-2 border-slate-900 rounded-xl p-4 space-y-1 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <label className="block text-[11px] font-black uppercase text-slate-900">AI Reasoning</label>
              <p className="text-xs text-slate-900 font-medium leading-relaxed">{item.ai_reasoning}</p>
            </div>

            {/* Teacher Override Form */}
            <div className="space-y-4 pt-2 border-t-2 border-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">Final Score Overridden</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={item.max_marks}
                      value={overrideScore}
                      onChange={(e) => setOverrideScore(e.target.value)}
                      className="neo-input w-full font-black text-sm px-3 py-2"
                    />
                    <span className="text-xs text-slate-900 font-black">/ {item.max_marks}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">Teacher Notes / Feedback</label>
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Optional feedback"
                    className="neo-input w-full text-xs font-medium px-3 py-2"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleReview('APPROVED')}
                  disabled={submitting}
                  className="flex-1 neo-button-primary py-2.5 flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve ({item.suggested_marks})
                </button>

                <button
                  onClick={() => handleReview('MODIFIED')}
                  disabled={submitting}
                  className="flex-1 neo-button-accent py-2.5 flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" /> Override ({overrideScore})
                </button>

                <button
                  onClick={loadQueueItem}
                  disabled={submitting}
                  className="neo-button-yellow px-4 py-2.5 text-xs font-bold cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
