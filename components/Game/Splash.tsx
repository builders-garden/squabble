"use client";

import { motion } from "motion/react";
import { Luckiest_Guy } from "next/font/google";
import Image from "next/image";
import { useEffect } from "react";
import { useSignIn } from "@/hooks/use-sign-in";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
});

export default function Splash() {
  const { isSignedIn, signIn } = useSignIn({});

  useEffect(() => {
    if (!isSignedIn) {
      const timer = setTimeout(() => {
        signIn();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isSignedIn, signIn]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-[#1B7A6E] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-row items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="Squabble Logo"
            className="w-[36px] mb-1"
            width={36}
            height={36}
          />
          <div
            className={`${luckiestGuy.className} text-xl text-white tracking-wider`}>
            SQUABBLE
          </div>
        </div>
      </div>
    </motion.div>
  );
}
