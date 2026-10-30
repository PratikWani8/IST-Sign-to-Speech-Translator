import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCamera } from '../hooks/useCamera';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useAuth } from '../context/AuthContext';
import { aiService, translationService } from '../services/api';
import { CameraView } from '../components/CameraView';
import { TranslationPanel } from '../components/TranslationPanel';
import { SentenceBuilder } from '../components/SentenceBuilder';
import { SpeechControls } from '../components/SpeechControls';
import { ConfidenceIndicator } from '../components/ConfidenceIndicator';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Info,
} from 'lucide-react';

export const Translator = () => {
  const { user, isAuthenticated } = useAuth();

  // Camera hook
  const {
    videoRef,
    isActive: isCameraActive,
    isLoading: isCameraLoading,
    error: cameraError,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    startCamera,
    stopCamera,
    captureFrame,
  } = useCamera();

  // Speech synthesis hook
  const {
    isSupported: isSpeechSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    selectedLang,
    setSelectedLang,
    rate,
    setRate,
    isSpeaking,
    isPaused,
    speak,
    pause,
    resume,
    stop,
  } = useSpeechSynthesis(user?.preferredSpeechLanguage || 'en-IN');

  // Translation State
  const [selectedCategory, setSelectedCategory] = useState('everyday');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.55);
  const [autoInsertEnabled, setAutoInsertEnabled] = useState(true);
  const [sampleIntervalMs, setSampleIntervalMs] = useState(600); // 600ms sampling

  // Live inference state
  const [isInferring, setIsInferring] = useState(false);
  const [currentSign, setCurrentSign] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [isConfident, setIsConfident] = useState(false);
  const [status, setStatus] = useState('idle');
  const [uncertaintyReason, setUncertaintyReason] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [lastLatencyMs, setLastLatencyMs] = useState(0);

  // Temporal stability / hold tracking
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStreakRef = useRef(0);
  const candidateSignRef = useRef(null);
  const lastInsertedSignRef = useRef(null);
  const isInferringLockRef = useRef(false);

  // Sentence Builder State
  const [sentence, setSentence] = useState('');
  const [sentenceHistory, setSentenceHistory] = useState([]);
  const [confirmedTokens, setConfirmedTokens] = useState([]);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(null);

  // Update sentence and push to undo stack
  const updateSentence = (newSentence) => {
    setSentenceHistory((prev) => [...prev, sentence]);
    setSentence(newSentence);
  };

  const handleUndo = () => {
    if (sentenceHistory.length === 0) return;
    const previous = sentenceHistory[sentenceHistory.length - 1];
    setSentenceHistory((prev) => prev.slice(0, -1));
    setSentence(previous);
  };

  // Confirm sign and append to sentence
  const confirmSign = useCallback(
    (signToConfirm) => {
      if (!signToConfirm) return;
      setSentence((prev) => {
        setSentenceHistory((hist) => [...hist, prev]);
        return prev + signToConfirm;
      });
      setConfirmedTokens((prev) => [...prev, signToConfirm]);
      lastInsertedSignRef.current = signToConfirm;
      holdStreakRef.current = 0;
      setHoldProgress(0);
    },
    []
  );

  const rejectSign = useCallback(() => {
    setCurrentSign(null);
    setConfidence(0);
    setIsConfident(false);
    setStatus('idle');
    setUncertaintyReason(null);
    setAlternatives([]);
    holdStreakRef.current = 0;
    candidateSignRef.current = null;
    setHoldProgress(0);
  }, []);

  // Frame processing loop
  useEffect(() => {
    let intervalId = null;

    if (isCameraActive) {
      intervalId = setInterval(async () => {
        // Prevent overlapping inference requests
        if (isInferringLockRef.current) return;

        const frameBase64 = captureFrame(224, 224);
        if (!frameBase64) return;

        isInferringLockRef.current = true;
        setIsInferring(true);

        try {
          const result = await aiService.predictFrame(
            frameBase64,
            selectedCategory,
            confidenceThreshold
          );

          if (result && result.predicted_sign) {
            setCurrentSign(result.predicted_sign);
            setConfidence(result.confidence);
            setIsConfident(result.is_confident);
            setStatus(result.status);
            setUncertaintyReason(result.uncertainty_reason);
            setAlternatives(result.alternatives || []);
            setLastLatencyMs(result.processing_time_ms || 0);

            // Temporal hold stability logic
            if (result.is_confident && result.status === 'success') {
              const sign = result.predicted_sign;

              if (sign === candidateSignRef.current) {
                holdStreakRef.current += 1;
              } else {
                candidateSignRef.current = sign;
                holdStreakRef.current = 1;
              }

              const requiredHoldCount = 2; // ~1.2s of steady hold
              const progressPct = Math.min(100, Math.round((holdStreakRef.current / requiredHoldCount) * 100));
              setHoldProgress(progressPct);

              // Auto-insert if held steadily and not immediately duplicated
              if (
                autoInsertEnabled &&
                holdStreakRef.current >= requiredHoldCount &&
                sign !== lastInsertedSignRef.current
              ) {
                confirmSign(sign);
              }
            } else {
              // Sign became uncertain or blank
              holdStreakRef.current = 0;
              setHoldProgress(0);
              if (result.status === 'uncertain' && !result.predicted_sign) {
                lastInsertedSignRef.current = null;
              }
            }
          }
        } catch (err) {
          console.warn('Frame inference warning:', err.message);
          setStatus('error');
        } finally {
          setIsInferring(false);
          isInferringLockRef.current = false;
        }
      }, sampleIntervalMs);
    } else {
      // Reset inference states when camera turns off
      setIsInferring(false);
      setCurrentSign(null);
      setConfidence(0);
      setIsConfident(false);
      setStatus('idle');
      setHoldProgress(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    isCameraActive,
    captureFrame,
    selectedCategory,
    confidenceThreshold,
    autoInsertEnabled,
    sampleIntervalMs,
    confirmSign,
  ]);

  // Handle Speaking and saving translation
  const handleSpeakSentence = async (textToSpeak) => {
    if (!textToSpeak || textToSpeak.trim() === '') return;

    speak(textToSpeak);

    // Save to translation ledger if user is logged in
    if (isAuthenticated) {
      try {
        const payload = {
          recognizedText: confirmedTokens.join('') || textToSpeak,
          userCorrectedText: textToSpeak,
          supportedSignIds: confirmedTokens,
          category: selectedCategory,
          confidenceMetadata: {
            averageConfidence: confidence || 0.85,
          },
        };
        await translationService.saveTranslation(payload);
        setSaveSuccessNotice('Saved to Translation Ledger');
        setTimeout(() => setSaveSuccessNotice(null), 3000);
      } catch (err) {
        console.warn('Failed to save translation history:', err.message);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Live Sign-to-Speech Studio
            </h1>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              ViT 35-Sign ISL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time optical character and number recognition for Indian Sign Language
          </p>
        </div>

        {/* Inference Latency Metric */}
        <div className="flex items-center gap-3">
          {lastLatencyMs > 0 && isCameraActive && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{Math.round(lastLatencyMs)}ms inference</span>
            </div>
          )}

          {saveSuccessNotice && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-medium animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{saveSuccessNotice}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Camera Feed & Confidence Analysis */}
        <div className="lg:col-span-7 space-y-6">
          <CameraView
            videoRef={videoRef}
            isActive={isCameraActive}
            isLoading={isCameraLoading}
            error={cameraError}
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onDeviceChange={setSelectedDeviceId}
            onStartCamera={startCamera}
            onStopCamera={stopCamera}
            isInferring={isInferring}
            activeSign={currentSign}
            isConfident={isConfident}
          />

          <ConfidenceIndicator
            confidence={confidence}
            isConfident={isConfident}
            status={status}
            uncertaintyReason={uncertaintyReason}
            alternatives={alternatives}
            threshold={confidenceThreshold}
          />
        </div>

        {/* Right Column: Prediction Card, Sentence Construction, Audio Controls */}
        <div className="lg:col-span-5 space-y-6">
          <TranslationPanel
            currentSign={currentSign}
            confidence={confidence}
            isConfident={isConfident}
            status={status}
            uncertaintyReason={uncertaintyReason}
            onConfirmSign={confirmSign}
            onRejectSign={rejectSign}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            holdProgress={holdProgress}
            holdRequired={autoInsertEnabled}
            isInferring={isInferring}
          />

          <SentenceBuilder
            sentence={sentence}
            setSentence={setSentence}
            onSpeak={handleSpeakSentence}
            isSpeaking={isSpeaking}
            onUndo={handleUndo}
            canUndo={sentenceHistory.length > 0}
            recognizedTokens={confirmedTokens}
          />

          <SpeechControls
            isSupported={isSpeechSupported}
            voices={voices}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            selectedLang={selectedLang}
            onLangChange={setSelectedLang}
            rate={rate}
            onRateChange={setRate}
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            onSpeak={handleSpeakSentence}
            onPause={pause}
            onResume={resume}
            onStop={stop}
            currentText={sentence}
          />

          {/* Quick Settings Accordion */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-3">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                Stability & Cooldown Settings
              </span>
            </div>

            <div className="space-y-2 pt-1 border-t border-slate-200/60 text-slate-600">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Auto-insert on steady hold (1.2s):</span>
                <input
                  type="checkbox"
                  checked={autoInsertEnabled}
                  onChange={(e) => setAutoInsertEnabled(e.target.checked)}
                  className="rounded-sm text-emerald-700 focus:ring-emerald-600"
                />
              </label>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>Certainty Threshold:</span>
                  <span className="font-mono text-emerald-800">{Math.round(confidenceThreshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.40"
                  max="0.85"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
