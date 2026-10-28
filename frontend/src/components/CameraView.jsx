import React from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Scan,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';

export const CameraView = ({
  videoRef,
  isActive,
  isLoading,
  error,
  devices,
  selectedDeviceId,
  onDeviceChange,
  onStartCamera,
  onStopCamera,
  isInferring,
  activeSign,
  isConfident,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Top Header & Controls */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isActive
                  ? isInferring
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-emerald-500'
                  : 'bg-slate-300'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              {isActive ? (isInferring ? 'Translating...' : 'Camera Live') : 'Camera Inactive'}
            </span>
          </div>

          {isActive && (
            <span className="text-[11px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full">
              4:3 Capture
            </span>
          )}
        </div>

        {/* Camera Selector */}
        {devices.length > 1 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedDeviceId}
              onChange={(e) => onDeviceChange(e.target.value)}
              disabled={!isActive}
              className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden disabled:opacity-50"
            >
              {devices.map((device, idx) => (
                <option key={device.deviceId || idx} value={device.deviceId}>
                  {device.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Video Viewport Area */}
      <div className="relative aspect-4/3 bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Actual Video Tag */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
            isActive ? 'opacity-100' : 'opacity-0 absolute'
          }`}
        />

        {/* Framing & Target Overlay for ISL Signs */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
            <div className="w-64 h-64 border-2 border-dashed border-emerald-400/60 rounded-3xl relative flex items-center justify-center">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-400" />

              <span className="text-[11px] font-medium text-emerald-200/80 bg-slate-900/60 backdrop-blur-xs px-2.5 py-1 rounded-full absolute -top-3.5">
                Align Hand Inside Box
              </span>

              {/* Real-time sign flash inside overlay */}
              {activeSign && isConfident && (
                <div className="w-16 h-16 rounded-2xl bg-emerald-600/90 text-white font-bold text-3xl flex items-center justify-center shadow-lg border border-emerald-300/40">
                  {activeSign}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Offline / Inactive Placeholder State */}
        {!isActive && !isLoading && !error && (
          <div className="text-center p-8 max-w-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <CameraOff className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base mb-1">Webcam is Powered Off</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Start your camera to enable continuous real-time Indian Sign Language translation.
              </p>
            </div>
            <button
              onClick={onStartCamera}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-md transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" />
              Start Webcam
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-white text-sm font-medium">Requesting camera permissions...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isActive && (
          <div className="text-center p-6 max-w-md space-y-3 bg-red-950/80 border border-red-800 rounded-xl m-4">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h4 className="text-red-200 font-semibold text-sm">Camera Connection Error</h4>
            <p className="text-red-300 text-xs leading-relaxed">{error.message}</p>
            <button
              onClick={onStartCamera}
              className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive ? (
            <button
              onClick={onStopCamera}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-colors"
            >
              <CameraOff className="w-3.5 h-3.5" />
              Stop Camera
            </button>
          ) : (
            <button
              onClick={onStartCamera}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              Start Camera
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Good lighting improves prediction accuracy</span>
        </div>
      </div>
    </div>
  );
};
