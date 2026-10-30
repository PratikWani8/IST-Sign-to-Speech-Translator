import React from 'react';
import { ShieldCheck, AlertTriangle, HelpCircle, BarChart3 } from 'lucide-react';

export const ConfidenceIndicator = ({
  confidence = 0,
  isConfident = false,
  status = 'idle',
  uncertaintyReason = null,
  alternatives = [],
  threshold = 0.55,
}) => {
  const percent = Math.round(confidence * 100);

  const getConfidenceLevel = () => {
    if (percent >= 75) return { label: 'High Confidence', color: 'emerald', bar: 'bg-emerald-600' };
    if (percent >= 55) return { label: 'Moderate Confidence', color: 'amber', bar: 'bg-amber-500' };
    return { label: 'Uncertain / Low', color: 'slate', bar: 'bg-slate-400' };
  };

  const level = getConfidenceLevel();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          Inference Calibration
        </span>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isConfident
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}
        >
          {percent}% Softmax Match
        </span>
      </div>

      {/* Main Confidence Bar */}
      <div className="space-y-1">
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${level.bar}`}
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>0%</span>
          <span className="font-medium text-slate-600">Threshold: {Math.round(threshold * 100)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Uncertainty Notice if Applicable */}
      {!isConfident && uncertaintyReason && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-snug">{uncertaintyReason}</p>
        </div>
      )}

      {/* Alternatives List */}
      {alternatives && alternatives.length > 1 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Top Alternative Classes
          </span>
          <div className="grid grid-cols-2 gap-2">
            {alternatives.slice(1, 4).map((alt, idx) => (
              <div
                key={alt.label || idx}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-100 text-xs"
              >
                <span className="font-semibold text-slate-800">Sign '{alt.label}'</span>
                <span className="text-slate-500 text-[11px] font-mono">
                  {Math.round(alt.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
