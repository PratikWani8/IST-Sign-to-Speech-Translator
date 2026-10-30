import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translationService } from '../services/api';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { LoadingState } from '../components/LoadingState';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  Volume2,
  Copy,
  Check,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const History = () => {
  const { user, isAuthenticated } = useAuth();
  const { speak, isSpeaking } = useSpeechSynthesis(user?.preferredSpeechLanguage || 'en-IN');

  const [translations, setTranslations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await translationService.getHistory({
        search: searchQuery,
        category: selectedCategory,
        page,
        limit: 15,
      });
      if (res.success) {
        setTranslations(res.translations || []);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.total || 0);
      }
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, searchQuery, selectedCategory, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this translation record?')) return;
    try {
      await translationService.deleteTranslation(id);
      setTranslations((prev) => prev.filter((t) => t._id !== id));
      setTotalRecords((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert('Failed to delete translation record.');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to permanently clear all translation history? This cannot be undone.')) {
      return;
    }
    try {
      await translationService.clearHistory();
      setTranslations([]);
      setTotalRecords(0);
    } catch (err) {
      alert('Failed to clear history.');
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
          <HistoryIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Sign In to Access History</h2>
        <p className="text-slate-600 text-sm">
          Translation history allows you to review past conversations, search medical and banking records, and re-speak previous phrases.
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm shadow-sm transition-colors"
          >
            Sign In Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Translation History Ledger
            </h1>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              {totalRecords} Confirmed Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Archived record of confirmed ISL phrases and audio translations
          </p>
        </div>

        {translations.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All History
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved translations..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
        >
          <option value="all">All Domain Contexts</option>
          <option value="everyday">Everyday Communication</option>
          <option value="healthcare">Hospital & Healthcare</option>
          <option value="banking">Banking & Finance</option>
          <option value="government">Government Office</option>
          <option value="education">Education</option>
        </select>
      </div>

      {/* List of Translations */}
      {isLoading ? (
        <LoadingState message="Loading your translation records..." />
      ) : translations.length > 0 ? (
        <div className="space-y-3">
          {translations.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    {item.category || 'everyday'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                <div className="text-lg font-bold text-slate-900 leading-snug">
                  {item.userCorrectedText || item.recognizedText}
                </div>

                {item.userCorrectedText && item.recognizedText !== item.userCorrectedText && (
                  <div className="text-xs text-slate-500 font-mono">
                    Raw Signs: {item.recognizedText}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => speak(item.userCorrectedText || item.recognizedText)}
                  title="Speak again aloud"
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleCopy(item.userCorrectedText || item.recognizedText, item._id)}
                  title="Copy text"
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  {copiedId === item._id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => handleDelete(item._id)}
                  title="Delete record"
                  className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200 space-y-3">
          <HistoryIcon className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-slate-800 font-semibold text-base">No Translation Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Confirmed phrases from the Live Translator studio will appear here automatically.
          </p>
          <div className="pt-2">
            <Link
              to="/translator"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 transition-colors"
            >
              Open Translator Studio
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
