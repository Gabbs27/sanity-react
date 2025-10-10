import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import "./ThemeToggle.css";

/**
 * ThemeToggle - Switch animado para cambiar entre tema claro y oscuro
 */

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <motion.div
        className="theme-toggle-track"
        animate={{
          backgroundColor: isDark ? "#1a1a2e" : "#e8eaf6",
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="theme-toggle-thumb"
          animate={{
            x: isDark ? 24 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 700,
            damping: 30,
          }}
        >
          <motion.div
            animate={{
              rotate: isDark ? 360 : 0,
              scale: isDark ? 0.8 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <FontAwesomeIcon
              icon={isDark ? faMoon : faSun}
              className="theme-icon"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </button>
  );
};

export default ThemeToggle;

