'use client'

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation' // Importação correta para o App Router

const API_URL = process.env.NEXT_PUBLIC_API_URL

// =================================================================
// 1. TIPAGEM E INTERFACES
// =================================================================

/**
 * Define a estrutura completa do objeto de usuário retornado pela API.
 */
interface User {
   id: number
   nome: string
   email: string
   telefone: string | null
   cpf: string | null
   dataNascimento: string | null
   fotoPerfil: string | null
   tipoUsuario: 'admin' | 'client' | 'professional' // Adicione/ajuste os tipos conforme o backend
   dataCadastro: string
   ultimoAcesso: string
}

/**
 * Define a interface pública do Contexto de Autenticação.
 */
interface AuthContextType {
   user: User | null
   token: string | null
   isAuthenticated: boolean
   login: (email: string, senha: string) => Promise<void>
   register: (nome: string, email: string, senha: string, userType: 'client' | 'professional') => Promise<void>
   logout: () => void
}

// Inicializa o Contexto de Autenticação
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// =================================================================
// 2. FUNÇÕES AUXILIARES DE ARMAZENAMENTO
// =================================================================

/**
 * Busca dados de autenticação armazenados no localStorage.
 * Garante que isso só seja executado no lado do cliente (browser).
 */
const getStoredAuthData = () => {
   if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('authToken')
      const storedUser = localStorage.getItem('authUser')
      return {
         token: storedToken,
         // Faz o parse do JSON e garante a tipagem do usuário
         user: storedUser ? (JSON.parse(storedUser) as User) : null,
      }
   }
   return { token: null, user: null }
}

// =================================================================
// 3. PROVEDOR DE AUTENTICAÇÃO
// =================================================================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
   const [user, setUser] = useState<User | null>(null)
   const [token, setToken] = useState<string | null>(null)
   const router = useRouter() // Hook para navegação no App Router

   const isAuthenticated = !!token && !!user // true se houver token E usuário

   // Efeito para carregar o estado de autenticação do localStorage na montagem
   useEffect(() => {
      const { token: storedToken, user: storedUser } = getStoredAuthData()
      if (storedToken && storedUser) {
         setToken(storedToken)
         setUser(storedUser)
      }
      // O '[]' garante que este efeito rode apenas uma vez, na inicialização
   }, [])

   /**
    * Lógica para realizar o login via API.
    */
   const login = async (email: string, senha: string) => {
      try {
         const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, senha }),
         })

         if (!response.ok) {
            const errorData = await response.json()
            // Lança um erro com a mensagem da API ou uma mensagem padrão
            throw new Error(errorData.message || 'Falha no login. Verifique as credenciais.')
         }

         // Desestrutura a resposta: { token, user }
         const { token: receivedToken, user: userData } = await response.json()

         // Armazena no localStorage
         localStorage.setItem('authToken', receivedToken)
         localStorage.setItem('authUser', JSON.stringify(userData))

         // Atualiza o estado
         setToken(receivedToken)
         setUser(userData as User)

         toast.success(`Bem-vindo(a), ${userData.nome.split(' ')[0]}!`)

         // Exemplo de redirecionamento após o login
         router.push('/')
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
         console.error('Erro de Login:', error.message)
         // O erro é exibido na notificação para o usuário
         toast.error(error.message)
         // Re-lança o erro para ser capturado no componente chamador (ex: AuthDialog)
         throw error
      }
   }

   /**
    * Lógica para realizar o registro via API (Stub).
    */
   const register = async (nome: string, email: string, senha: string) => {
      try {
         const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nome, email, senha }), // Adapte o payload para o seu endpoint de registro
         })

         if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Falha no registro.')
         }

         const { token: receivedToken, user: userData } = await response.json()

         // Se o registro logar automaticamente:
         localStorage.setItem('authToken', receivedToken)
         localStorage.setItem('authUser', JSON.stringify(userData))
         setToken(receivedToken)
         setUser(userData as User)

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

   /**
    * Lógica para realizar o logout.
    */
   const logout = () => {
      // Remove do localStorage
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')

      // Limpa o estado
      setToken(null)
      setUser(null)

      toast.info('Você foi desconectado.')
      router.push('/') // Redireciona para a home
   }

   return (
      <AuthContext.Provider value={{ user, token, isAuthenticated, login, register, logout }}>
         {children}
      </AuthContext.Provider>
   )
}

// =================================================================
// 4. HOOK PERSONALIZADO
// =================================================================

/**
 * Hook customizado para consumir o contexto de autenticação de forma segura.
 */
export const useAuth = () => {
   const context = useContext(AuthContext)
   if (context === undefined) {
      throw new Error('useAuth deve ser usado dentro de um AuthProvider')
   }
   return context
}
