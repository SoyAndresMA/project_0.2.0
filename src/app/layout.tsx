import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

// PrimeReact imports
import "primereact/resources/themes/lara-dark-blue/theme.css"
import "primereact/resources/primereact.min.css"
import "primeicons/primeicons.css"

import { PrimeReactProvider } from 'primereact/api'

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Miras - Media Management System",
  description: "Media management and playout control system",
  icons: {
    icon: '/miras-app-icon-bold.svg',
    apple: '/miras-app-icon-bold.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <PrimeReactProvider>
          {children}
        </PrimeReactProvider>
      </body>
    </html>
  )
}
