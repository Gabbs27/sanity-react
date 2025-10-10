import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { BaseProvider, LightTheme } from "baseui";
import { Provider as StyletronProvider } from "styletron-react";
import { Client as Styletron } from "styletron-engine-atomic";
import "./index.css";
import "./components/common/common.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import Footer from "./components/Footer";
import Navbar from "./components/navheader/NavHeader";
import ErrorBoundary from "./components/common/ErrorBoundary";

const engine = new Styletron();
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <HashRouter>
          <StyletronProvider value={engine}>
            <BaseProvider theme={LightTheme}>
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <Navbar />
              <main id="main-content" role="main">
                <App />
              </main>
              <Footer />
            </BaseProvider>
          </StyletronProvider>
        </HashRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
