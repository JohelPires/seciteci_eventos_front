import { Card, CardContent } from './ui/card'
import { Skeleton } from './ui/skeleton'

/** Espelha a geometria do EventCard; usado apenas no 1º load. */
export function CardSkeleton() {
   return (
      <div className="h-full" aria-hidden="true">
         <Card className="overflow-hidden h-full flex flex-col border border-border bg-card">
            {/* Imagem de capa */}
            <div className="relative h-52">
               <Skeleton className="h-full w-full rounded-none" />
            </div>

            <CardContent className="flex-1 flex flex-col mt-4 motion-reduce:animate-none">
               {/* Título */}
               <Skeleton className="h-5 w-3/4 mb-3" />

               {/* Descrição */}
               <Skeleton className="h-3 w-full mb-2" />
               <Skeleton className="h-3 w-5/6 mb-6" />

               {/* Info (data/local/categoria) */}
               <div className="space-y-4 mb-6">
                  {[...Array(3)].map((_, i) => (
                     <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-md" />
                        <div className="flex-1">
                           <Skeleton className="h-3 w-1/2 mb-1" />
                           <Skeleton className="h-3 w-3/4" />
                        </div>
                     </div>
                  ))}
               </div>

               {/* Botão de ação */}
               <Skeleton className="h-9 w-full rounded-md" />
            </CardContent>
         </Card>
      </div>
   )
}
