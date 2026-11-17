import type { SignIn } from '@clerk/nextjs'
import type * as React from 'react'

type AparenciaClerk = NonNullable<React.ComponentProps<typeof SignIn>['appearance']>

/**
 * Aparência dos componentes do Clerk (`/sign-in`, `/sign-up`) alinhada ao
 * tema do site: azul primário `#143373`, fonte Geist e raio do tema
 * (0.625rem). Somente visual — não mexe em fluxo, redirect nem CSP.
 */
export const APARENCIA_CLERK: AparenciaClerk = {
   variables: {
      colorPrimary: '#143373',
      colorPrimaryForeground: '#ffffff',
      fontFamily: 'var(--font-geist-sans), sans-serif',
      fontFamilyButtons: 'var(--font-geist-sans), sans-serif',
      borderRadius: '0.625rem',
   },
}
