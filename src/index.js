import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { BaseProvider, LightTheme } from "baseui";
import { Provider as StyletronProvider } from "styletron-react";
import { Client as Styletron } from "styletron-engine-atomic";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import Footer from "./components/Footer";
import Navbar from "./components/navheader/NavHeader";

const engine = new Styletron();
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <HashRouter>
    <StyletronProvider value={engine}>
      <BaseProvider theme={LightTheme}>
        <Navbar />
        <App />
        <Footer />
      </BaseProvider>
    </StyletronProvider>
  </HashRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
