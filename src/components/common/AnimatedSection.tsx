
import { type ReactNode } from "react";
import { motion, type Variants } from "motion/react";

/**
 * AnimatedSection - Componente reutilizable para animaciones con Framer Motion
 * Reemplaza react-reveal con mejor performance y más control
 */

type VariantName = "fadeInUp" | "fadeIn" | "fadeInLeft" | "fadeInRight" | "scaleIn";

interface AnimatedSectionProps {
  children: ReactNode;
  variant?: VariantName;
  duration?: number;
  delay?: number;
  className?: string;
}

const AnimatedSection = ({
  children,
  variant = "fadeInUp",
  duration = 0.5,
  delay = 0,
  className = "",
}: AnimatedSectionProps) => {
  const variants: Record<VariantName, Variants> = {
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
