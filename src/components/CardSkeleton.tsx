import { Card, CardContent } from './ui/card'

export function CardSkeleton() {
   return (
      <div className="h-full">
         <Card className="overflow-hidden h-full flex flex-col border border-border bg-card animate-pulse">
            {/* Image placeholder */}
            <div className="relative h-52 bg-muted" />

            <CardContent className="flex-1 flex flex-col mt-4">
               {/* Title */}
               <div className="h-5 bg-muted rounded w-3/4 mb-3" />

               {/* Description */}
               <div className="h-3 bg-muted rounded w-full mb-2" />
               <div className="h-3 bg-muted rounded w-5/6 mb-6" />

               {/* Info Section */}
               <div className="space-y-4 mb-6">
                  {[...Array(3)].map((_, i) => (
                     <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-md" />
                        <div className="flex-1">
                           <div className="h-3 bg-muted rounded w-1/2 mb-1" />
                           <div className="h-3 bg-muted rounded w-3/4" />
                        </div>
                     </div>
                  ))}
               </div>

               {/* Action Button */}
               <div className="flex gap-2">
                  <div className="h-9 bg-muted rounded-md w-full" />
               </div>
            </CardContent>
         </Card>
      </div>
   )
}
