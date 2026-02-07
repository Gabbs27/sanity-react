import { useState } from "react";
import { motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faEye,
  faClock,
  faChartLine,
  faDesktop,
  faMobile,
  faGlobe,
  faCircle,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import MetricCard from "./MetricCard";
import ChartCard from "./ChartCard";
import useAnalyticsData from "../../hooks/useAnalyticsData";
import usePageTracking from "../../hooks/useAnalytics";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import SEO from "../common/SEO";
import LoadingSpinner from "../common/LoadingSpinner";
import "./Dashboard.css";

/**
 * Dashboard - Analytics Dashboard completo
 * Muestra métricas, gráficos y estadísticas del portafolio
 * Usa datos reales de GA4 API cuando está autenticado
 */

const Dashboard = () => {
  usePageTracking();
  const [dateRange, setDateRange] = useState("30days");
  const { adminToken, logout } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useAnalyticsData(dateRange, adminToken, false);

  if (loading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error loading analytics</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { overview, pageViews, topPages, topCountries, devices, browsers, realtimeUsers } = data;

  return (
    <>
      <SEO
        title="Analytics Dashboard"
        description="View analytics and insights for Gabriel Abreu's portfolio website"
        url="https://codewithgabo.com/#/dashboard"
      />

      <div className="dashboard">
        <div className="dashboard-container">
          {/* Header */}
          <motion.div
            className="dashboard-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="dashboard-title-section">
              <h1 className="dashboard-title">Analytics Dashboard</h1>
              <p className="dashboard-subtitle">
                Real-time data from Google Analytics 4
              </p>
            </div>

            {/* Logout button */}
            <motion.button
              className="logout-button"
              onClick={() => {
                logout();
                navigate("/");
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Logout"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              <span>Logout</span>
            </motion.button>

            {/* Real-time indicator */}
            <div className="realtime-indicator">
              <FontAwesomeIcon icon={faCircle} className="realtime-dot" />
              <span className="realtime-text">{realtimeUsers} users online</span>
            </div>

            {/* Date range selector */}
            <div className="date-range-selector">
              <button
                className={`date-btn ${dateRange === "7days" ? "active" : ""}`}
                onClick={() => setDateRange("7days")}
              >
                7 Days
              </button>
              <button
                className={`date-btn ${dateRange === "30days" ? "active" : ""}`}
                onClick={() => setDateRange("30days")}
              >
                30 Days
              </button>
              <button
                className={`date-btn ${dateRange === "90days" ? "active" : ""}`}
                onClick={() => setDateRange("90days")}
              >
                90 Days
              </button>
            </div>
          </motion.div>

          {/* Metric Cards */}
          <div className="metrics-grid">
            <MetricCard
              title="Total Visits"
              value={overview.totalVisits.toLocaleString()}
              icon={faChartLine}
              trend="up"
              trendValue="+12.5%"
              color="primary"
            />
            <MetricCard
              title="Unique Visitors"
              value={overview.uniqueVisitors.toLocaleString()}
              icon={faUsers}
              trend="up"
              trendValue="+8.3%"
              color="secondary"
            />
            <MetricCard
              title="Page Views"
              value={overview.pageViews.toLocaleString()}
              icon={faEye}
              trend="up"
              trendValue="+15.2%"
              color="accent"
            />
            <MetricCard
              title="Avg. Session"
              value={overview.avgSessionDuration}
              icon={faClock}
              trend="down"
              trendValue="-2.1%"
              color="warning"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="charts-grid">
            <ChartCard
              title="Visitors Over Time"
              type="area"
              data={pageViews}
              dataKeys={[
                { key: "views", name: "Page Views", color: "primary" },
                { key: "visitors", name: "Visitors", color: "secondary" },
              ]}
              height={300}
            />
          </div>

          {/* Charts Row 2 */}
          <div className="charts-grid-2col">
            <ChartCard
              title="Top Pages"
              type="bar"
              data={topPages}
              dataKeys={[
                { key: "page", name: "Page" },
                { key: "views", name: "Views", color: "primary" },
              ]}
              height={300}
            />

            <ChartCard
              title="Device Distribution"
              type="pie"
              data={devices}
              dataKeys={[{ key: "users", name: "Users" }]}
              height={300}
            />
          </div>

          {/* Tables Section */}
          <div className="tables-grid">
            {/* Top Countries Table */}
            <motion.div
              className="data-table-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="table-header">
                <FontAwesomeIcon icon={faGlobe} className="table-icon" />
                <h3>Top Countries</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Visitors</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {topCountries.map((country, index) => (
                    <tr key={index}>
                      <td>{country.country}</td>
                      <td>{country.visitors.toLocaleString()}</td>
                      <td>
                        <div className="percentage-bar-container">
                          <div
                            className="percentage-bar"
                            style={{ width: `${country.percentage}%` }}
                          />
                          <span className="percentage-text">
                            {country.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            {/* Browsers Table */}
            <motion.div
              className="data-table-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="table-header">
                <FontAwesomeIcon icon={faDesktop} className="table-icon" />
                <h3>Top Browsers</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Browser</th>
                    <th>Users</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {browsers.map((browser, index) => (
                    <tr key={index}>
                      <td>{browser.browser}</td>
                      <td>{browser.users.toLocaleString()}</td>
                      <td>
                        <div className="percentage-bar-container">
                          <div
                            className="percentage-bar"
                            style={{ width: `${browser.percentage}%` }}
                          />
                          <span className="percentage-text">
                            {browser.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>

          {/* Additional Metrics */}
          <motion.div
            className="additional-metrics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="metric-pill">
              <span className="pill-label">Bounce Rate:</span>
              <span className="pill-value">{overview.bounceRate}</span>
            </div>
            <div className="metric-pill">
              <span className="pill-label">New Visitors:</span>
              <span className="pill-value">{overview.newVsReturning.new}%</span>
            </div>
            <div className="metric-pill">
              <span className="pill-label">Returning Visitors:</span>
              <span className="pill-value">{overview.newVsReturning.returning}%</span>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

