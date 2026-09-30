import type { Metadata } from "next";
import "./globals.css";
import "./brand.css";

export const metadata: Metadata = {
  title: "Purrfect Hire",
  description: "Evidence-based recruiting scorecards for technical hiring.",
  icons: {
    icon: "/purrfecthire-logo.png",
    apple: "/purrfecthire-logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
