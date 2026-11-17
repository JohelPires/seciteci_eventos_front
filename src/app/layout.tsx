import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { urlsClerk } from '@/lib/auth/urls-clerk'
import { LOCALIZACAO_CLERK } from '@/lib/auth/localizacao-clerk'
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
   // Login pelo Clerk (padrão fic_dev/padroes-servicos/clerk.md). TODO
   // endereço entregue ao Clerk leva o CAMINHO BASE (urlsClerk) — na volta do
   // login social o SDK monta o endereço completo sem o roteador do Next.
   return (
      <html lang="pt-BR">
         <body className={`${geistSans.variable} font-sans antialiased`}>
            <ClerkProvider
               localization={LOCALIZACAO_CLERK}
               signInUrl={urlsClerk().entrar}
               signUpUrl={urlsClerk().cadastro}
               signInFallbackRedirectUrl={urlsClerk().home}
               signUpFallbackRedirectUrl={urlsClerk().home}
               afterSignOutUrl={urlsClerk().home}
            >
               <AuthProvider>
                  <QueryProvider>{children}</QueryProvider>
               </AuthProvider>
            </ClerkProvider>
         </body>
      </html>
   )
}
