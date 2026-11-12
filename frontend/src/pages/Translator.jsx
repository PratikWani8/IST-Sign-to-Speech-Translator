import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCamera } from '../hooks/useCamera';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useAuth } from '../context/AuthContext';
import { aiService, translationService, vocabularyService } from '../services/api';
import { CameraView } from '../components/CameraView';
import { TranslationPanel } from '../components/TranslationPanel';
import { SentenceBuilder } from '../components/SentenceBuilder';
import { SpeechControls } from '../components/SpeechControls';
import { ConfidenceIndicator } from '../components/ConfidenceIndicator';
import { SignDemonstration } from '../components/SignDemonstration';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Info,
  X,
  BookOpen,
  Search,
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.55);
  const [autoInsertEnabled, setAutoInsertEnabled] = useState(true);
  const [sampleIntervalMs, setSampleIntervalMs] = useState(600); // 600ms sampling

  // ROI Crop & Mirror settings for optimal ViT hand recognition
  const [cropToGuideBox, setCropToGuideBox] = useState(true);
  const [mirrorCapture, setMirrorCapture] = useState(true);

  // Sign Reference Modal State
  const [showSignGuide, setShowSignGuide] = useState(false);
  const [guideVocabulary, setGuideVocabulary] = useState([]);
  const [guideSearch, setGuideSearch] = useState('');
  const [selectedGuideSign, setSelectedGuideSign] = useState(null);

  // Load vocabulary for sign guide
  useEffect(() => {
    const loadVocab = async () => {
      try {
        const res = await vocabularyService.getVocabulary();
        if (res.success && res.vocabulary) {
          setGuideVocabulary(res.vocabulary);
          if (res.vocabulary.length > 0) {
            setSelectedGuideSign(res.vocabulary[0]);
          }
        }
      } catch (err) {
        console.warn('Failed to load vocabulary guide:', err);
      }
    };
    loadVocab();
  }, []);

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

        // Capture frame with guide box crop and mirroring
        const frameBase64 = captureFrame(224, 224, cropToGuideBox, mirrorCapture);
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
    cropToGuideBox,
    mirrorCapture,
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
            cropToGuideBox={cropToGuideBox}
            onToggleCrop={() => setCropToGuideBox((prev) => !prev)}
            mirror={mirrorCapture}
            onToggleMirror={() => setMirrorCapture((prev) => !prev)}
            onOpenSignGuide={() => setShowSignGuide(true)}
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
                Stability & Vision Calibration
              </span>
            </div>

            <div className="space-y-2 pt-1 border-t border-slate-200/60 text-slate-600">
              <label className="flex items-center justify-between cursor-pointer">
                <span title="Crops around the guide box so the hand occupies >70% of the frame">
                  Guide Box Hand Crop (Recommended):
                </span>
                <input
                  type="checkbox"
                  checked={cropToGuideBox}
                  onChange={(e) => setCropToGuideBox(e.target.checked)}
                  className="rounded-sm text-emerald-700 focus:ring-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span>Mirrored Capture:</span>
                <input
                  type="checkbox"
                  checked={mirrorCapture}
                  onChange={(e) => setMirrorCapture(e.target.checked)}
                  className="rounded-sm text-emerald-700 focus:ring-emerald-600"
                />
              </label>

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
                  min="0.35"
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

      {/* Quick Sign Reference Cheat-sheet Modal */}
      {showSignGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ISL Hand Sign Reference Guide (35 Signs)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inspect standard Indian Sign Language hand postures for all digits and alphabets
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSignGuide(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Split view of signs and posture details */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Sign Token Grid */}
              <div className="md:col-span-7 space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={guideSearch}
                    onChange={(e) => setGuideSearch(e.target.value)}
                    placeholder="Search sign (e.g. A, 1, fist, thumb)..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  <div>
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Numeric Signs (1-9)
                    </h5>
                    <div className="grid grid-cols-5 gap-2">
                      {guideVocabulary
                        .filter((v) => v.type === 'digit')
                        .filter(
                          (v) =>
                            !guideSearch.trim() ||
                            v.id.toLowerCase().includes(guideSearch.toLowerCase()) ||
                            v.name.toLowerCase().includes(guideSearch.toLowerCase()) ||
                            v.description.toLowerCase().includes(guideSearch.toLowerCase())
                        )
                        .map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedGuideSign(v)}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              selectedGuideSign?.id === v.id
                                ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                                : 'bg-slate-50 hover:bg-emerald-50/60 border-slate-200 text-slate-800'
                            }`}
                          >
                            <span className="text-lg font-black font-mono block">{v.id}</span>
                            <span className="text-[10px] opacity-75 truncate block">{v.name}</span>
                          </button>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Alphabetic Signs (A-Z)
                    </h5>
                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                      {guideVocabulary
                        .filter((v) => v.type === 'letter')
                        .filter(
                          (v) =>
                            !guideSearch.trim() ||
                            v.id.toLowerCase().includes(guideSearch.toLowerCase()) ||
                            v.name.toLowerCase().includes(guideSearch.toLowerCase()) ||
                            v.description.toLowerCase().includes(guideSearch.toLowerCase())
                        )
                        .map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedGuideSign(v)}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              selectedGuideSign?.id === v.id
                                ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                                : 'bg-slate-50 hover:bg-emerald-50/60 border-slate-200 text-slate-800'
                            }`}
                          >
                            <span className="text-lg font-black font-mono block">{v.id}</span>
                            <span className="text-[10px] opacity-75 truncate block">{v.name}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Selected Sign Details */}
              <div className="md:col-span-5">
                <SignDemonstration sign={selectedGuideSign} />
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <span className="font-semibold block">Pro-Tip for Maximum Accuracy:</span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Hold your hand firmly inside the green guide box with the palm and fingers clearly facing your camera under adequate lighting.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setShowSignGuide(false)}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Close & Return to Translator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
