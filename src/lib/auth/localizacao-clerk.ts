import { ptBR } from '@clerk/localizations'

/**
 * Localização dos componentes do Clerk. O pt-BR oficial (@clerk/localizations)
 * deixa `formFieldInputPlaceholder__signUpPassword` vazia e, sem ela, o Clerk
 * usa o inglês "Create a password" na etapa de senha do cadastro/redefinição.
 */
export const LOCALIZACAO_CLERK = {
   ...ptBR,
   formFieldInputPlaceholder__signUpPassword: 'Crie uma senha',
}
