import React from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Dashboard.css";

/**
 * MetricCard - Card para mostrar métricas individuales
 */

const MetricCard = ({ title, value, icon, trend, trendValue, color = "primary" }) => {
  const isPositive = trend === "up";
  
  return (
    <motion.div
      className={`metric-card metric-card-${color}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0,0,0,0.15)" }}
    >
      <div className="metric-header">
        <div className="metric-icon">
          <FontAwesomeIcon icon={icon} />
        </div>
        {trend && (
          <div className={`metric-trend ${isPositive ? "trend-up" : "trend-down"}`}>
            <span className="trend-icon">{isPositive ? "↑" : "↓"}</span>
            <span className="trend-value">{trendValue}</span>
          </div>
        )}
      </div>
      
      <div className="metric-body">
        <h3 className="metric-value">{value}</h3>
        <p className="metric-title">{title}</p>
      </div>
    </motion.div>
  );
};

export default MetricCard;

