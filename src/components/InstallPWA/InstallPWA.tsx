import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTimes } from "@fortawesome/free-solid-svg-icons";
import "./InstallPWA.css";

/**
 * InstallPWA - Prompt component for installing the PWA
 * Shows a native-like install banner
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";
const DISMISSED_FOR_MS = 7 * 24 * 60 * 60 * 1000;

// Whether the visitor closed the prompt within the last week.
//
// It used to be asked once, on mount, by an effect whose only move was to set
// `showInstallPrompt` to false while it was already false; the timer below
// then showed the prompt regardless, so closing it bought exactly one page
// load.
function dismissedRecently(): boolean {
  const at = Number(localStorage.getItem(DISMISSED_KEY));
  return at > 0 && Date.now() - at < DISMISSED_FOR_MS;
}

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Keeps Chrome from showing an install bar of its own. That stands when
      // the card below stays hidden too: a visitor who closed it said no.
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show the prompt five seconds later, unless the visitor has closed it.
      // Asked when the timer fires, not when it is set: the browser can make
      // this offer more than once, each offer starts a timer of its own, and
      // one that was already running when the X was clicked used to open the
      // card again a moment after it closed.
      setTimeout(() => {
        if (!dismissedRecently()) setShowInstallPrompt(true);
      }, 5000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    if (import.meta.env.DEV) console.log(`User response to install prompt: ${outcome}`);

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    
    // Don't show again for 7 days. Read back by dismissedRecently().
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  };

  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showInstallPrompt && (
        <motion.div
          className="install-pwa-container"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="install-pwa-content">
            <div className="install-pwa-icon">
              <img src="/logo192.png" alt="App icon" />
            </div>
            
            <div className="install-pwa-text">
              <h3>Install CodeWithGabo</h3>
              <p>Install this app for quick access and offline functionality!</p>
            </div>

            <div className="install-pwa-actions">
              <button
                onClick={handleInstallClick}
                className="install-btn"
                aria-label="Install app"
              >
                <FontAwesomeIcon icon={faDownload} />
                <span>Install</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="dismiss-btn"
                aria-label="Dismiss install prompt"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPWA;

