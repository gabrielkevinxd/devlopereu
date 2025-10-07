import { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';

const SplineContainer = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 1;
  background-color: #000000;
  will-change: transform;
  contain: content;
`;

const SplineIframe = styled.iframe`
  width: 100%;
  height: 120%;
  border: none;
  transform: translateY(-5%);
  pointer-events: auto;
  background-color: #000000;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  will-change: transform, opacity;
  contain: size layout style;
  loading: lazy;
  &.loaded {
    opacity: 1;
  }
`;

const LoadingContainer = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000000;
  color: #FFD700;
  flex-direction: column;
  gap: 1rem;
  pointer-events: none;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #FFD700;
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  will-change: transform;
  contain: strict;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export function SplineRobot() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMouseTracking, setIsMouseTracking] = useState(false);
  const lastUpdateRef = useRef(0);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const rafRef = useRef<number>();

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    requestIdleCallback(() => {
      iframe.classList.add('loaded');
      setIsLoading(false);
      setIsMouseTracking(true);
      retryCountRef.current = 0;
    }, { timeout: 500 });
  }, []);

  const retryLoading = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || retryCountRef.current >= maxRetries) return;

    retryCountRef.current += 1;
    const currentSrc = iframe.src;
    iframe.src = '';
    requestAnimationFrame(() => {
      iframe.src = currentSrc;
    });
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    iframe.addEventListener('load', handleLoad, { passive: true });
    
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        retryLoading();
      }
    }, 10000);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      clearTimeout(timeoutId);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isLoading, handleLoad, retryLoading]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafRef.current) return;
    
    rafRef.current = requestAnimationFrame(() => {
      const now = performance.now();
      if (now - lastUpdateRef.current < 16) {
        rafRef.current = undefined;
        return;
      }

      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) {
        rafRef.current = undefined;
        return;
      }

      const rect = iframe.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        rafRef.current = undefined;
        return;
      }

      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      iframe.contentWindow.postMessage({
        type: 'mouse-move',
        data: { x, y }
      }, '*');

      lastUpdateRef.current = now;
      rafRef.current = undefined;
    });
  }, []);

  useEffect(() => {
    if (!isMouseTracking) return;

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isMouseTracking, handleMouseMove]);

  return (
    <SplineContainer>
      {isLoading && (
        <LoadingContainer>
          <LoadingSpinner />
          <span>Carregando modelo 3D...</span>
        </LoadingContainer>
      )}
      <SplineIframe
        ref={iframeRef}
        src="https://my.spline.design/nexbotrobotcharacterconcept-9535a59d3c4b0ac01baeaee1f76d6da5/"
        title="3D Robot Interactive Model"
        loading="lazy"
        style={{ 
          backgroundColor: '#000000',
          visibility: isLoading ? 'hidden' : 'visible'
        }}
      />
    </SplineContainer>
  );
}