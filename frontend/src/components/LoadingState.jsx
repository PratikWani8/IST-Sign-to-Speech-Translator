import React from 'react';
import { RefreshCw } from 'lucide-react';

export const LoadingState = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 space-y-3">
      <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin" />
      <p className="text-slate-600 text-sm font-medium">{message}</p>
    </div>
  );
};
