import { useState, useEffect } from "react";
import { motion } from "motion/react";

/**
 * LazyImage - Componente para carga lazy de imágenes con placeholder
 */

const LazyImage = ({
  src,
  alt,
  className = "",
  placeholderColor = "#f0f0f0",
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
  }, [src]);

  return (
    <div className={`lazy-image-wrapper ${className}`} {...props}>
      {!isLoaded && (
        <motion.div
          className="lazy-image-placeholder"
          style={{ backgroundColor: placeholderColor }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      {imageSrc && (
        <motion.img
          src={imageSrc}
          alt={alt}
          className={`lazy-image ${isLoaded ? "loaded" : ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default LazyImage;


