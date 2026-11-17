'use client'

import { useRouter } from 'next/navigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { CalendarSearch, FolderOpen, LogOut, PlusCircle, UserRoundCog } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { useAuth } from '@/context/AuthContext'
import { UserBadge } from './UserBadge'

// Itens de navegação do site (só no menu do site público, não no painel)
const ITENS_EVENTOS = [
   { id: 'explorar', label: 'Explorar eventos', icon: CalendarSearch, href: '/' },
   { id: 'meus-eventos', label: 'Meus eventos', icon: FolderOpen, href: '/meus-eventos' },
   { id: 'criar', label: 'Criar evento', icon: PlusCircle, href: '/?action=create' },
] as const

/**
 * Crachá do usuário como menu de conta: navegação do site, gerenciar a conta
 * no Clerk (perfil/senha/MFA, modal do próprio Clerk) e sair. Reusado pelo
 * site e pelo painel admin.
 */
export function UserMenu({ mostrarItensEventos = false }: { mostrarItensEventos?: boolean }) {
   const { user, userRole, logout } = useAuth()
   const clerk = useClerk()
   const router = useRouter()

   if (!user) return null

   return (
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
            {/* Perfil/senha/MFA ficam no Clerk (modal prebuilt, pt-BR): o
                backend não tem mais login/senha próprios. */}
            <DropdownMenuItem onSelect={() => void clerk.openUserProfile()}>
               <UserRoundCog />
               Minha conta
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={logout}>
               <LogOut />
               Sair
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   )
}
