import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Slotify — Online booking for salons & service businesses",
  description:
    "Public booking page, smart calendar, and automatic reminders for hair salons, barbershops, and service businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${jakarta.variable} min-h-screen font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
