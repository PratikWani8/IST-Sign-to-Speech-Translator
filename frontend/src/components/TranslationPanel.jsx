import React from 'react';
import {
  Check,
  X,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Flame,
} from 'lucide-react';

export const TranslationPanel = ({
  currentSign,
  confidence,
  isConfident,
  status,
  uncertaintyReason,
  onConfirmSign,
  onRejectSign,
  selectedCategory,
  onCategoryChange,
  holdProgress = 0, // 0 to 100% of required hold duration
  holdRequired = false,
  isInferring = false,
}) => {
  const categories = [
    { id: 'everyday', label: 'Everyday Life' },
    { id: 'healthcare', label: 'Hospital & Healthcare' },
    { id: 'banking', label: 'Banking & Finance' },
    { id: 'government', label: 'Government Office' },
    { id: 'education', label: 'Education' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      {/* Category selector */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Layers className="w-4 h-4 text-emerald-700" />
          <span>Active Context Mode:</span>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="text-xs font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Main Live Prediction Card */}
      <div
        className={`relative rounded-2xl p-6 border-2 transition-all flex flex-col items-center justify-center min-h-[170px] ${
          currentSign && isConfident
            ? 'bg-emerald-50/50 border-emerald-400/80 shadow-xs'
            : currentSign
            ? 'bg-amber-50/40 border-amber-300'
            : 'bg-slate-50/70 border-dashed border-slate-200'
        }`}
      >
        {/* Hold progress bar at top of card */}
        {holdProgress > 0 && holdProgress < 100 && (
          <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-100 rounded-t-2xl overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-150"
              style={{ width: `${holdProgress}%` }}
            />
          </div>
        )}

        {currentSign ? (
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Recognized ISL Sign
            </span>
            <div className="text-7xl font-black text-slate-900 tracking-tight font-mono">
              {currentSign}
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isConfident
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {Math.round(confidence * 100)}% Confidence
              </span>

              {isConfident && (
                <span className="text-xs text-slate-500 font-medium">
                  {holdRequired ? 'Hold sign steady to auto-insert' : 'Ready to confirm'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-1.5 py-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-slate-600 font-medium text-sm">
              {isInferring ? 'Analyzing video frame...' : 'Awaiting sign gesture'}
            </p>
            <p className="text-slate-400 text-xs max-w-xs">
              Perform an ISL hand sign inside the camera frame
            </p>
          </div>
        )}
      </div>

      {/* Manual Confirmation / Rejection Buttons */}
      {currentSign && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => onRejectSign()}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
            Reject / Clear
          </button>

          <button
            onClick={() => onConfirmSign(currentSign)}
            className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" />
            Insert Sign '{currentSign}'
          </button>
        </div>
      )}
    </div>
  );
};
