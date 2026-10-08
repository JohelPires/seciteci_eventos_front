'use client'

import { useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { KeyRound, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { UserBadge } from './UserBadge'
import { ChangePasswordDialog } from './ChangePasswordDialog'

/**
 * Crachá do usuário como menu de conta: trocar senha e sair ficam onde o
 * usuário se reconhece. Reusado pelo site e pelo painel admin.
 */
export function UserMenu() {
   const { user, userRole, logout } = useAuth()
   const [senhaAberta, setSenhaAberta] = useState(false)

   if (!user) return null

   return (
      <>
         <DropdownMenu>
            <DropdownMenuTrigger className="rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/70" asChild>
               <button type="button" className="cursor-pointer" aria-label={`Conta de ${user.nome}`}>
                  <UserBadge nome={user.nome} fotoPerfil={user.fotoPerfil} papel={userRole ?? user.tipoUsuario} />
               </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
               <DropdownMenuLabel className="flex flex-col">
                  <span className="truncate">{user.nome}</span>
                  <span className="text-muted-foreground truncate text-xs font-normal">{user.email}</span>
               </DropdownMenuLabel>
               <DropdownMenuSeparator />
               <DropdownMenuItem onSelect={() => setSenhaAberta(true)}>
                  <KeyRound />
                  Alterar senha
               </DropdownMenuItem>
               <DropdownMenuItem variant="destructive" onSelect={logout}>
                  <LogOut />
                  Sair
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>

         <ChangePasswordDialog open={senhaAberta} onOpenChange={setSenhaAberta} />
      </>
   )
}
