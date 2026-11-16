'use client'

import { useEffect, useRef, useState } from 'react'
import {
   GOOGLE_CLIENT_ID,
   carregarGoogleIdentity,
   googleLoginConfigured,
} from '@/lib/google-identity'

type Status = 'carregando' | 'pronto' | 'erro'

interface GoogleSignInButtonProps {
   /** Recebe o ID token (credential) do Google assim que o usuário consentir. */
   onCredential: (idToken: string) => void | Promise<void>
   /** Bloqueia o botão durante a troca do token com a API (overlay). */
   disabled?: boolean
}

// Limites oficiais do renderButton (200–400px). A largura é quantizada para
// evitar re-render do iframe a cada pixel do ResizeObserver.
const LARGURA_MIN = 200
const LARGURA_MAX = 400
const PASSO_LARGURA = 8

/**
 * Botão OFICIAL "Continuar com o Google" (Google Identity Services, via
 * iframe): segue as diretrizes de marca e entrega o ID token sem redirect.
 * Sem Client ID no build, o componente não renderiza nada.
 */
export function GoogleSignInButton({ onCredential, disabled = false }: GoogleSignInButtonProps) {
   const [status, setStatus] = useState<Status>('carregando')
   const [largura, setLargura] = useState<number | null>(null)

   const wrapperRef = useRef<HTMLDivElement>(null)
   const containerRef = useRef<HTMLDivElement>(null)
   const inicializadoRef = useRef(false)

   // O callback do initialize é registrado UMA vez: o ref mantém a versão
   // mais recente de onCredential sem re-registrar o GIS.
   const onCredentialRef = useRef(onCredential)
   useEffect(() => {
      onCredentialRef.current = onCredential
   }, [onCredential])

   // Carrega o script do GIS quando o botão entra na tela.
   useEffect(() => {
      if (!googleLoginConfigured()) return
      let cancelado = false
      carregarGoogleIdentity()
         .then(() => {
            if (!cancelado) setStatus('pronto')
         })
         .catch(() => {
            if (!cancelado) setStatus('erro')
         })
      return () => {
         cancelado = true
      }
   }, [])

   // Mede a largura disponível para o iframe do Google.
   useEffect(() => {
      const wrapper = wrapperRef.current
      if (!wrapper || !googleLoginConfigured()) return

      const medir = (larguraBruta: number) => {
         const medida = Math.max(LARGURA_MIN, Math.min(LARGURA_MAX, Math.floor(larguraBruta)))
         setLargura((atual) => (atual === null || Math.abs(atual - medida) >= PASSO_LARGURA ? medida : atual))
      }

      medir(wrapper.clientWidth)
      const observador = new ResizeObserver((entradas) => {
         const entrada = entradas[0]
         if (entrada) medir(entrada.contentRect.width)
      })
      observador.observe(wrapper)
      return () => observador.disconnect()
   }, [])

   // Inicializa (uma vez) e renderiza o botão oficial quando script e largura
   // estão prontos.
   useEffect(() => {
      const container = containerRef.current
      const google = typeof window !== 'undefined' ? window.google : undefined
      if (status !== 'pronto' || !container || !google || largura === null) return

      if (!inicializadoRef.current) {
         google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (resposta) => {
               void onCredentialRef.current(resposta.credential)
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            locale: 'pt-BR',
         })
         inicializadoRef.current = true
      }

      container.innerHTML = ''
      google.accounts.id.renderButton(container, {
         type: 'standard',
         theme: 'outline',
         size: 'large',
         text: 'continue_with',
         shape: 'rectangular',
         logo_alignment: 'left',
         width: largura,
         locale: 'pt-BR',
      })
   }, [status, largura])

   if (!googleLoginConfigured()) return null

   return (
      <div ref={wrapperRef} className="relative">
         {status === 'carregando' && (
            <>
               <div className="mx-auto h-10 w-full max-w-[400px] animate-pulse rounded-md bg-primary/10" aria-hidden="true" />
               <p className="sr-only" role="status">
                  Carregando o login do Google…
               </p>
            </>
         )}

         {status === 'pronto' && <div ref={containerRef} className="flex justify-center" />}

         {status === 'erro' && (
            <p className="text-muted-foreground text-sm" role="status">
               Não foi possível carregar o login do Google. Use o e-mail abaixo.
            </p>
         )}

         {disabled && (
            <div
               className="absolute inset-0 grid place-items-center rounded-md bg-background/70"
               aria-busy="true"
               aria-live="polite"
            >
               <span className="text-muted-foreground text-sm">Conectando…</span>
            </div>
         )}
      </div>
   )
}
