import { Calendar, Home, Briefcase, Users, CalendarDays, MapPin, Folder, Accessibility, Menu } from 'lucide-react'
import { Button } from './ui/button'
import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'

export function Navbar({ onOpenAuth }: { onOpenAuth: () => void }) {
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
   const [activeTab, setActiveTab] = useState('eventos')

   const navItems = [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'oportunidades', label: 'Oportunidades', icon: Briefcase },
      { id: 'agentes', label: 'Agentes', icon: Users },
      { id: 'eventos', label: 'Eventos', icon: CalendarDays },
      { id: 'espacos', label: 'Espaços', icon: MapPin },
      { id: 'projetos', label: 'Projetos', icon: Folder },
      { id: 'acessibilidade', label: 'Acessibilidade', icon: Accessibility },
   ]

   return (
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
         <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between my-3">
               {/* Logo */}
               <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3"
               >
                  <Image src="/logo-mapasmt.png" alt="EventHub Logo" width={180} height={180} />
                  {/* 
                  <div className="hidden sm:block">
                     <h3 className="leading-none">EventHub</h3>
                  </div> */}
               </motion.div>

               {/* Desktop Navigation */}
               <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hidden lg:flex items-center gap-1"
               >
                  {navItems.map((item) => {
                     const Icon = item.icon
                     return (
                        <button
                           key={item.id}
                           onClick={() => setActiveTab(item.id)}
                           className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                              activeTab === item.id
                                 ? 'bg-primary text-primary-foreground'
                                 : 'text-foreground hover:bg-muted'
                           }`}
                        >
                           <Icon className="w-5 h-5" />
                           <span className="text-xs">{item.label}</span>
                        </button>
                     )
                  })}
               </motion.div>

               {/* Login Button */}
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
                  <Button
                     onClick={onOpenAuth}
                     variant="default"
                     className="bg-slate-800 hover:bg-slate-900 cursor-pointer"
                  >
                     Entrar
                  </Button>
               </motion.div>

               {/* Mobile Menu Button */}
               <div className="lg:hidden">
                  <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                     <Menu className="w-5 h-5" />
                  </Button>
               </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
               <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="lg:hidden border-t border-border py-4 space-y-2"
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
                              activeTab === item.id
                                 ? 'bg-primary text-primary-foreground'
                                 : 'text-foreground hover:bg-muted'
                           }`}
                        >
                           <Icon className="w-5 h-5" />
                           <span>{item.label}</span>
                        </button>
                     )
                  })}
                  <div className="h-px bg-border my-2" />
                  <Button variant="default" className="w-full bg-slate-800 hover:bg-slate-900">
                     Entrar
                  </Button>
               </motion.div>
            )}
         </div>
      </nav>
   )
}
