'use client'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

interface UserBadgeProps {
   nome: string
   fotoPerfil: string | null
   papel: 'admin' | 'organizador' | 'participante'
}

const ROTULOS_PAPEL = {
   admin: 'Administrador',
   organizador: 'Organizador',
   participante: 'Participante',
} as const

export function UserBadge({ nome, fotoPerfil, papel }: UserBadgeProps) {
   const iniciais = nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join('')

   return (
      <div className="flex items-center gap-3">
         <Avatar className="size-9 border border-white/20">
            {fotoPerfil && <AvatarImage src={fotoPerfil} alt={nome} />}
            <AvatarFallback className="bg-white/15 text-white text-xs font-medium">{iniciais}</AvatarFallback>
         </Avatar>
         <div className="hidden sm:block">
            <p className="text-sm text-white leading-tight truncate max-w-40">{nome}</p>
            <p className="text-[10px] uppercase tracking-widest text-white/60 leading-tight">
               {ROTULOS_PAPEL[papel]}
            </p>
         </div>
      </div>
   )
}
