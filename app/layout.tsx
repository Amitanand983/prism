import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "PRISM (PR Intelligence System Mechanism)",
  description: "AI-assisted PR intelligence system for GitHub pull request review",
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
