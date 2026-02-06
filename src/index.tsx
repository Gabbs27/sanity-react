import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import "./styles/theme.css";
import "./components/common/common.css";
import App from "./App";
import Footer from "./components/Footer";
import Navbar from "./components/navheader/NavHeader";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import InstallPWA from "./components/InstallPWA/InstallPWA";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <HelmetProvider>
          <HashRouter>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <Navbar />
            <main id="main-content" role="main">
              <App />
            </main>
            <Footer />
            <InstallPWA />
          </HashRouter>
        </HelmetProvider>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({
  onUpdate: () => {
    if (window.confirm('New version available! Do you want to update?')) {
      window.location.reload();
    }
  },
  onSuccess: () => {
    console.log('Service Worker registered successfully');
  },
});
