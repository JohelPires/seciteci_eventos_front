import { Calendar, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'
import Image from 'next/image'

export function Footer() {
   return (
      <footer className="bg-[#143373] text-white border-t border-white/10">
         <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {/* Sobre */}
               <div>
                  {/* <div className="flex items-center gap-3 mb-4">
                     <Image src="/logo-mapasmt-branco.png" alt="MapasMT" width={180} height={180} />
                  </div> */}
                  <div className="flex items-center gap-3 mb-4">
                     <Image src="/layout_set_logo.png" alt="Seciteci" width={180} height={180} />
                  </div>
                  {/* <p className="text-white/80 text-sm leading-relaxed">
                     Plataforma de eventos da Seciteci no Estado do Mato Grosso
                  </p> */}
               </div>

               {/* Links Rápidos */}
               <div>
                  <h4 className="text-white mb-4">Links Rápidos</h4>
                  <ul className="space-y-2">
                     <li>
                        <a href="#" className="text-white/80 hover:text-white text-sm transition-colors">
                           Sobre Nós
                        </a>
                     </li>
                     <li>
                        <a href="#" className="text-white/80 hover:text-white text-sm transition-colors">
                           Eventos
                        </a>
                     </li>
                     <li>
                        <a href="#" className="text-white/80 hover:text-white text-sm transition-colors">
                           Categorias
                        </a>
                     </li>
                     <li>
                        <a href="#" className="text-white/80 hover:text-white text-sm transition-colors">
                           Locais
                        </a>
                     </li>
                  </ul>
               </div>

               {/* Contato */}
               <div>
                  <h4 className="text-white mb-4">Contato</h4>
                  <ul className="space-y-3">
                     <li className="flex items-center gap-2 text-white/80 text-sm">
                        <Mail className="w-4 h-4" />
                        <span>contato@eventhub.com.br</span>
                     </li>
                     <li className="flex items-center gap-2 text-white/80 text-sm">
                        <Phone className="w-4 h-4" />
                        <span>(11) 98765-4321</span>
                     </li>
                     <li className="flex items-start gap-2 text-white/80 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span>Av. Mato Grosso, 1000 - Cuiabá, MT</span>
                     </li>
                  </ul>
               </div>

               {/* Redes Sociais */}
               <div>
                  <h4 className="text-white mb-4">Redes Sociais</h4>
                  <div className="flex gap-3">
                     <a
                        href="#"
                        className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white hover:text-[#143373] flex items-center justify-center transition-colors"
                        aria-label="Facebook"
                     >
                        <Facebook className="w-5 h-5" />
                     </a>
                     <a
                        href="#"
                        className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white hover:text-[#143373] flex items-center justify-center transition-colors"
                        aria-label="Twitter"
                     >
                        <Twitter className="w-5 h-5" />
                     </a>
                     <a
                        href="#"
                        className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white hover:text-[#143373] flex items-center justify-center transition-colors"
                        aria-label="Instagram"
                     >
                        <Instagram className="w-5 h-5" />
                     </a>
                     <a
                        href="#"
                        className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white hover:text-[#143373] flex items-center justify-center transition-colors"
                        aria-label="LinkedIn"
                     >
                        <Linkedin className="w-5 h-5" />
                     </a>
                  </div>
               </div>
            </div>

            {/* Copyright */}
            <div className="mt-8 pt-8 border-t border-white/10">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-white/60 text-sm">© 2025 Conecte-se. Desenvolvido pela Seciteci.</p>
                  <div className="flex gap-6">
                     <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                        Política de Privacidade
                     </a>
                     <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                        Termos de Uso
                     </a>
                  </div>
               </div>
            </div>
         </div>
      </footer>
   )
}
