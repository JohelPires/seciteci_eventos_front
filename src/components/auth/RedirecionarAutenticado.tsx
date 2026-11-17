'use client'

import { useEffect } from 'react'
import { useAuth, useSession } from '@clerk/nextjs'
import { comBase } from '@/lib/caminho-base'

/**
 * Guard de redirect pós-login. O Clerk, ao sair de /sign-in, navega pelo
 * roteador do Next com uma URL ABSOLUTA; o adapter @clerk/nextjs não tira o
 * basePath e o Next monta uma URL inválida (reproduzido: pedido para
 * `https://hosthttps//…`) — a navegação quebra e a pessoa fica presa na página
 * de auth com o cartão vazio (ex.: /sign-in/factor-one após o código do
 * e-mail). Este componente observa a SESSÃO e, quando ela fica ativa em uma
 * página de auth, faz `window.location.replace` (carga completa, fora do
 * roteador quebrado) para o destino.
 *
 * Destino: parâmetro `?next=` (só caminho LOCAL — evita redirect externo), com
 * fallback para uma cópia no sessionStorage: o Clerk DESCARTA a query ao
 * navegar internamente para /sign-in/factor-one, então a cópia preserva o
 * `next` até o fim do login (expira em 10 min para não perseguir sessões
 * abandonadas).
 *
 * O redirect acontece UMA VEZ POR SESSÃO do Clerk (id marcado no
 * sessionStorage): /admin e /meus-eventos devolvem para /sign-in?next=… quando
 * o perfil não carrega (API fora do ar) — sem essa marca, o guard devolveria
 * de novo e a página entraria em pingue-pongue. Novo login = nova sessão =
 * redirect de novo.
 */

const CHAVE_NEXT = 'conectese.auth.next'
const CHAVE_SESSAO = 'conectese.auth.redirectFeitoNaSessao'
const VALIDADE_MS = 10 * 60 * 1000

/** `next` só vale se for caminho local do app (`/admin` ok, `//malicioso` não). */
const nextSeguro = (valor: unknown): string | null =>
   typeof valor === 'string' &&
   valor.startsWith('/') &&
   !valor.startsWith('//') &&
   !valor.startsWith('/\\')
      ? valor
      : null

const nextDaUrl = (): string | null =>
   nextSeguro(new URLSearchParams(window.location.search).get('next'))

const nextGuardado = (): string | null => {
   try {
      const bruto = sessionStorage.getItem(CHAVE_NEXT)
      if (!bruto) return null
      const { valor, t } = JSON.parse(bruto) as { valor: unknown; t: unknown }
      if (typeof t !== 'number' || Date.now() - t > VALIDADE_MS) return null
      return nextSeguro(valor)
   } catch {
      return null
   }
}

const sessaoConsumida = (sessionId: string): boolean => {
   try {
      return sessionStorage.getItem(CHAVE_SESSAO) === sessionId
   } catch {
      return false
   }
}

const guardar = (chave: string, valor: string) => {
   try {
      sessionStorage.setItem(chave, valor)
   } catch {
      // sessionStorage indisponível: segue sem a cópia
   }
}

const limpar = (chave: string) => {
   try {
      sessionStorage.removeItem(chave)
   } catch {
      // ignora
   }
}

export function RedirecionarAutenticado() {
   const { isLoaded, isSignedIn } = useAuth()
   const { session } = useSession()

   // Guarda o `next` da URL na entrada (a etapa /factor-one perde a query).
   useEffect(() => {
      const next = nextDaUrl()
      if (next) guardar(CHAVE_NEXT, JSON.stringify({ valor: next, t: Date.now() }))
   }, [])

   // Sessão acabou (logout/403 do perfil): libera o guard para o próximo login.
   useEffect(() => {
      if (isLoaded && !isSignedIn) {
         limpar(CHAVE_SESSAO)
      }
   }, [isLoaded, isSignedIn])

   useEffect(() => {
      if (!isLoaded || !isSignedIn || !session?.id) return
      if (sessaoConsumida(session.id)) return
      const destino = nextDaUrl() ?? nextGuardado() ?? '/'
      guardar(CHAVE_SESSAO, session.id)
      limpar(CHAVE_NEXT)
      window.location.replace(comBase(destino))
   }, [isLoaded, isSignedIn, session])

   return null
}
