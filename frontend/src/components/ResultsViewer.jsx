import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BarChart3, Download, FileText, Search, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export default function ResultsViewer({ activeExam }) {
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeExam) {
      fetchResults();
    }
  }, [activeExam]);

  const fetchResults = async () => {
    if (!activeExam) return;
    setLoading(true);
    try {
      const res = await api.getResults(activeExam.id);
      setResults(res.data);
    } catch (err) {
      console.error('Error fetching examination results:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!activeExam) return null;

  const filteredResults = results.filter((r) =>
    r.roll_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgClassScore = results.length > 0
    ? (results.reduce((acc, r) => acc + r.total_marks, 0) / results.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="academic-card p-5 bg-white flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Total Candidate Submissions</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{results.length}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="academic-card p-5 bg-white flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Cohort Mean Score</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{avgClassScore} / {activeExam.total_marks}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="academic-card p-5 bg-white flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Official Gradebook Export</span>
            <a
              href={api.getDownloadCsvUrl(activeExam.id)}
              download
              className="mt-2 academic-button-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 inline-flex"
            >
              <Download className="w-3.5 h-3.5" /> Export Master CSV
            </a>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-slate-600" />
          </div>
        </div>
      </div>

      {/* Results Table Panel */}
      <div className="academic-card p-6 bg-white space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Official Master Examination Gradebook</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Course: <b className="text-slate-800">{activeExam.exam_name}</b> ({activeExam.subject})
            </p>
          </div>

          {/* Search Filter Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by Enrollment No..."
              className="academic-input pl-9 pr-3 py-1.5 text-xs font-medium w-60"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs font-medium">Loading gradebook records...</div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-medium">No candidate assessment records found.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Enrollment / Roll No</th>
                  <th className="px-4 py-2.5">Awarded Marks</th>
                  <th className="px-4 py-2.5">Confidence Metric</th>
                  <th className="px-4 py-2.5">Auto-Passed Qs</th>
                  <th className="px-4 py-2.5">Faculty Reviews</th>
                  <th className="px-4 py-2.5 text-right">Official Transcript</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium bg-white">
                {filteredResults.map((r, idx) => {
                  const confPct = Math.round(r.confidence_average * 100);
                  const isHighConf = confPct >= 70;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{r.roll_no}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 text-xs">{r.total_marks}</span>
                        <span className="text-slate-400 text-[11px]"> / {activeExam.total_marks}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`academic-badge text-[10px] ${
                          isHighConf ? 'badge-green' : 'badge-rose'
                        }`}>
                          {confPct}% {isHighConf ? 'Verified' : 'Moderated'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.num_auto_passed}</td>
                      <td className="px-4 py-3 text-slate-600">{r.num_hitl_reviews}</td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={api.getDownloadPdfUrl(activeExam.id, r.roll_no)}
                          download
                          className="academic-button-secondary px-2.5 py-1 text-[11px] inline-flex items-center gap-1.5 cursor-pointer text-blue-700 hover:text-blue-900"
                        >
                          <Download className="w-3 h-3" /> Grade Report PDF
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
