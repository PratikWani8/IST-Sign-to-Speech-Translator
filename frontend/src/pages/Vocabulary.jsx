import React, { useState, useEffect } from 'react';
import { vocabularyService } from '../services/api';
import { SignDemonstration } from '../components/SignDemonstration';
import { LoadingState } from '../components/LoadingState';
import {
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export const Vocabulary = () => {
  const [vocabulary, setVocabulary] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'letter', 'digit'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSign, setSelectedSign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [vocabRes, catRes] = await Promise.all([
          vocabularyService.getVocabulary(),
          vocabularyService.getCategories(),
        ]);

        if (vocabRes.success && vocabRes.vocabulary) {
          setVocabulary(vocabRes.vocabulary);
          if (vocabRes.vocabulary.length > 0) {
            setSelectedSign(vocabRes.vocabulary[0]);
          }
        }

        if (catRes.success && catRes.categories) {
          setCategories(catRes.categories);
        }
      } catch (err) {
        console.warn('Failed to load vocabulary data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter vocabulary
  const filteredVocabulary = vocabulary.filter((item) => {
    // Type filter
    if (selectedType !== 'all' && item.type !== selectedType) {
      return false;
    }

    // Category filter
    if (
      selectedCategory !== 'all' &&
      (!item.categories || !item.categories.includes(selectedCategory.toLowerCase()))
    ) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = item.id.toLowerCase().includes(q);
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchUsage = item.example_usage && item.example_usage.toLowerCase().includes(q);
      return matchId || matchName || matchDesc || matchUsage;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Verified ISL Vocabulary Ledger
          </h1>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
            35 Certified Classes
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore the official standardized Indian Sign Language fingerspelling alphabets and numeric signs.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sign, letter, word, or medical term..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          {/* Type and Category Selectors */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Type buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
              {['all', 'letter', 'digit'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    selectedType === t
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {t === 'all' ? 'All Types' : `${t}s`}
                </button>
              ))}
            </div>

            {/* Category dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
            >
              <option value="all">All Domain Contexts</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading certified ISL vocabulary..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Vocabulary Sign Grid */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Showing {filteredVocabulary.length} of {vocabulary.length} supported signs</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filteredVocabulary.map((sign) => {
                const isSelected = selectedSign && selectedSign.id === sign.id;
                return (
                  <button
                    key={sign.id}
                    onClick={() => setSelectedSign(sign)}
                    className={`relative p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
                      isSelected
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500 scale-102'
                        : 'bg-white hover:bg-emerald-50/60 border-slate-200 text-slate-800 hover:border-emerald-300 shadow-xs'
                    }`}
                  >
                    <span className="font-mono text-3xl font-black">{sign.id}</span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        isSelected ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      {sign.type}
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredVocabulary.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
                <p className="text-sm font-medium">No signs matching the active filters were found.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedType('all');
                    setSearchQuery('');
                  }}
                  className="mt-3 text-xs text-emerald-800 font-semibold hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Right: Detailed Inspection Card */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <SignDemonstration sign={selectedSign} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
