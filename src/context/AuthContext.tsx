'use client'

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface User {
   id: number
   nome: string
   email: string
   telefone: string | null
   cpf: string | null
   dataNascimento: string | null
   fotoPerfil: string | null
   tipoUsuario: 'admin' | 'client' | 'professional'
   dataCadastro: string
   ultimoAcesso: string
}

interface AuthContextType {
   user: User | null
   token: string | null
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
      const storedUser = localStorage.getItem('authUser')
      return {
         token: storedToken,
         user: storedUser ? (JSON.parse(storedUser) as User) : null,
      }
   }
   return { token: null, user: null }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
   const [user, setUser] = useState<User | null>(null)
   const [token, setToken] = useState<string | null>(null)
   const [loading, setLoading] = useState(true) // começa true até ler o localStorage
   const router = useRouter()

   const isAuthenticated = !!token && !!user

   useEffect(() => {
      const { token: storedToken, user: storedUser } = getStoredAuthData()
      if (storedToken && storedUser) {
         setToken(storedToken)
         setUser(storedUser)
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
            const errorData = await response.json()
            throw new Error(errorData.message || 'Falha no login. Verifique as credenciais.')
         }

         const { token: receivedToken, user: userData } = await response.json()

         localStorage.setItem('authToken', receivedToken)
         localStorage.setItem('authUser', JSON.stringify(userData))

         setToken(receivedToken)
         setUser(userData as User)

         toast.success(`Bem-vindo(a), ${userData.nome.split(' ')[0]}!`)
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
            const errorData = await response.json()
            throw new Error(errorData.message || 'Falha no registro.')
         }

         const { token: receivedToken, user: userData } = await response.json()

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

   const logout = () => {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      setToken(null)
      setUser(null)
      toast.info('Você foi desconectado.')
      router.push('/')
   }

   return (
      <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, register, logout }}>
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
