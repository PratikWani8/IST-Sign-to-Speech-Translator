import React from 'react';
import { BookOpen, Info, CheckCircle2, Sparkles, Layers } from 'lucide-react';

export const SignDemonstration = ({ sign }) => {
  if (!sign) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 space-y-2">
        <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
        <p className="text-sm font-medium">Select a sign from vocabulary to inspect details</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
      {/* Sign Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
            Verified ISL Asset
          </span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{sign.name}</h3>
          <p className="text-xs text-slate-500 capitalize">Type: {sign.type}</p>
        </div>

        {/* Large Visual Sign Token */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-900 text-white font-black text-3xl font-mono flex items-center justify-center shadow-md">
          {sign.id}
        </div>
      </div>

      {/* Hand Formation Description */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
          <Info className="w-3.5 h-3.5 text-emerald-700" />
          Hand Shape & Posture
        </h4>
        <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
          {sign.description}
        </p>
      </div>

      {/* Practical Usage Examples */}
      {sign.example_usage && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Practical Applications
          </h4>
          <div className="text-xs text-slate-700 bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{sign.example_usage}</span>
          </div>
        </div>
      )}

      {/* Categories Badge List */}
      {sign.categories && (
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3" />
            Active Domain Categories
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {sign.categories.map((cat) => (
              <span
                key={cat}
                className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg capitalize"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
