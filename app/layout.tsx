import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "PR Intelligence Layer",
  description: "AI-assisted risk briefing for GitHub pull requests",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
