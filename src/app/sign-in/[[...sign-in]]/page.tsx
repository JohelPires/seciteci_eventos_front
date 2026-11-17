import type { Metadata } from 'next'
import { SignIn } from '@clerk/nextjs'
import { urlsClerk } from '@/lib/auth/urls-clerk'

export const metadata: Metadata = {
   title: 'Entrar · Conecte-se MT',
}

/**
 * Login pelo Clerk, em rota POR CAMINHO com página catch-all (padrão
 * fic_dev/padroes-servicos/clerk.md): na rota por hash, a volta do Google
 * empilhava um `#` dentro do outro e o login girava sem fim. O `path` leva o
 * caminho base porque o Clerk o compara com a URL do navegador.
 * O cadastro público de participante fica em /sign-up.
 */
export default function SignInPage() {
   return <SignIn routing="path" path={urlsClerk().entrar} signUpUrl={urlsClerk().cadastro} forceRedirectUrl={urlsClerk().home} />
}
