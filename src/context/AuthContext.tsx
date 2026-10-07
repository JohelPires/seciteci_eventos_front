'use client'

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { isTokenValid, obterClaims } from '@/lib/jwt'
import { extrairMensagemErro } from '@/lib/api-error'

const API_URL = process.env.NEXT_PUBLIC_API_URL

type TipoUsuario = 'admin' | 'organizador' | 'participante'

const ROLES_VALIDAS: readonly TipoUsuario[] = ['admin', 'organizador', 'participante']

interface User {
   id: number
   nome: string
   email: string
   telefone: string | null
   cpf: string | null
   dataNascimento: string | null
   fotoPerfil: string | null
   // Somente perfil/exibição: a permissão REAL vem do claim `tipo` do JWT (userRole no contexto)
   tipoUsuario: TipoUsuario
   dataCadastro: string
   ultimoAcesso: string
}

interface AuthContextType {
   user: User | null
   token: string | null
   userRole: TipoUsuario | null
   isAdmin: boolean
   tokenId: number | null
   isAuthenticated: boolean
   loading: boolean
   login: (email: string, senha: string) => Promise<void>
   register: (nome: string, email: string, senha: string, userType: 'client' | 'professional') => Promise<void>
   logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const getStoredAuthData = () => {
   if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('authToken')
      const storedUserJson = localStorage.getItem('authUser')
      let user: User | null = null
      try {
         user = storedUserJson ? (JSON.parse(storedUserJson) as User) : null
      } catch {
         user = null
      }
      return { token: storedToken, user }
   }
   return { token: null, user: null }
}

// Fonte de verdade da role: claim `tipo` do JWT. Valor fora do domínio
// conhecido (ou token sem claim) vira null — fail-closed.
const resolverUserRole = (token: string | null): TipoUsuario | null => {
   const claims = token ? obterClaims(token) : null
   return claims && ROLES_VALIDAS.includes(claims.tipo as TipoUsuario)
      ? (claims.tipo as TipoUsuario)
      : null
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
   const [user, setUser] = useState<User | null>(null)
   const [token, setToken] = useState<string | null>(null)
   const [userRole, setUserRole] = useState<TipoUsuario | null>(null)
   const [tokenId, setTokenId] = useState<number | null>(null)
   const [loading, setLoading] = useState(true) // começa true até ler o localStorage
   const router = useRouter()

   // Autenticação depende do TOKEN (formato + exp + role legível), não do authUser
   // do localStorage — que é manipulável no DevTools e leva só o perfil.
   const isAuthenticated = !!token && !!userRole
   const isAdmin = userRole === 'admin'

   useEffect(() => {
      const { token: storedToken, user: storedUser } = getStoredAuthData()
      const role = storedToken ? resolverUserRole(storedToken) : null
      // Token ausente, expirado, não-JWT ou sem role legível: limpa a sessão persistida
      // e segue como deslogado (o 401 em chamadas da API continua a cargo do data.ts)
      if (!storedToken || !isTokenValid(storedToken) || role === null) {
         localStorage.removeItem('authToken')
         localStorage.removeItem('authUser')
      } else {
         setToken(storedToken)
         setUserRole(role)
         setTokenId(obterClaims(storedToken)?.id ?? null)
         // authUser é só perfil: pode estar ausente ou corrompido sem invalidar a sessão
         if (storedUser) setUser(storedUser)
      }
      setLoading(false) // auth resolvido, libera a aplicação
   }, [])

   const login = async (email: string, senha: string) => {
      try {
         const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha }),
         })

         if (!response.ok) {
            // O backend devolve erros em "error"/"message" (auth) ou no array "errors" (validação)
            const errorData = await response.json().catch(() => null)
            throw new Error(extrairMensagemErro(errorData, 'Falha no login. Verifique as credenciais.'))
         }

         const { token: receivedToken, user: userData } = await response.json()

         const role = resolverUserRole(receivedToken)
         if (role === null) {
            // Backend autenticou mas não devolveu um JWT com role legível — não há sessão confiável
            throw new Error('Resposta de login inválida. Contate o suporte.')
         }

         localStorage.setItem('authToken', receivedToken)
         if (userData) localStorage.setItem('authUser', JSON.stringify(userData))

         setToken(receivedToken)
         setUserRole(role)
         setTokenId(obterClaims(receivedToken)?.id ?? null)
         if (userData) setUser(userData as User)

         toast.success(`Bem-vindo(a), ${(userData?.nome ?? '').split(' ')[0] || 'usuário(a)'}!`)
         router.push('/')
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
         console.error('Erro de Login:', error.message)
         toast.error(error.message)
         throw error
      }
   }

   const register = async (nome: string, email: string, senha: string) => {
      try {
         const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha }),
         })

         if (!response.ok) {
            // O backend devolve erros em "error"/"message" (auth) ou no array "errors" (validação)
            const errorData = await response.json().catch(() => null)
            throw new Error(extrairMensagemErro(errorData, 'Falha no registro.'))
         }

         const { token: receivedToken, user: userData } = await response.json()

         const role = resolverUserRole(receivedToken)
         if (role === null) {
            // Backend autenticou mas não devolveu um JWT com role legível — não há sessão confiável
            throw new Error('Resposta de registro inválida. Contate o suporte.')
         }

         localStorage.setItem('authToken', receivedToken)
         if (userData) localStorage.setItem('authUser', JSON.stringify(userData))

         setToken(receivedToken)
         setUserRole(role)
         setTokenId(obterClaims(receivedToken)?.id ?? null)
         if (userData) setUser(userData as User)

         toast.success('Conta criada com sucesso!')
         login(email, senha)
         router.push('/')
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
         console.error('Erro de Registro:', error.message)
         toast.error(error.message)
         throw error
      }
   }

   const logout = () => {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      setToken(null)
      setUser(null)
      setUserRole(null)
      setTokenId(null)
      toast.info('Você foi desconectado.')
      router.push('/')
   }

   return (
      <AuthContext.Provider value={{ user, token, userRole, isAdmin, tokenId, isAuthenticated, loading, login, register, logout }}>
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
