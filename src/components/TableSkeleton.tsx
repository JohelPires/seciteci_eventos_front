import { useMemo } from 'react'
import { Skeleton } from './ui/skeleton'
import { TableBody, TableCell, TableRow } from './ui/table'

/** Linhas vazias espelhando a tabela do painel; usado apenas no 1º load. */
export function TableSkeleton({ linhas = 5, colunas }: { linhas?: number; colunas: number }) {
   const linhasArr = useMemo(() => Array.from({ length: linhas }), [linhas])
   return (
      <TableBody aria-hidden="true">
         {linhasArr.map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
               {Array.from({ length: colunas }).map((_, j) => (
                  <TableCell key={j}>
                     <Skeleton className="h-5 w-full max-w-[160px] motion-reduce:animate-none" />
                  </TableCell>
               ))}
            </TableRow>
         ))}
      </TableBody>
   )
}
