import { useState, useRef, useEffect, useCallback } from 'react';

export const useCamera = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) or 'environment' (back)

  // Enumerate video devices
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return;
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Failed to enumerate media devices:', err);
    }
  }, [selectedDeviceId]);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setIsLoading(false);
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError({
        type: 'UNSUPPORTED',
        message: 'Camera access is not supported by your browser. Please use a modern browser like Chrome, Edge, or Safari.',
      });
      return false;
    }

    setIsLoading(true);
    setError(null);

    // Stop existing stream first
    if (streamRef.current) {
      stopCamera();
    }

    const constraints = {
      audio: false,
      video: selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
        : { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      setIsLoading(false);
      await refreshDevices();
      return true;
    } catch (err) {
      setIsActive(false);
      setIsLoading(false);

      let errorInfo = {
        type: 'UNKNOWN',
        message: 'Unable to access webcam. Please check your camera connection.',
      };

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorInfo = {
          type: 'PERMISSION_DENIED',
          message: 'Camera permission was denied. Please click the lock/camera icon in your browser address bar to allow camera access, then try again.',
        };
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorInfo = {
          type: 'DEVICE_NOT_FOUND',
          message: 'No video capture device was detected on your system. Please connect a webcam.',
        };
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorInfo = {
          type: 'IN_USE',
          message: 'Your webcam is currently being used by another application (e.g. Zoom, Teams, Meet). Please close that app and retry.',
        };
      } else if (err.name === 'OverconstrainedError') {
        errorInfo = {
          type: 'OVERCONSTRAINED',
          message: 'The requested camera resolution or facing mode is not supported by your camera hardware.',
        };
      }

      setError(errorInfo);
      return false;
    }
  }, [selectedDeviceId, facingMode, stopCamera, refreshDevices]);

  // Capture a current video frame as base64 JPEG
  // Supports ROI guide box cropping and mirroring for optimal ViT hand recognition
  const captureFrame = useCallback(
    (targetWidth = 224, targetHeight = 224, cropToGuideBox = true, mirror = true) => {
      if (!videoRef.current || !isActive || videoRef.current.readyState < 2) {
        return null;
      }

      const video = videoRef.current;
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      const canvas = canvasRef.current;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;

      let sx = 0;
      let sy = 0;
      let sWidth = videoWidth;
      let sHeight = videoHeight;

      if (cropToGuideBox) {
        // Crop the central square corresponding to the on-screen hand guide box
        const boxSize = Math.round(Math.min(videoWidth, videoHeight) * 0.68);
        sx = Math.round((videoWidth - boxSize) / 2);
        sy = Math.round((videoHeight - boxSize) / 2);
        sWidth = boxSize;
        sHeight = boxSize;
      }

      ctx.clearRect(0, 0, targetWidth, targetHeight);

      if (mirror) {
        // Match user's selfie-mirrored perspective so orientation matches on-screen gesture
        ctx.save();
        ctx.translate(targetWidth, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
        ctx.restore();
      } else {
        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
      }

      // Return high quality base64 JPEG
      return canvas.toDataURL('image/jpeg', 0.88);
    },
    [isActive]
  );

  // Cleanup tracks on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isActive,
    isLoading,
    error,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    facingMode,
    setFacingMode,
    startCamera,
    stopCamera,
    captureFrame,
  };
};
