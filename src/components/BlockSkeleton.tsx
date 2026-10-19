import { Skeleton } from './ui/skeleton'

/** Bloco genérico de reserva de altura (mapa, calendário); usado apenas no 1º load. */
export function BlockSkeleton({ className = 'h-80' }: { className?: string }) {
   return (
      <div aria-hidden="true">
         <Skeleton className={`w-full ${className} rounded-lg motion-reduce:animate-none`} />
      </div>
   )
}
