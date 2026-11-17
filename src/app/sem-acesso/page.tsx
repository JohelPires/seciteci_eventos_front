import type { Metadata } from 'next'
import { ShieldOff } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
   title: 'Sem acesso · Conecte-se MT',
}

/**
 * Conta SEM acesso: a identidade (Clerk) é válida, mas a autorização (banco da
 * API) nega — conta desativada, e-mail diferente do convite ou instância do
 * Clerk trocada. Quem decide o acesso é o banco (padrão
 * fic_dev/padroes-servicos/clerk.md); esta página só explica.
 */
export default function SemAcessoPage() {
   return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
         <Card className="w-full max-w-md text-center">
            <CardHeader>
               <div className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-destructive/10">
                  <ShieldOff className="size-6 text-destructive" aria-hidden="true" />
               </div>
               <CardTitle className="text-xl">Esta conta não tem acesso</CardTitle>
               <CardDescription>
                  O seu login foi feito, mas a conta não está habilitada no Conecte-se. Pode ser uma conta
                  desativada pela administração ou um e-mail diferente do cadastrado. Fale com a SECITECI
                  para regularizar o acesso.
               </CardDescription>
            </CardHeader>
            <CardContent>
               <Button asChild variant="outline">
                  <Link href="/">Voltar ao início</Link>
               </Button>
            </CardContent>
         </Card>
      </main>
   )
}
