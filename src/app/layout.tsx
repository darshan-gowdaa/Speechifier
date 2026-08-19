import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

// Roboto is the fallback for Google Sans on non-Android devices.
// Google Sans is pre-installed on all Android phones.
const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Echo — Document Reader",
  description: "Upload a PDF, DOCX, or TXT and have it read aloud. Runs entirely in your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} font-sans antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
