/** Rota de saúde para o healthcheck do compose (`${APP_CAMINHO}/saude`). */
export function GET() {
   return Response.json({ status: 'OK' })
}
