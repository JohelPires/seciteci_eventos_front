'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { CalendarSearch, FolderOpen, KeyRound, LogOut, PlusCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { UserBadge } from './UserBadge'
import { ChangePasswordDialog } from './ChangePasswordDialog'

// Itens de navegação do site (só no menu do site público, não no painel)
const ITENS_EVENTOS = [
   { id: 'explorar', label: 'Explorar eventos', icon: CalendarSearch, href: '/' },
   { id: 'meus-eventos', label: 'Meus eventos', icon: FolderOpen, href: '/meus-eventos' },
   { id: 'criar', label: 'Criar evento', icon: PlusCircle, href: '/?action=create' },
] as const

/**
 * Crachá do usuário como menu de conta: navegação do site, trocar senha e sair
 * ficam onde o usuário se reconhece. Reusado pelo site e pelo painel admin.
 */
export function UserMenu({ mostrarItensEventos = false }: { mostrarItensEventos?: boolean }) {
   const { user, userRole, logout } = useAuth()
   const [senhaAberta, setSenhaAberta] = useState(false)
   const router = useRouter()

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
               {mostrarItensEventos && (
                  <>
                     {ITENS_EVENTOS.map((item) => {
                        const Icon = item.icon
                        return (
                           <DropdownMenuItem key={item.id} onSelect={() => router.push(item.href)}>
                              <Icon />
                              {item.label}
                           </DropdownMenuItem>
                        )
                     })}
                     <DropdownMenuSeparator />
                  </>
               )}
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
