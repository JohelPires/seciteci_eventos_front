/**
 * Tipos mínimos do Google Identity Services (GIS), só o que o login usa:
 * script `https://accounts.google.com/gsi/client`, `initialize` com callback
 * de credential (ID token) e `renderButton`. Referência:
 * https://developers.google.com/identity/gsi/web/reference/js-reference
 */

interface GoogleCredentialResponse {
   /** ID token (JWT) do Google — enviado ao backend em POST /api/auth/google. */
   credential: string
   select_by: string
}

interface GoogleIdConfiguration {
   client_id: string
   callback: (resposta: GoogleCredentialResponse) => void
   auto_select?: boolean
   cancel_on_tap_outside?: boolean
   locale?: string
}

interface GsiButtonConfiguration {
   type?: 'standard' | 'icon'
   theme?: 'outline' | 'filled_blue' | 'filled_black'
   size?: 'large' | 'medium' | 'small'
   text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
   shape?: 'rectangular' | 'pill' | 'circle' | 'square'
   logo_alignment?: 'left' | 'center'
   /** Largura em px (mínimo 200, máximo 400). */
   width?: number
   locale?: string
}

interface GoogleAccountsId {
   initialize(config: GoogleIdConfiguration): void
   renderButton(pai: HTMLElement, opcoes: GsiButtonConfiguration): void
   disableAutoSelect(): void
}

interface GoogleAccounts {
   id: GoogleAccountsId
}

interface Window {
   google?: { accounts: GoogleAccounts }
}
