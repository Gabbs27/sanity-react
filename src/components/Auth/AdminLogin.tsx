import { useState } from "react";
import { motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faKey, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import SEO from "../common/SEO";
import "./AdminLogin.css";

/**
 * AdminLogin - Componente de login simple para admin
 * Usa un token de acceso para autenticar
 */

const AdminLogin = () => {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate token is not empty
    if (!token.trim()) {
      setError("Please enter an access token");
      setLoading(false);
      return;
    }

    // Validate token by making a test request to the backend
    try {
      const response = await fetch(
        `${import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:5001'}/api/analytics?dateRange=7days`,
        {
          headers: {
            'Authorization': `Bearer ${token.trim()}`,
          },
        }
      );

      if (response.ok) {
        // Token is valid
        login(token.trim());
        navigate("/dashboard");
      } else {
        setError("Invalid access token. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect to analytics server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Admin Login"
        description="Admin login page for dashboard access"
      />

      <div className="admin-login">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="login-header">
            <FontAwesomeIcon icon={faLock} className="lock-icon" />
            <h1>Admin Access</h1>
            <p>Enter your access token to view the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="token">
                <FontAwesomeIcon icon={faKey} /> Access Token
              </label>
              <div className="input-wrapper">
                <input
                  id="token"
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your admin token"
                  className="token-input"
                  autoComplete="off"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowToken(!showToken)}
                  aria-label={showToken ? "Hide token" : "Show token"}
                >
                  <FontAwesomeIcon icon={showToken ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="login-button"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? "Verifying..." : "Access Dashboard"}
            </motion.button>
          </form>

          <div className="login-footer">
            <p className="info-text">
              💡 <strong>Don't have access?</strong> Check out the{" "}
              <a href="/#/dashboard-demo">public demo dashboard</a> instead.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="login-bg-decoration"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </motion.div>
      </div>
    </>
  );
};

export default AdminLogin;



