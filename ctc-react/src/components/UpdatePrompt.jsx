import { useState, useEffect } from 'react';

/**
 * Detects when a new Service Worker is installed and waiting.
 * Shows a banner so the admin can apply the update without manually refreshing.
 */
export default function UpdatePrompt() {
  const [waitingSW, setWaitingSW] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration = null;

    function handleWaiting(reg) {
      if (reg.waiting) {
        setWaitingSW(reg.waiting);
        setDismissed(false);
      }
    }

    // Check immediately on load
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      registration = reg;
      handleWaiting(reg);

      // Listen for a new SW becoming installed/waiting
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingSW(newWorker);
            setDismissed(false);
          }
        });
      });
    });

    // Poll every 60 s to check for updates even when the tab stays open
    const interval = setInterval(() => {
      if (registration) registration.update();
    }, 60_000);

    // After the new SW takes control, reload to get fresh assets
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    return () => clearInterval(interval);
  }, []);

  function applyUpdate() {
    if (!waitingSW) return;
    // Tell the waiting SW to skip waiting → triggers 'controllerchange' → reload
    waitingSW.postMessage({ type: 'SKIP_WAITING' });
  }

  if (!waitingSW || dismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(99,102,241,0.45)',
      fontSize: '0.88rem',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      animation: 'swSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <span>🚀 New update available!</span>

      <button
        onClick={applyUpdate}
        style={{
          background: '#fff',
          color: '#4f46e5',
          border: 'none',
          borderRadius: '10px',
          padding: '7px 16px',
          fontWeight: 700,
          fontSize: '0.82rem',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        Update Now
      </button>

      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff',
          borderRadius: '10px',
          padding: '7px 12px',
          fontSize: '0.78rem',
          cursor: 'pointer',
        }}
      >
        Later
      </button>

      <style>{`
        @keyframes swSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(24px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1);    }
        }
      `}</style>
    </div>
  );
}
