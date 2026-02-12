import { useState, useCallback, useMemo, useRef, useEffect, memo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faEye,
  faEyeSlash,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { loadHeartShape } from "@tsparticles/shape-heart";
import confetti from "canvas-confetti";
import type { ISourceOptions } from "@tsparticles/engine";
import "./Valentine.css";

const SECRET_PASSWORD = "triangulo";

// Fotos optimizadas (1200px)
const photos: string[] = [
  "/valentiness/224f08e3-8ad7-4999-81d6-06b522e9cf04.JPG",
  "/valentiness/CHE00716.JPG",
  "/valentiness/CHE00904.JPG",
  "/valentiness/CHE01182.JPG",
  "/valentiness/CHE01193.JPG",
  "/valentiness/CHE01212.JPG",
  "/valentiness/CHE01745.JPG",
  "/valentiness/CHE01868.JPG",
  "/valentiness/DSC09904.JPG",
  "/valentiness/ERA00161.JPG",
  "/valentiness/ERA00919.JPG",
  "/valentiness/Gables - 75.JPG",
  "/valentiness/IMG_0099.jpg",
  "/valentiness/IMG_0934.JPG",
  "/valentiness/IMG_1585.JPG",
  "/valentiness/IMG_1784.JPG",
  "/valentiness/IMG_3757.JPG",
  "/valentiness/IMG_5381.JPG",
  "/valentiness/IMG_5603.JPG",
  "/valentiness/IMG_5939.jpg",
  "/valentiness/IMG_6305.JPG",
  "/valentiness/IMG_6582.JPG",
  "/valentiness/IMG_6887.JPG",
  "/valentiness/IMG_7116.jpg",
  "/valentiness/IMG_7176.jpg",
  "/valentiness/IMG_7701.JPG",
  "/valentiness/IMG_9583.JPG",
  "/valentiness/b3ea02b6-ae8c-4a8f-91ad-82c823b992d6.JPG",
  "/valentiness/cbc8a379-f1a3-44f0-b836-d75cb3388b5b.JPG",
];

const flowerEmojis = [
  "🌹",
  "🌻",
  "🌷",
  "🌺",
  "🌸",
  "💐",
  "🌼",
  "❤️",
  "💝",
  "💐",
];

// ==================== TSPARTICLES CONFIG ====================
const heartsConfig: ISourceOptions = {
  fullScreen: false,
  particles: {
    number: { value: 35, density: { enable: true, width: 800, height: 800 } },
    color: {
      value: [
        "#ff0000",
        "#ff1493",
        "#ff69b4",
        "#ff6b81",
        "#c44569",
        "#e84393",
        "#fd79a8",
      ],
    },
    shape: { type: "heart" },
    opacity: {
      value: { min: 0.3, max: 0.7 },
      animation: { enable: true, speed: 0.5, sync: false },
    },
    size: {
      value: { min: 8, max: 22 },
      animation: { enable: true, speed: 2, sync: false },
    },
    move: {
      enable: true,
      speed: { min: 0.8, max: 2.5 },
      direction: "bottom",
      outModes: { default: "out", top: "out", bottom: "out" },
      straight: false,
    },
    rotate: {
      value: { min: 0, max: 360 },
      direction: "random",
      animation: { enable: true, speed: 3, sync: false },
    },
    wobble: { enable: true, distance: 15, speed: 3 },
    tilt: {
      enable: true,
      direction: "random",
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 5, sync: false },
    },
  },
  detectRetina: true,
};

const lockScreenConfig: ISourceOptions = {
  fullScreen: false,
  particles: {
    number: { value: 20, density: { enable: true, width: 800, height: 800 } },
    color: { value: ["#ff69b4", "#ff1493", "#ffffff", "#ffd700"] },
    shape: { type: ["heart", "circle"] },
    opacity: {
      value: { min: 0.2, max: 0.6 },
      animation: { enable: true, speed: 0.8, sync: false },
    },
    size: {
      value: { min: 4, max: 14 },
      animation: { enable: true, speed: 2, sync: false },
    },
    move: {
      enable: true,
      speed: { min: 0.5, max: 1.5 },
      direction: "none",
      outModes: { default: "bounce" },
      straight: false,
    },
    rotate: {
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 5, sync: false },
    },
    twinkle: {
      particles: {
        enable: true,
        frequency: 0.05,
        color: { value: "#ffffff" },
        opacity: 0.8,
      },
    },
  },
  interactivity: {
    events: { onHover: { enable: true, mode: "bubble" } },
    modes: { bubble: { distance: 150, size: 20, duration: 2, opacity: 0.8 } },
  },
  detectRetina: true,
};

// ==================== PARTICLES BACKGROUND ====================
const ParticlesBackground = memo(
  ({ config, id }: { config: ISourceOptions; id: string }) => {
    const [ready, setReady] = useState(false);

    useEffect(() => {
      initParticlesEngine(async (engine) => {
        await loadSlim(engine);
        await loadHeartShape(engine);
      }).then(() => setReady(true));
    }, []);

    if (!ready) return null;

    return <Particles id={id} options={config} className="particles-bg" />;
  },
);

// ==================== LAZY IMAGE ====================
const LazyImage = memo(({ src, alt }: { src: string; alt: string }) => {
  const imgRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} style={{ width: "100%", height: "100%" }}>
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        />
      )}
    </div>
  );
});

// ==================== CANVAS-CONFETTI CELEBRATION ====================
const fireCelebration = () => {
  const duration = 5000;
  const end = Date.now() + duration;

  // Crear shapes de emojis
  const heart = confetti.shapeFromText({ text: "❤️", scalar: 2 });
  const rose = confetti.shapeFromText({ text: "🌹", scalar: 2 });
  const sunflower = confetti.shapeFromText({ text: "🌻", scalar: 2 });
  const tulip = confetti.shapeFromText({ text: "🌷", scalar: 2 });

  const frame = () => {
    // Confetti clasico de los lados
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ["#ff0000", "#ff69b4", "#ff1493", "#ffd700", "#ff6b81"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ["#ff0000", "#ff69b4", "#ff1493", "#ffd700", "#ff6b81"],
    });

    // Flores y corazones emoji cayendo desde arriba
    if (Math.random() > 0.6) {
      confetti({
        particleCount: 1,
        shapes: [heart, rose, sunflower, tulip],
        scalar: 2,
        spread: 160,
        origin: { x: Math.random(), y: -0.1 },
        gravity: 0.6,
        drift: (Math.random() - 0.5) * 2,
        ticks: 300,
      });
    }

    if (Date.now() < end) requestAnimationFrame(frame);
  };

  // Gran explosion inicial
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.5 },
    colors: ["#ff0000", "#ff69b4", "#ff1493", "#ffd700", "#c44569"],
  });
  confetti({
    particleCount: 30,
    shapes: [heart, rose, sunflower, tulip],
    scalar: 3,
    spread: 180,
    origin: { y: 0.5 },
    gravity: 0.4,
    ticks: 400,
  });

  frame();
};

// ==================== LIGHTBOX ====================
const Lightbox = memo(
  ({ src, onClose }: { src: string; onClose: () => void }) => (
    <motion.div
      className="lightbox-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.img
        src={src}
        alt="Nosotros"
        className="lightbox-img"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      />
      <button className="lightbox-close" onClick={onClose}>
        &times;
      </button>
    </motion.div>
  ),
);

// ==================== BOTON "NO" INFINITO ====================
const noMessages = [
  "¡Jaja no puedes! 😂",
  "¡Ni lo intentes! 🏃‍♂️",
  "¡Ooops! 🫣",
  "¡Nope! 🙅‍♂️",
  "Jiji sigue intentando 😜",
  "¡Esa no es la respuesta! ❌",
  "Error 404: Botón no encontrado 🤖",
  "¡Mejor di que sí! 💕",
  "¿Te escapaste? No, ¡yo me escapé! 🏃",
  "¡Catch me if you can! 🎯",
  "¡Imposible tocarlo! 🚫",
  "¿Acaso no me quieres? 🥺",
  "¡Nooooo por favor! 😭",
  "Mi corazón se rompe... 💔",
  "¡Piénsalo bien! 🤔",
  "¿Segura? ¡Mira que soy bueno! 😎",
  "Las flores lloran... 🌹😢",
  "¡El girasol dice que sí! 🌻",
  "¡Soy más rápido que tú! 💨",
  "¡Este botón tiene piernas! 🦵",
  "Aquí no hay 'No' que valga 😤",
  "¡Ja! Casi... pero no 😏",
  "Intento #??? — ¡oh wait! 🤭",
  "¡Soy el botón más escurridizo! 🐍",
  "¿Sabías que 'No' no existe aquí? 🤷‍♂️",
  "Loading respuesta correcta... ¡SÍ! ✅",
  "Mejor dale al de ¡SÍ! 💖",
  "Tu corazón sabe la respuesta 💗",
  "El amor siempre gana ❤️",
  "Di que sí y habrá sorpresa 🎁",
  "¡Los tulipanes quieren que digas sí! 🌷",
  "Un no hoy = mil besos perdidos 😘",
  "No era no... era SÍ con estilo 😎",
  "task failed successfully 🖥️",
  "this.button.escape() 👨‍💻",
  "git commit -m 'dijo que SI' 🎉",
  "sudo rm -rf no 💻",
  "¡Hasta el CSS huye de ti! 🎨",
  "console.log('di que sí') 🤓",
  "npm install amor --save 📦",
  "¡Me voy pa'l otro lado! 🌎",
  "¡Velocidad: over 9000! ⚡",
  "¡No me vas a atrapar! 🐇",
  "Respuesta incorrecta, intenta con 'SÍ' 💡",
  "¿Y si mejor me das un beso? 😘",
  "¡Abracadabra! *desaparece* 🎩✨",
  "CTRL+Z esa decisión 🔄",
  "¡Hasta la vista, baby! 🤖",
  "¡Me niego a ser clickeado! 🛑",
  "¿No? ¡Eso no está en mi vocabulario! 📖",
];

const RunawayNoButton = () => {
  // Posición real en px (top/left del viewport)
  const [btnPos, setBtnPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [initialized, setInitialized] = useState(false);
  const [message, setMessage] = useState("");
  const [escaped, setEscaped] = useState(false);
  const [btnSize, setBtnSize] = useState(1);
  const escapeCount = useRef(0);
  const shrinkPhase = useRef(false);
  const placeholderRef = useRef<HTMLDivElement>(null);

  // Inicializar posición del botón donde está el placeholder
  useEffect(() => {
    if (!initialized && placeholderRef.current) {
      const rect = placeholderRef.current.getBoundingClientRect();
      setBtnPos({ top: rect.top + window.scrollY, left: rect.left });
      setInitialized(true);
    }
  }, [initialized]);

  const handleInteraction = useCallback(() => {
    escapeCount.current += 1;

    // Cada 5 intentos cambia tamaño (loop infinito)
    if (escapeCount.current % 5 === 0) {
      setBtnSize((prev) => {
        if (prev <= 0.4) {
          shrinkPhase.current = false;
          return 0.6;
        }
        if (prev >= 1) {
          shrinkPhase.current = true;
        }
        return shrinkPhase.current
          ? Math.max(0.4, prev - 0.12)
          : Math.min(1, prev + 0.12);
      });
    }

    // Nuevo destino aleatorio VISIBLE en el viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scrollY = window.scrollY;
    const pad = 70;

    setBtnPos({
      top: scrollY + pad + Math.random() * (vh - pad * 2),
      left: pad + Math.random() * (vw - pad * 2 - 160),
    });

    const idx = Math.floor(Math.random() * noMessages.length);
    setMessage(noMessages[idx]);
    setEscaped(true);
    setTimeout(() => setEscaped(false), 1800);
  }, []);

  // Portal: renderizar directo en body, fuera de todo overflow/transform
  const portalContent = initialized ? (
    <>
      <motion.button
        className="runaway-no-btn"
        animate={{ top: btnPos.top, left: btnPos.left, scale: btnSize }}
        transition={{ type: "spring", stiffness: 250, damping: 22 }}
        onMouseEnter={handleInteraction}
        onTouchStart={handleInteraction}>
        No 😢
      </motion.button>
      <AnimatePresence>
        {escaped && message && (
          <motion.div
            className="runaway-message"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: btnPos.top - 45,
              left: btnPos.left,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}>
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  ) : null;

  return (
    <>
      {/* Placeholder invisible para capturar posición inicial */}
      <div
        ref={placeholderRef}
        style={{ width: 160, height: 55, display: "inline-block" }}
      />
      {/* El botón real vive en un portal fuera del árbol DOM */}
      {createPortal(portalContent, document.body)}
    </>
  );
};

// ==================== LOCK SCREEN ====================
const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim().toLowerCase() === SECRET_PASSWORD) {
      onUnlock();
    } else {
      setError("Mmm, esa no es... intenta de nuevo");
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }
  };

  return (
    <div className="valentine-lock">
      <ParticlesBackground config={lockScreenConfig} id="lock-particles" />

      <motion.div
        className="valentine-lock-card"
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          x: shaking ? [0, -10, 10, -10, 10, -5, 5, 0] : 0,
        }}
        transition={{ duration: 0.6, x: { duration: 0.5 } }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}>
          <FontAwesomeIcon icon={faHeart} className="heart-icon" />
        </motion.div>

        <h1>Hey, encontraste algo secreto 🌹</h1>
        <p className="lock-subtitle">
          Ingresa el código secreto para continuar...
        </p>

        <form onSubmit={handleSubmit} className="valentine-lock-form">
          <div className="valentine-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="¿Cuál es la palabra mágica?"
              className="valentine-input"
              autoComplete="off"
              autoFocus
            />
            <button
              type="button"
              className="valentine-toggle-vis"
              onClick={() => setShowPassword(!showPassword)}>
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="valentine-error"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            className="valentine-unlock-btn"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}>
            ❤️ Abrir
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

// ==================== CONTENIDO PRINCIPAL ====================
const ValentineContent = () => {
  const [celebrated, setCelebrated] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  // Precargar primeras fotos
  useEffect(() => {
    photos.slice(0, 5).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Auto-rotate carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedPhoto((prev) => {
        const next = (prev + 1) % photos.length;
        const preload = new Image();
        preload.src = photos[(next + 2) % photos.length];
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleYes = useCallback(() => {
    setCelebrated(true);
    fireCelebration();
    setTimeout(() => setCelebrated(false), 6000);
  }, []);

  const getPhotoAnimation = (i: number) => {
    const anims = [
      {
        initial: { opacity: 0, scale: 0.5, rotate: -10 },
        whileInView: { opacity: 1, scale: 1, rotate: 0 },
      },
      { initial: { opacity: 0, x: -100 }, whileInView: { opacity: 1, x: 0 } },
      { initial: { opacity: 0, x: 100 }, whileInView: { opacity: 1, x: 0 } },
      { initial: { opacity: 0, y: 100 }, whileInView: { opacity: 1, y: 0 } },
      {
        initial: { opacity: 0, scale: 0.3 },
        whileInView: { opacity: 1, scale: 1 },
      },
      {
        initial: { opacity: 0, rotate: 15, y: 50 },
        whileInView: { opacity: 1, rotate: 0, y: 0 },
      },
    ];
    return anims[i % anims.length];
  };

  return (
    <div className="valentine-page">
      <ParticlesBackground config={heartsConfig} id="hearts-particles" />

      {/* Celebration overlay */}
      <AnimatePresence>
        {celebrated && (
          <motion.div
            className="celebration-message"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 10, stiffness: 100 }}>
            <h2>TE AMO BAE, Esposita, Piojin</h2>
            <div className="celebration-hearts">🌹 ❤️ 🌻 ❤️ 🌷</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxSrc && (
          <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
        )}
      </AnimatePresence>

      {/* ===== HERO ===== */}
      <section className="valentine-hero">
        <motion.div
          className="big-heart"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: [1, 1.15, 1], rotate: 0 }}
          transition={{
            scale: { duration: 1.5, repeat: Infinity, repeatDelay: 0.5 },
            rotate: { duration: 1, ease: "easeOut" },
          }}>
          ❤️
        </motion.div>

        <motion.h1
          className="valentine-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}>
          ¿Quieres ser
          <br />
          mi Valentine?
        </motion.h1>

        <motion.p
          className="valentine-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}>
          Cada momento contigo es mi momento favorito,{" "}
          <span className="valentine-name">Leslie Margarita</span>
        </motion.p>

        <div className="hero-flowers">
          {["🌹", "🌻", "🌷", "🌺", "🌸", "🌼"].map((flower, i) => (
            <motion.span
              key={i}
              className="hero-flower"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 1 + i * 0.15,
                type: "spring",
                stiffness: 200,
              }}>
              {flower}
            </motion.span>
          ))}
        </div>

        <motion.div
          className="scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}>
          <FontAwesomeIcon icon={faChevronDown} />
        </motion.div>
      </section>

      {/* ===== MENSAJE ===== */}
      <section className="valentine-message-section">
        <motion.div
          className="valentine-message-card"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}>
          <h2>🌹 Para ti, con todo mi corazón 🌹</h2>
          <p>
            Tú eres la chispa que enciende esos pequeños fuegos artificiales
            dentro de mí. Llegaste y todo cambió cada letra, cada frase, cada
            día tiene un propósito nuevo. Eres mi refugio, el lugar donde mi
            corazón encuentra descanso. Mi musa, mi inspiración constante, mi
            todo. Keep loving.
          </p>
          <div className="message-flowers">🌻 🌷 🌺 🌸 🌼 💐</div>
        </motion.div>
      </section>

      {/* ===== CARRUSEL ===== */}
      <section className="featured-photo-section">
        <motion.h2
          className="gallery-title"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}>
          🌻 Tú y Yo 🌻
        </motion.h2>
        <div className="featured-photo-wrapper">
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedPhoto}
              src={photos[selectedPhoto]}
              alt="Nosotros"
              className="featured-photo"
              initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotate: 3 }}
              transition={{ duration: 0.6 }}
              onClick={() => setLightboxSrc(photos[selectedPhoto])}
            />
          </AnimatePresence>
          <div className="featured-flowers-left">🌹🌷🌺</div>
          <div className="featured-flowers-right">🌻🌸🌼</div>
        </div>
        <div className="featured-dots">
          {photos.slice(0, 10).map((_, i) => (
            <button
              key={i}
              className={`featured-dot ${selectedPhoto % 10 === i ? "active" : ""}`}
              onClick={() => setSelectedPhoto(i)}
            />
          ))}
        </div>
      </section>

      {/* ===== GALERIA ===== */}
      <section className="valentine-gallery-section">
        <motion.h2
          className="gallery-title"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}>
          🌹 Nuestros Momentos 🌹
        </motion.h2>

        <div className="valentine-gallery">
          {photos.map((src, i) => {
            const anim = getPhotoAnimation(i);
            return (
              <motion.div
                key={i}
                className={`gallery-item gallery-item-${(i % 6) + 1}`}
                initial={anim.initial}
                whileInView={anim.whileInView}
                viewport={{ once: true, margin: "-30px" }}
                transition={{
                  delay: (i % 6) * 0.08,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  scale: 1.05,
                  zIndex: 10,
                  rotate: i % 2 === 0 ? 2 : -2,
                }}
                onClick={() => setLightboxSrc(src)}>
                <LazyImage src={src} alt={`Momento ${i + 1}`} />
                <div className="gallery-item-flower">
                  {flowerEmojis[i % flowerEmojis.length]}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ===== SI / NO ===== */}
      <section className="valentine-cta-section">
        <motion.h2
          className="cta-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}>
          Entonces... ¿Quieres ser mi Valentine? 🌹
        </motion.h2>

        <div className="cta-buttons">
          <motion.button
            className="valentine-yes-btn"
            onClick={handleYes}
            whileHover={{
              scale: 1.1,
              rotate: [0, -3, 3, -3, 0],
              boxShadow: "0 15px 40px rgba(244, 63, 94, 0.6)",
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}>
            ¡SÍ! ❤️ 🌹
          </motion.button>
          <RunawayNoButton />
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="valentine-footer">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}>
          <div className="footer-flowers">🌹 🌻 🌷 🌺 🌸 🌼 💐 🌹 🌻 🌷</div>
          <p>Hecho con ❤️ para Leslie Margarita Medina Vidal</p>
          <p className="footer-small">Feliz Día de San Valentín 2026</p>
        </motion.div>
      </footer>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
const Valentine = () => {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {!unlocked ? (
        <motion.div
          key="lock"
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5 }}>
          <LockScreen onUnlock={() => setUnlocked(true)} />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}>
          <ValentineContent />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Valentine;
