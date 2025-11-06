import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';

interface UseWebcamOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  imageFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
}

interface CapturedImage {
  id: string;
  dataUrl: string;
  timestamp: number;
}

export const useWebcam = (options: UseWebcamOptions = {}) => {
  const {
    facingMode = 'environment',
    width = 1280,
    height = 720,
    imageFormat = 'image/jpeg',
    quality = 0.8
  } = options;

  const webcamRef = useRef<Webcam>(null);
  const [isActive, setIsActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const videoConstraints = {
    width,
    height,
    facingMode
  };

  const startCamera = useCallback(() => {
    setIsActive(true);
    setError(null);
  }, []);

  const stopCamera = useCallback(() => {
    setIsActive(false);
  }, []);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot({
        width,
        height,
        // format: imageFormat,
        // quality
      });

      if (imageSrc) {
        const newImage: CapturedImage = {
          id: Date.now().toString(),
          dataUrl: imageSrc,
          timestamp: Date.now()
        };
        
        setCapturedImages(prev => [...prev, newImage]);
        return newImage;
      }
    }
    return null;
  // }, [width, height, imageFormat, quality]);
}, [width, height, quality]);

  const removeImage = useCallback((imageId: string) => {
    setCapturedImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  const clearAllImages = useCallback(() => {
    setCapturedImages([]);
  }, []);

  const handleUserMedia = useCallback(() => {
    setError(null);
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    setError(typeof error === 'string' ? error : error.message);
    setIsActive(false);
  }, []);

  const switchCamera = useCallback(() => {
    // This will trigger a re-render with new constraints
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    return { ...videoConstraints, facingMode: newFacingMode };
  }, [facingMode, videoConstraints]);

  return {
    // Refs
    webcamRef,
    
    // State
    isActive,
    capturedImages,
    error,
    
    // Configuration
    videoConstraints,
    
    // Actions
    startCamera,
    stopCamera,
    capture,
    removeImage,
    clearAllImages,
    switchCamera,
    
    // Event handlers
    handleUserMedia,
    handleUserMediaError
  };
};