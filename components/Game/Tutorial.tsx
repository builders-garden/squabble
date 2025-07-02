import { AnimatePresence, motion } from "framer-motion";
import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import { useEffect, useState } from "react";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

const tutorialSteps = [
  {
    title: "Place Letters",
    description:
      "Drag or click letters from your rack to place them on the board",
    animation: (
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-[#FFFDEB] border-2 border-[#E6E6E6] rounded-md uppercase flex items-center justify-center text-2xl font-bold text-[#B5A16E] shadow">
          S
        </div>
        <motion.div
          animate={{
            y: [-20, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="w-6 h-6 text-white"
        >
          ↓
        </motion.div>
        <div className="w-10 h-10 bg-[#1A6B5A]/20 border-2 border-[#1A6B5A] rounded-md" />
      </div>
    ),
  },
  {
    title: "Form Words",
    description: "Place letters horizontally or vertically to form valid words",
    animation: (
      <div className="flex gap-1">
        {["W", "O", "R", "D"].map((letter, i) => (
          <motion.div
            key={letter}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.2 }}
            className="w-10 h-10 bg-[#FFFDEB] border-2 border-[#E6E6E6] rounded-md uppercase flex items-center justify-center text-2xl font-bold text-[#B5A16E] shadow"
          >
            {letter}
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    title: "Submit & Score",
    description: "Submit your word to score points. Longer words score more!",
    animation: (
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1">
          {["W", "O", "R", "D"].map((letter) => (
            <motion.div
              key={letter}
              animate={{
                backgroundColor: ["#FFFDEB", "#fef08a", "#FFFDEB"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              className="w-10 h-10 border-2 border-[#E6E6E6] rounded-md uppercase flex items-center justify-center text-2xl font-bold text-[#B5A16E] shadow"
            >
              {letter}
            </motion.div>
          ))}
        </div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
          className="text-yellow-400 font-bold text-xl"
        >
          +10
        </motion.div>
      </div>
    ),
  },
];

export default function Tutorial() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % tutorialSteps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#1B7A6E] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 max-w-sm">
        <div className="flex flex-row items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="Squabble Logo"
            className="w-[36px] mb-1"
            width={36}
            height={36}
          />
          <div
            className={`${luckiestGuy.className} text-xl text-white tracking-wider`}
          >
            SQUABBLE
          </div>
        </div>

        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <div className="text-white font-medium text-xl">
              {tutorialSteps[currentStep].title}
            </div>
            <div className="h-32 flex items-center justify-center">
              {tutorialSteps[currentStep].animation}
            </div>
            <div className="text-white/75 text-sm">
              {tutorialSteps[currentStep].description}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 mt-4">
          {tutorialSteps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === currentStep ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
