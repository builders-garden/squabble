import Providers from "@/components/providers";
import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const rubik = Rubik({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Squabble",
  description: "Outspell your friends, in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${rubik.className} bg-[#1B7A6E]`}>
        <Providers>{children}</Providers>
        <Toaster richColors/>
      </body>
    </html>
  );
}
