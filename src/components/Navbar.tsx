import { MapPin } from 'lucide-react'
import { Button } from './ui/button'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { UserMenu } from './UserMenu'

export function Navbar({ onOpenAuth }: { onOpenAuth: () => void }) {
    const { isAuthenticated, user, isAdmin } = useAuth()

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

                    {/* Actions: Login/crachá (sempre visível) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-2 sm:gap-3">
                                <UserMenu mostrarItensEventos />
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
                    </motion.div>
                </div>
            </div>
        </nav>
    )
}
