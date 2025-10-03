import { motion } from "framer-motion";

export const TypingAnimation = () => {
  return (
    <div className="flex items-center gap-1">
      <motion.div
        className="size-2 rounded-full bg-muted-foreground"
        animate={{ y: [0, -4, 0] }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0,
        }}
      />
      <motion.div
        className="size-2 rounded-full bg-muted-foreground"
        animate={{ y: [0, -4, 0] }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.15,
        }}
      />
      <motion.div
        className="size-2 rounded-full bg-muted-foreground"
        animate={{ y: [0, -4, 0] }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />
    </div>
  );
};
