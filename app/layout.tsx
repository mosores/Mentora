import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"]
});

const baseUrl = process.env.APP_URL || "https://mentora.app";

export const metadata: Metadata = {
  title: {
    default: "Mentora | Tu Tutor IA para Estudiar Mejor",
    template: "%s | Mentora"
  },
  description: "Mentora es una plataforma de estudio con IA para estudiantes universitarios en LATAM. Sube tus PDFs, apuntes y videos. Obtén resúmenes, flashcards, quizzes y respuestas de tu Tutor IA con fuentes.",
  keywords: ["IA tutor", "estudio", "universidad", "LATAM", "Perú", "flashcards", "quiz", "resúmenes", "aprendizaje"],
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: baseUrl,
    languages: {
      "es": `${baseUrl}/es`,
      "en": `${baseUrl}/en`
    }
  },
  openGraph: {
    title: "Mentora | Tu Tutor IA para Estudiar Mejor",
    description: "Sube tus materiales de clase y obtén un tutor IA que cita tus propias fuentes. Resúmenes, flashcards, quizzes y más.",
    url: baseUrl,
    siteName: "Mentora",
    type: "website",
    locale: "es_PE",
    alternateLocale: ["en_US"],
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Mentora — Aprende más rápido con IA"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentora | Tu Tutor IA para Estudiar Mejor",
    description: "Sube tus materiales de clase y obtén un tutor IA que cita tus propias fuentes.",
    images: [`${baseUrl}/og-image.png`]
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} dark`}>
      <head>
        <meta name="theme-color" content="#030712" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
