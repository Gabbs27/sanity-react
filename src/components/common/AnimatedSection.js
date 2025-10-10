import React from "react";
import { motion } from "framer-motion";

/**
 * AnimatedSection - Componente reutilizable para animaciones con Framer Motion
 * Reemplaza react-reveal con mejor performance y más control
 */

const AnimatedSection = ({
  children,
  variant = "fadeInUp",
  duration = 0.5,
  delay = 0,
  className = "",
}) => {
  const variants = {
    fadeInUp: {
      hidden: { opacity: 0, y: 40 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.4, 0.25, 1],
        },
      },
    },
    fadeIn: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration,
          delay,
        },
      },
    },
    fadeInLeft: {
      hidden: { opacity: 0, x: -40 },
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.4, 0.25, 1],
        },
      },
    },
    fadeInRight: {
      hidden: { opacity: 0, x: 40 },
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.4, 0.25, 1],
        },
      },
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.4, 0.25, 1],
        },
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={variants[variant]}>
      {children}
    </motion.div>
  );
};

export default AnimatedSection;


