import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Brain, Mail, Lock, User, Briefcase, Heart } from 'lucide-react'
import Image from 'next/image'

interface AuthDialogProps {
   open: boolean
   onClose: () => void
   onLogin: (email: string, password: string) => void
   onRegister: (email: string, password: string, name: string, userType: 'client' | 'professional') => void
}

export function AuthDialog({ open, onClose, onLogin, onRegister }: AuthDialogProps) {
   const [loginEmail, setLoginEmail] = useState('')
   const [loginPassword, setLoginPassword] = useState('')

   const [registerName, setRegisterName] = useState('')
   const [registerEmail, setRegisterEmail] = useState('')
   const [registerPassword, setRegisterPassword] = useState('')
   const [confirmPassword, setConfirmPassword] = useState('')
   const [userType, setUserType] = useState<'client' | 'professional'>('client')

   const handleLogin = (e: React.FormEvent) => {
      e.preventDefault()
      onLogin(loginEmail, loginPassword)
      onClose()
   }

   const handleRegister = (e: React.FormEvent) => {
      e.preventDefault()
      if (registerPassword !== confirmPassword) {
         alert('As senhas não coincidem!')
         return
      }
      onRegister(registerEmail, registerPassword, registerName, userType)
      onClose()
   }

   return (
      <Dialog open={open} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
               <div className="flex items-center justify-center mb-4">
                  <Image src="/logo-mapasmt.png" alt="EventHub Logo" width={180} height={180} />
               </div>
               <DialogTitle className="text-center text-2xl">Bem-vindo ao Mapas MT</DialogTitle>
               <DialogDescription className="text-center">Entre ou crie sua conta para continuar</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="login" className="w-full">
               <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Registrar</TabsTrigger>
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
                        <button type="button" className="text-sm text-blue-600 hover:text-blue-700">
                           Esqueceu a senha?
                        </button>
                     </div>

                     <Button type="submit" className="w-full btn btn-primary">
                        Entrar
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

                     <Button type="submit" className="w-full btn btn-primary mt-4">
                        Criar Conta
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
