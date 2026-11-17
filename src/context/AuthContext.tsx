'use client'

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { useAuth as useAuthClerk } from '@clerk/nextjs'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { registrarObterToken } from '@/lib/sessao-clerk'
import { urlClerk } from '@/lib/auth/urls-clerk'
import { authFetch, ApiError } from '@/data/data'
import { extrairMensagemErro } from '@/lib/api-error'

const API_URL = process.env.NEXT_PUBLIC_API_URL

type TipoUsuario = 'admin' | 'organizador' | 'participante'

const ROLES_VALIDAS: readonly TipoUsuario[] = ['admin', 'organizador', 'participante']

/**
 * Perfil do USUÁRIO no banco da API (GET /api/auth/profile). Identidade é o
 * Clerk; papel (`tipoUsuario`) e status (`ativo`) são SEMPRE do banco — nunca
 * de metadados do Clerk nem de token (padrão fic_dev/padroes-servicos/clerk.md).
 */
export interface User {
   id: number
   nome: string
   email: string
   telefone: string | null
   cpf: string | null
   dataNascimento: string | null
   fotoPerfil: string | null
   tipoUsuario: TipoUsuario
   dataCadastro: string
   ultimoAcesso: string
}

interface AuthContextType {
   user: User | null
   userRole: TipoUsuario | null
   isAdmin: boolean
   isAuthenticated: boolean
   loading: boolean
   logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Fail-closed: papel fora do domínio conhecido (ou ausente) vira null.
const resolverUserRole = (tipoUsuario: string | null | undefined): TipoUsuario | null =>
   tipoUsuario && ROLES_VALIDAS.includes(tipoUsuario as TipoUsuario)
      ? (tipoUsuario as TipoUsuario)
      : null

export const AuthProvider = ({ children }: { children: ReactNode }) => {
   const [user, setUser] = useState<User | null>(null)
   const [loading, setLoading] = useState(true) // true até Clerk carregar + perfil resolver
   const router = useRouter()

   // isLoaded: Clerk terminou de ler a sessão (cookie). isSignedIn: há sessão.
   const { isLoaded, isSignedIn, getToken, signOut } = useAuthClerk()

   const userRole = useMemo(() => resolverUserRole(user?.tipoUsuario), [user])
   const isAuthenticated = isSignedIn === true && !!user && userRole !== null
   const isAdmin = userRole === 'admin'

   // Registra o getToken do Clerk para o authFetch obter o Bearer a cada request.
   useEffect(() => {
      registrarObterToken(() => (getToken ? getToken() : Promise.resolve(null)))
      return () => registrarObterToken(null)
   }, [getToken])

   // Busca o perfil no banco SEMPRE que a sessão do Clerk mudar. O papel vem
   // daqui (e o backend revalida a cada request): promover/desativar no banco
   // tem efeito no próximo carregamento da página.
   useEffect(() => {
      if (!isLoaded) return // espera o Clerk resolver a sessão
      if (!isSignedIn) {
         setUser(null)
         setLoading(false)
         return
      }

      let cancelado = false
      const carregarPerfil = async () => {
         setLoading(true)
         try {
            const res = await authFetch(
               `${API_URL}/api/auth/profile`,
               {},
               { autenticado: true, redirecionar401: false },
            )
            const { user: perfil } = (await res.json()) as { user: User | null }
            if (cancelado) return
            setUser(perfil)
         } catch (error) {
            if (cancelado) return
            if (error instanceof ApiError && error.status === 403) {
               // Conta desativada ou não vinculada (ex.: e-mail diferente do
               // convite): encerra a sessão e explica. Identidade ≠ autorização.
               setUser(null)
               toast.error(extrairMensagemErro(null, 'Esta conta não tem acesso. Fale com a administração.'))
               await signOut()
               router.push(urlClerk('/sem-acesso'))
            } else if (error instanceof ApiError && error.status === 401) {
               // Sessão do Clerk válida mas token recusado pela API (ex.: chaves
               // de instâncias diferentes, API antiga no ar): não insiste.
               setUser(null)
               await signOut()
            } else {
               // Erro de rede/500: segue deslogado; toast para o usuário tentar de novo.
               setUser(null)
               toast.error('Não foi possível carregar seu perfil. Tente recarregar a página.')
            }
         } finally {
            if (!cancelado) setLoading(false)
         }
      }

      void carregarPerfil()
      return () => {
         cancelado = true
      }
      // signOut/router são estáveis nos hooks do Clerk/Next; getToken muda,
      // mas não invalida o perfil (a sessão não muda por causa do token).
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isLoaded, isSignedIn])

   const logout = async () => {
      try {
         await signOut({ redirectUrl: urlClerk('/') })
         // O signOut do Clerk já navega; o toast confirma.
         toast.info('Você foi desconectado.')
      } catch (error) {
         console.error('Erro ao sair:', error)
         toast.error('Não foi possível sair. Tente novamente.')
      }
   }

   return (
      <AuthContext.Provider value={{ user, userRole, isAdmin, isAuthenticated, loading, logout: () => void logout() }}>
         {children}
      </AuthContext.Provider>
   )
}

export const useAuth = () => {
   const context = useContext(AuthContext)
   if (context === undefined) {
      throw new Error('useAuth deve ser usado dentro de um AuthProvider')
   }
   return context
}
