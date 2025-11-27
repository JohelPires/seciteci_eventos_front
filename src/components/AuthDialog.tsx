import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Mail, Lock, User } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner' // Importar toast para exibir mensagens de erro
import { useAuth } from '@/context/AuthContext' // Importar o hook de autenticação

/**
 * Interface simplificada: não precisa mais de onLogin/onRegister,
 * pois o AuthContext fará o trabalho.
 */
interface AuthDialogProps {
   open: boolean
   onClose: () => void
}

export function AuthDialog({ open, onClose }: AuthDialogProps) {
   // Acesso às funções de login e registro do Contexto
   const { login, register } = useAuth()

   // Estados de Login
   const [loginEmail, setLoginEmail] = useState('')
   const [loginPassword, setLoginPassword] = useState('')
   const [isLoginLoading, setIsLoginLoading] = useState(false)

   // Estados de Registro
   const [registerName, setRegisterName] = useState('')
   const [registerEmail, setRegisterEmail] = useState('')
   const [registerPassword, setRegisterPassword] = useState('')
   const [confirmPassword, setConfirmPassword] = useState('')
   const [userType, setUserType] = useState<'client' | 'professional'>('client')
   const [isRegisterLoading, setIsRegisterLoading] = useState(false)

   const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoginLoading(true)
      try {
         // Chamada à função login do AuthContext
         await login(loginEmail, loginPassword)
         onClose() // Fecha o modal apenas em caso de sucesso
      } catch (error) {
         // O erro já foi tostado no AuthContext, mas a UI de loading é tratada aqui.
         console.error('Falha ao tentar login:', error)
      } finally {
         setIsLoginLoading(false)
      }
   }

   const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault()
      if (registerPassword !== confirmPassword) {
         // Uso do toast no lugar do alert()
         toast.error('As senhas não coincidem! Por favor, verifique.')
         return
      }

      setIsRegisterLoading(true)
      try {
         // Chamada à função register do AuthContext
         await register(registerName, registerEmail, registerPassword, userType)
         onClose() // Fecha o modal apenas em caso de sucesso
      } catch (error) {
         // O erro já foi tostado no AuthContext.
         console.error('Falha ao tentar registrar:', error)
      } finally {
         setIsRegisterLoading(false)
      }
   }

   return (
      <Dialog open={open} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
               <div className="flex items-center justify-center mb-4">
                  {/* Se '/logo-mapasmt.png' estiver no seu diretório public */}
                  {/* <Image
                     src="/logo-mapasmt.png"
                     alt="EventHub Logo"
                     width={180}
                     height={180}
                     className="w-auto h-16 object-contain"
                  /> */}
               </div>
               <DialogTitle className="text-center text-2xl">Bem-vindo ao CONECTE-SE</DialogTitle>
               <DialogDescription className="text-center">Entre ou crie sua conta para continuar</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="login" className="w-full">
               <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Cadastrar</TabsTrigger>
               </TabsList>

               {/* Login Tab */}
               <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4 mt-4">
                     <div className="space-y-2">
                        <Label htmlFor="login-email">E-mail</Label>
                        <div className="relative">
                           <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                           <Input
                              id="login-email"
                              type="email"
                              placeholder="seu@email.com"
                              className="pl-10"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              required
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <Label htmlFor="login-password">Senha</Label>
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                           <Input
                              id="login-password"
                              type="password"
                              placeholder="••••••••"
                              className="pl-10"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              required
                           />
                        </div>
                     </div>

                     <div className="flex justify-end">
                        <button
                           type="button"
                           className="text-sm text-primary hover:text-primary-foreground/80 transition-colors"
                        >
                           Esqueceu a senha?
                        </button>
                     </div>

                     <Button type="submit" className="w-full" disabled={isLoginLoading}>
                        {isLoginLoading ? 'Entrando...' : 'Entrar'}
                     </Button>
                  </form>
               </TabsContent>

               {/* Register Tab */}
               <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4 mt-4">
                     <div className="space-y-2">
                        <Label htmlFor="register-name">Nome Completo</Label>
                        <div className="relative">
                           <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                           <Input
                              id="register-name"
                              type="text"
                              placeholder="Seu nome"
                              className="pl-10"
                              value={registerName}
                              onChange={(e) => setRegisterName(e.target.value)}
                              required
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <Label htmlFor="register-email">E-mail</Label>
                        <div className="relative">
                           <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                           <Input
                              id="register-email"
                              type="email"
                              placeholder="seu@email.com"
                              className="pl-10"
                              value={registerEmail}
                              onChange={(e) => setRegisterEmail(e.target.value)}
                              required
                           />
                        </div>
                     </div>

                     {/* Tipos de Usuário (mantido do original, mas pode não ser usado na API) */}
                     {/* <div className="space-y-2 pt-2">
                        <Label>Tipo de Usuário</Label>
                        <RadioGroup
                           defaultValue="client"
                           value={userType}
                           onValueChange={(value: 'client' | 'professional') => setUserType(value)}
                           className="flex space-x-4"
                        >
                           <div className="flex items-center space-x-2">
                              <RadioGroupItem value="client" id="client" />
                              <Label htmlFor="client" className="flex items-center gap-1">
                                 <span className="text-sm">Cliente</span>
                              </Label>
                           </div>
                           <div className="flex items-center space-x-2">
                              <RadioGroupItem value="professional" id="professional" />
                              <Label htmlFor="professional" className="flex items-center gap-1">
                                 <span className="text-sm">Profissional</span>
                              </Label>
                           </div>
                        </RadioGroup>
                     </div> */}

                     <div className="space-y-2">
                        <Label htmlFor="register-password">Senha</Label>
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                           <Input
                              id="register-password"
                              type="password"
                              placeholder="••••••••"
                              className="pl-10"
                              value={registerPassword}
                              onChange={(e) => setRegisterPassword(e.target.value)}
                              required
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Senha</Label>
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                           <Input
                              id="confirm-password"
                              type="password"
                              placeholder="••••••••"
                              className="pl-10"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                           />
                        </div>
                     </div>

                     <Button type="submit" className="w-full mt-4" disabled={isRegisterLoading}>
                        {isRegisterLoading ? 'Criando Conta...' : 'Criar Conta'}
                     </Button>

                     <p className="text-xs text-center text-gray-500">
                        Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade
                     </p>
                  </form>
               </TabsContent>
            </Tabs>
         </DialogContent>
      </Dialog>
   )
}
