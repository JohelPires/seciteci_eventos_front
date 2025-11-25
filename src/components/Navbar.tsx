import { Home, Briefcase, Users, CalendarDays, MapPin, Folder, Accessibility, Menu } from 'lucide-react'
import { Button } from './ui/button'
import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'

export function Navbar({ onOpenAuth }: { onOpenAuth: () => void }) {
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
   const [activeTab, setActiveTab] = useState('eventos')

   const { isAuthenticated, user, logout } = useAuth()

   const navItems = [
      // { id: 'home', label: 'Home', icon: Home },
      { id: 'oportunidades', label: 'Oportunidades', icon: Briefcase },
      { id: 'agentes', label: 'Agentes', icon: Users },
      { id: 'eventos', label: 'Eventos', icon: CalendarDays },
      { id: 'espacos', label: 'Espaços', icon: MapPin },
      { id: 'projetos', label: 'Projetos', icon: Folder },
      { id: 'acessibilidade', label: 'Acessibilidade', icon: Accessibility },
   ]

   return (
      <nav className="sticky top-0 z-50 w-full bg-primary pt-1 pb-1 mb-2 shadow-black/40 shadow-2xl">
         <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
               {/* Logo */}
               <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3"
               >
                  {/* <Image src="/logo-mapasmt-branco.png" alt="EventHub Logo" width={180} height={180} /> */}
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                     <MapPin className="w-6 h-6 text-[#143373]" />
                  </div>
                  <div className="flex flex-col">
                     <h1 className="text-2xl font-bold text-white">CONECTE-SE</h1>
                     <p className="text-xs text-white/80">
                        SECITECI - Secretaria de Estado de Ciência, Tecnologia e Inovação.
                     </p>
                  </div>
               </motion.div>

               {/* Actions: Hamburger Menu + Login (sempre visíveis) */}
               <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
               >
                  {/* Login Button */}

                  {isAuthenticated ? (
                     <p className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-white text-sm">
                        Olá, {user?.nome}
                        {user?.tipoUsuario === 'admin' && (
                           <Button
                              onClick={() => (window.location.href = '/admin')}
                              variant="ghost"
                              className="cursor-pointer"
                           >
                              Painel
                           </Button>
                        )}
                        <Button onClick={logout} variant="outline" className="cursor-pointer">
                           Sair
                        </Button>
                     </p>
                  ) : (
                     <Button onClick={onOpenAuth} variant="outline" className="cursor-pointer">
                        Entrar
                     </Button>
                  )}
                  {/* Menu Hamburguer */}
                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                     className="text-white hover:bg-white/10"
                  >
                     <Menu className="w-5 h-5" />
                  </Button>
               </motion.div>
            </div>

            {/* Menu Dropdown (sempre disponível quando hamburguer for clicado) */}
            {mobileMenuOpen && (
               <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/20 py-4 space-y-2"
               >
                  {navItems.map((item) => {
                     const Icon = item.icon
                     return (
                        <button
                           key={item.id}
                           onClick={() => {
                              setActiveTab(item.id)
                              setMobileMenuOpen(false)
                           }}
                           className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                              activeTab === item.id ? 'bg-white text-[#143373]' : 'text-white hover:bg-white/10'
                           }`}
                        >
                           <Icon className="w-5 h-5" />
                           <span>{item.label}</span>
                        </button>
                     )
                  })}
               </motion.div>
            )}
         </div>
      </nav>
   )
}
