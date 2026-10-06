import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { Query } from '@tanstack/react-query'
import QueryProvider from '@/components/QueryProvider'

const geistSans = Geist({
   variable: '--font-geist-sans',
   subsets: ['latin'],
})

export const metadata: Metadata = {
   title: 'Conecte-se MT',
   description: 'Conecte-se MT',
}

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode
}>) {
   return (
      <html lang="en">
         <body className={`${geistSans.variable} font-sans antialiased`}>
            <AuthProvider>
               <QueryProvider>{children}</QueryProvider>
            </AuthProvider>
         </body>
      </html>
   )
}
