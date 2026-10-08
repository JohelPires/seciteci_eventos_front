import {
    CalendarSearch,
    FolderOpen,
    PlusCircle,
    MapPin,
    Menu,
} from 'lucide-react'
import { Button } from './ui/button'
import { motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { UserMenu } from './UserMenu'

export function Navbar({ onOpenAuth }: { onOpenAuth: () => void }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const router = useRouter()
    const { isAuthenticated, user, isAdmin } = useAuth()

    const navItems = [
        { id: 'explorar', label: 'Explorar eventos', icon: CalendarSearch, href: '/' },
        { id: 'meus-eventos', label: 'Meus eventos', icon: FolderOpen, href: '/meus-eventos', requiresAuth: true },
        { id: 'criar', label: 'Criar evento', icon: PlusCircle, href: '/?action=create', requiresAuth: true },
    ]

    const handleNavigate = (href: string, requiresAuth?: boolean) => {
        if (requiresAuth && !isAuthenticated) {
            onOpenAuth()
            return
        }
        router.push(href)
        setMobileMenuOpen(false)
    }

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
                            <h1 className="text-2xl font-bold text-white">
                                CONECTE-SE
                            </h1>
                            <p className="text-xs text-white/80">
                                SECITECI - Secretaria de Estado de Ciência,
                                Tecnologia e Inovação.
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

                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-2 sm:gap-3">
                                <UserMenu />
                                {isAdmin && (
                                    <Button asChild variant="outline" className="cursor-pointer">
                                        <Link href="/admin">Painel</Link>
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Button
                                onClick={onOpenAuth}
                                variant="outline"
                                className="cursor-pointer"
                            >
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
                                    onClick={() => handleNavigate(item.href, item.requiresAuth)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-white hover:bg-white/10"
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
