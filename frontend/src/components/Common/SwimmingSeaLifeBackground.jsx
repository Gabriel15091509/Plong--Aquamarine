import React from "react";
import { motion, useReducedMotion } from "framer-motion";

// Décor de fond pour LoginPage.jsx (derrière la carte de connexion) : une
// petite faune marine en silhouette (poissons, méduses, tortue) qui anime
// l'arrière-plan — plusieurs espèces plutôt qu'un seul motif répété, pour
// varier les silhouettes et les mouvements (nage horizontale à queue qui
// ondule pour poisson/tortue, dérive verticale + ombrelle qui pulse pour
// méduse) sans jamais devenir un défilé cartoonesque : tons discrets de la
// palette primary/ocean/cyan déjà utilisée ailleurs, opacité basse, tailles
// posées pour rester un décor, pas le sujet de la page.
const CREATURES = [
  { type: "fish", top: "8%", size: 56, duration: 27, delay: 0, direction: 1, color: "text-primary-300/40 dark:text-primary-400/18" },
  { type: "jellyfish", left: "12%", size: 46, duration: 16, delay: 1, color: "text-ocean-300/35 dark:text-ocean-400/16" },
  { type: "fish", top: "66%", size: 40, duration: 34, delay: 5, direction: -1, color: "text-ocean-300/35 dark:text-ocean-400/16" },
  { type: "turtle", top: "40%", size: 60, duration: 40, delay: 10, direction: 1, color: "text-cyan-300/35 dark:text-cyan-400/16" },
  { type: "fish", top: "30%", size: 30, duration: 23, delay: 8, direction: 1, color: "text-cyan-300/30 dark:text-cyan-400/14" },
  { type: "jellyfish", left: "82%", size: 34, duration: 19, delay: 6, color: "text-primary-300/30 dark:text-primary-400/14" },
  { type: "fish", top: "84%", size: 42, duration: 31, delay: 3, direction: 1, color: "text-primary-300/30 dark:text-primary-400/14" },
  { type: "fish", top: "52%", size: 32, duration: 25, delay: 16, direction: -1, color: "text-ocean-300/40 dark:text-ocean-400/18" },
];

// --- Silhouettes -----------------------------------------------------------
// `fill="currentColor"` partout : la couleur vient de la classe Tailwind
// `text-*` posée sur le conteneur (voir CREATURES), jamais redéfinie ici.

const FishSilhouette = ({ className, style, animate }) => (
  <svg viewBox="-14 -10 78 42" className={className} style={style} aria-hidden="true">
    <motion.path
      d="M -10 16 L 8 7 L 3 16 L 8 25 Z"
      fill="currentColor"
      style={{ transformOrigin: "8px 16px" }}
      animate={animate ? { rotate: [-12, 12, -12] } : undefined}
      transition={animate ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : undefined}
    />
    <path
      d="M8 16 C8 5 21 -1 35 -1 C49 -1 59 7 63 16 C59 25 49 33 35 33 C21 33 8 27 8 16 Z"
      fill="currentColor"
    />
    <path d="M27 0 L34 -10 L41 0 Z" fill="currentColor" opacity="0.8" />
    <circle cx="47" cy="12" r="2.8" fill="white" fillOpacity="0.9" />
    <circle cx="48" cy="12" r="1.3" fill="#0f172a" />
  </svg>
);

const JELLYFISH_TENTACLES = [10, 19, 28, 37, 46];

const JellyfishSilhouette = ({ className, style, animate }) => (
  <svg viewBox="-4 -4 64 74" className={className} style={style} aria-hidden="true">
    {/* Ombrelle : pulse doucement (scaleY), origine en bas pour que le
        mouvement se lise comme une contraction/relâchement plutôt qu'un
        étirement vers le haut. */}
    <motion.path
      d="M4 28 C4 8 52 8 52 28 C52 35 44 37 28 37 C12 37 4 35 4 28 Z"
      fill="currentColor"
      style={{ transformOrigin: "28px 37px" }}
      animate={animate ? { scaleY: [1, 0.82, 1] } : undefined}
      transition={animate ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : undefined}
    />
    {JELLYFISH_TENTACLES.map((x, idx) => (
      <motion.path
        key={x}
        d={`M${x} 35 Q ${x - 5} 50 ${x} 66`}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        style={{ transformOrigin: `${x}px 35px` }}
        animate={animate ? { rotate: [-9, 9, -9] } : undefined}
        transition={
          animate
            ? { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: idx * 0.18 }
            : undefined
        }
      />
    ))}
  </svg>
);

const TurtleSilhouette = ({ className, style, animate }) => (
  <svg viewBox="-6 -14 78 56" className={className} style={style} aria-hidden="true">
    {/* Nageoire arrière */}
    <motion.path
      d="M10 30 C2 32 -4 38 -2 44 C4 42 10 37 14 32 Z"
      fill="currentColor"
      opacity="0.85"
      style={{ transformOrigin: "12px 32px" }}
      animate={animate ? { rotate: [-8, 8, -8] } : undefined}
      transition={animate ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
    />
    {/* Carapace */}
    <path
      d="M4 16 C4 0 22 -8 38 -6 C54 -4 64 6 62 16 C64 26 54 36 38 38 C22 40 4 32 4 16 Z"
      fill="currentColor"
    />
    {/* Motif de la carapace (traits discrets, plus clairs) */}
    <path
      d="M18 -3 C22 8 22 24 18 35 M34 -6 C36 8 36 24 34 38 M48 -3 C50 8 50 24 48 35"
      stroke="white"
      strokeOpacity="0.25"
      strokeWidth="1.6"
      fill="none"
    />
    {/* Nageoire avant */}
    <motion.path
      d="M56 6 C64 2 70 -4 68 -10 C62 -8 55 -2 52 4 Z"
      fill="currentColor"
      opacity="0.85"
      style={{ transformOrigin: "56px 4px" }}
      animate={animate ? { rotate: [10, -10, 10] } : undefined}
      transition={animate ? { duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.1 } : undefined}
    />
    {/* Tête */}
    <ellipse cx="68" cy="14" rx="8" ry="6" fill="currentColor" />
    <circle cx="72" cy="12" r="1.4" fill="#0f172a" />
  </svg>
);

const SILHOUETTES = {
  fish: FishSilhouette,
  jellyfish: JellyfishSilhouette,
  turtle: TurtleSilhouette,
};

// --- Mouvements --------------------------------------------------------
// Poisson/tortue : traversent l'écran horizontalement (nage), tête dans le
// sens de la marche — voir `direction`. Méduse : dérive verticalement
// (remonte lentement puis redescend, comme une vraie pulsation dans la
// colonne d'eau) avec un léger balancement latéral, position horizontale
// fixe (voir `left`).
const Swimmer = ({ creature }) => {
  const Silhouette = SILHOUETTES[creature.type];
  const facingRight = creature.direction !== -1;
  const flip = facingRight ? undefined : "scaleX(-1)";

  if (creature.type === "jellyfish") {
    return (
      <motion.div
        className="absolute"
        style={{ left: creature.left, width: creature.size }}
        initial={{ y: "115vh" }}
        animate={{ y: ["115vh", "-25vh"] }}
        transition={{
          duration: creature.duration,
          delay: creature.delay,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
        }}
      >
        <motion.div
          animate={{ x: [0, 14, -14, 0] }}
          transition={{ duration: creature.duration / 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Silhouette className={creature.color} animate />
        </motion.div>
      </motion.div>
    );
  }

  // Marge de 15vw de part et d'autre : la créature entre/sort
  // progressivement du cadre plutôt que d'apparaître/disparaître pile au
  // bord.
  const startX = facingRight ? "-15vw" : "115vw";
  const endX = facingRight ? "115vw" : "-15vw";

  return (
    <motion.div
      className="absolute"
      style={{ top: creature.top, width: creature.size }}
      initial={{ x: startX }}
      animate={{ x: [startX, endX] }}
      transition={{
        duration: creature.duration,
        delay: creature.delay,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
      }}
    >
      <motion.div
        animate={{ y: [0, -6, 0, 6, 0] }}
        transition={{ duration: creature.duration / 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <Silhouette className={creature.color} style={{ transform: flip }} animate />
      </motion.div>
    </motion.div>
  );
};

const SwimmingSeaLifeBackground = () => {
  // prefers-reduced-motion : la faune reste visible (choix esthétique du
  // décor, pas une information) mais figée à une position fixe en
  // périphérie, sans traversée ni pulsation/battement.
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {CREATURES.map((creature, i) => {
        if (prefersReducedMotion) {
          const Silhouette = SILHOUETTES[creature.type];
          const facingRight = creature.direction !== -1;
          const isJellyfish = creature.type === "jellyfish";
          return (
            <Silhouette
              key={i}
              className={creature.color}
              style={{
                position: "absolute",
                top: isJellyfish ? "40%" : creature.top,
                left: isJellyfish ? creature.left : facingRight ? "6%" : "88%",
                width: creature.size,
                transform: !isJellyfish && !facingRight ? "scaleX(-1)" : undefined,
              }}
              animate={false}
            />
          );
        }
        return <Swimmer key={i} creature={creature} />;
      })}
    </div>
  );
};

export default SwimmingSeaLifeBackground;
