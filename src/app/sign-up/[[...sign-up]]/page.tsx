import type { Metadata } from 'next'
import { SignUp } from '@clerk/nextjs'
import { urlsClerk } from '@/lib/auth/urls-clerk'

export const metadata: Metadata = {
   title: 'Criar conta · Conecte-se MT',
}

/**
 * Cadastro pelo Clerk, em rota POR CAMINHO com página catch-all (padrão
 * fic_dev/padroes-servicos/clerk.md). SIGN-UP PÚBLICO (divergência consciente
 * do "Invite-only"): o participante se cadastra sozinho e o backend cria a
 * conta como `participante` (webhook/fallback); admin/organizador são
 * provisionados por e-mail no banco e se ligam pelo mesmo e-mail. Os passos
 * seguintes (sso-callback, verificação de e-mail, aceite de convite com
 * `__clerk_ticket`) moram em `/sign-up/…` e chegam SEM o ticket — por isso a
 * página é catch-all e sempre aberta.
 */
export default function SignUpPage() {
   return <SignUp routing="path" path={urlsClerk().cadastro} signInUrl={urlsClerk().entrar} forceRedirectUrl={urlsClerk().home} />
}
