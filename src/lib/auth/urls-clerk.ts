import { comBase } from '@/lib/caminho-base'

/**
 * Endereços de login/cadastro entregues ao Clerk (padrão
 * fic_dev/padroes-servicos/clerk.md, seção "Painel em Next atrás de um caminho"):
 * TODO endereço que o Clerk usa leva o CAMINHO BASE — o SDK tira a base antes
 * de navegar pelo roteador do Next, mas na volta do login social ele monta o
 * endereço completo sem o roteador; sem a base, a pessoa voltava para a raiz
 * do domínio, fora do painel, e o login girava sem fim.
 */
export const urlsClerk = () => ({
   entrar: comBase('/sign-in'),
   cadastro: comBase('/sign-up'),
   home: comBase('/'),
})

/** `urlClerk('/meus-eventos')` → destino de redirect com o caminho base. */
export const urlClerk = (caminho: string): string => comBase(caminho)
