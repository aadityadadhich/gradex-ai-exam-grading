import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { UserCheck, CheckCircle2, Edit3, SkipForward, AlertCircle, FileText, Sparkles, Loader2, MessageSquare, HelpCircle, ShieldCheck } from 'lucide-react';

export default function HitlDashboard({ activeExam, onComplete }) {
  const [item, setItem] = useState(null);
  const [counts, setCounts] = useState({ total_evaluations: 0, pending_reviews: 0, completed_reviews: 0, recheck_requests: 0 });
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
      alert('Error submitting moderation decision: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeExam) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="academic-card p-4 bg-white space-y-1">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Total Questions Evaluated</span>
          <span className="text-2xl font-bold text-slate-900 block">{counts.total_evaluations || 0}</span>
        </div>
        <div className="academic-card p-4 bg-white space-y-1">
          <span className="text-[11px] text-amber-700 font-bold uppercase tracking-wider block flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-600" /> Candidate Recheck Requests
          </span>
          <span className="text-2xl font-bold text-amber-900 block">{counts.recheck_requests || 0}</span>
        </div>
        <div className="academic-card p-4 bg-white space-y-1">
          <span className="text-[11px] text-rose-700 font-bold uppercase tracking-wider block">Pending Moderation Queue</span>
          <span className="text-2xl font-bold text-rose-900 block">{counts.pending_reviews || 0}</span>
        </div>
        <div className="academic-card p-4 bg-white space-y-1">
          <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider block">Faculty Verified</span>
          <span className="text-2xl font-bold text-emerald-900 block">{counts.completed_reviews || 0}</span>
        </div>
      </div>

      {loading ? (
        <div className="academic-card p-12 text-center text-slate-500 text-xs font-medium flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Loading faculty moderation queue...
        </div>
      ) : !item ? (
        <div className="academic-card p-12 text-center space-y-3 bg-white">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Faculty Moderation Queue Completed</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            All flagged questions and student recheck submissions have been moderated or confirmed with high confidence.
          </p>
        </div>
      ) : (
        /* Split Screen Review Interface */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Pane: Candidate Script Extract */}
          <div className="academic-card p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="academic-badge badge-slate font-mono font-bold">
                Enrollment No: {item.roll_no}
              </span>
              <span className="academic-badge badge-blue">
                Question {item.question_id} (Max: {item.max_marks} Marks)
              </span>
            </div>

            {/* Candidate Recheck Alert Box */}
            {item.recheck_requested && (
              <div className="academic-badge badge-amber w-full p-3 rounded-lg block space-y-1">
                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-700" /> Candidate Requested Re-evaluation:
                </span>
                <p className="text-xs text-slate-800 font-medium bg-white p-2.5 rounded border border-amber-200">
                  "{item.recheck_comment || 'Candidate requested verification of awarded marks.'}"
                </p>
              </div>
            )}

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" /> Candidate Response (OCR Extract)
              </h4>
              <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {item.ocr_text_preview || 'No text content extracted.'}
              </div>
            </div>
          </div>

          {/* Right Pane: AI Evaluation Logic & Faculty Action */}
          <div className="academic-card p-5 bg-white space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" /> Automated Assessment Breakdown
              </h3>
              <div>
                <span className={`academic-badge text-[11px] ${
                  item.confidence_score >= 0.70 ? 'badge-green' : 'badge-rose'
                }`}>
                  Confidence: {Math.round(item.confidence_score * 100)}%
                </span>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">AI Evaluation Logic</label>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">{item.ai_reasoning}</p>
            </div>

            {/* Faculty Decision Console */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Final Score Overridden</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={item.max_marks}
                      value={overrideScore}
                      onChange={(e) => setOverrideScore(e.target.value)}
                      className="academic-input w-full font-bold text-sm px-3 py-1.5"
                    />
                    <span className="text-xs text-slate-500 font-medium">/ {item.max_marks}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Feedback / Audit Note</label>
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Optional examiner note"
                    className="academic-input w-full text-xs px-3 py-1.5"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  onClick={() => handleReview('APPROVED')}
                  disabled={submitting}
                  className="flex-1 academic-button-primary py-2 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve ({item.suggested_marks})
                </button>

                <button
                  onClick={() => handleReview('MODIFIED')}
                  disabled={submitting}
                  className="flex-1 academic-button-secondary py-2 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" /> Override ({overrideScore})
                </button>

                <button
                  onClick={loadQueueItem}
                  disabled={submitting}
                  className="academic-button-secondary px-3 py-2 text-xs font-semibold cursor-pointer"
                  title="Skip to next item"
                >
                  <SkipForward className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
