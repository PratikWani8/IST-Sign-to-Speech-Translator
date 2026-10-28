import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export const ErrorState = ({ title = 'An Error Occurred', message, onRetry }) => {
  return (
    <div className="bg-red-50/70 border border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto my-8 space-y-3">
      <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h4 className="font-semibold text-red-900 text-base">{title}</h4>
        {message && <p className="text-red-700 text-xs sm:text-sm mt-1 leading-relaxed">{message}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-medium text-xs transition-colors shadow-xs"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Retry Operation
        </button>
      )}
    </div>
  );
};
