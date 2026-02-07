
import { motion } from "motion/react";

/**
 * LoadingSpinner - Componente de loading para Suspense y lazy loading
 */

const LoadingSpinner = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="loading-container">
      <motion.div
        className="loading-spinner"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}>
        <div className="spinner-circle"></div>
      </motion.div>
      <motion.p
        className="loading-message"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}>
        {message}
      </motion.p>
    </div>
  );
};

export default LoadingSpinner;


