import type { ReactNode } from 'react'
import { MapPin } from 'lucide-react'
import Link from 'next/link'
import { RedirecionarAutenticado } from '@/components/auth/RedirecionarAutenticado'

/**
 * Moldura das páginas de autenticação do Clerk (`/sign-in`, `/sign-up`):
 * o componente do Clerk (`RootBox`) tem `width: fit-content` e NÃO se
 * centraliza sozinho — fica colado no canto. O shell centraliza o cartão na
 * viewport (`min-h-dvh` cobre o chrome do navegador mobile; `min-height`
 * permite rolar quando o cadastro é mais alto que a tela) e apresenta a
 * marca do Conecte-se.
 */
export function AuthShell({ children }: { children: ReactNode }) {
   return (
      <main className="bg-muted/30 flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
         {/* Sessão ativa numa página de auth = redireciona (rescue do redirect
             quebrado do Clerk/Next sob basePath; preserve o ?next=). */}
         <RedirecionarAutenticado />
         <div className="flex flex-col items-center gap-3 text-center">
            <div className="bg-primary grid size-12 place-items-center rounded-xl">
               <MapPin className="text-primary-foreground size-7" aria-hidden="true" />
            </div>
            <div>
               <p className="text-primary text-2xl font-bold">CONECTE-SE</p>
               <p className="text-muted-foreground text-xs">
                  SECITECI — Secretaria de Estado de Ciência, Tecnologia e Inovação
               </p>
            </div>
         </div>

         {children}

         <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
         >
            Voltar ao site
         </Link>
      </main>
   )
}
