alterações:

[x] eventos por categoria do mesmo tamanho de eventos recentes
[x] mapa no painel admin
[x] área de texto (hero section)
O Conecte-se é uma agenda unificada dos eventos da área de Ciência, Tecnologia e Inovação no Estado de Mato Grosso. Existe uma comunidade muito ativa neste segmento, com uma grande produção de eventos como seminários, simpósios, congressos, encontros e outras atividades. Diante disso, a SECITECI conta com uma ferramenta de consulta e divulgação das ações das diversas instituições e atores do ecossistema de ciência, tecnologia e inovação em Mato Grosso.

[x] logo conecte-se
[ ] logo conecte-se no painel admin também

[x] calendário: melhorar a fonte dos dias. bold e linha divisória

[x] se o evento tiver mais de um dia, adicionar no calendário o mesmo evento ao longo dos dias.

[x] listar eventos do mais recente para o mais antigo

[ ] fix mobile nav bar

[x] admin: paginações
[ ] admin: CRUD completo de usuários
[ ] admin: set usuario como admin

[ ] get eventos pega apenas próximos e mostrar do mais proximo em diante. Usuário deve clicar para carregar anteriores.

[x] link maps clicável
[x] link maps não pode aparecer inteiro
[x] link da pagina clicável
[x] sair do modal ao clicar fora dele

[x] validação da imagem restringe demais

[ ] pegar lat e long (nominatin)

[x] admin: ordenar por data mais recente dos eventos

[x] admin: proteger a página admin
    ⚠️ proteção atual é client-side apenas — ver seção Segurança abaixo

---

# Auditoria pré-produção (2026-09-24)

> Marcações: 🖥️ = tarefa depende de / deve ser feita no backend

## 🔴 Críticos — Segurança
⚠️ Implementado na branch `fix/seguranca-criticos` (commits 4beed5d..5ee17f4) — revisado, `tsc` limpo; pendente: merge para main.

- [ ] 🖥️ Confirmar com backend: toda rota admin recusa não-admins no servidor (proteção real); front é só UX
- [x] data.ts: 11 de 13 funções sem `res.ok` → erros viram "sucesso"; helper `authFetch` centraliza fetch, valida `res.ok` (ApiError), trata 401 (limpa auth + redirect)
- [x] Ajustar toasts falsos de sucesso: toast.error em todos os caminhos de falha (page.tsx, admin/page.tsx, AdminCategorias com onError)
- [x] Headers de segurança no next.config.mjs: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (endurecer CSP com nonce é passo futuro)
- [x] `encodeURIComponent` em query params (busca/search)
- [x] Validar `exp` do JWT ao restaurar sessão (src/lib/jwt.ts; token não-JWT passa direto — backend valida; pendência: confirmar formato real do token do login)
- [ ] 🖥️ Autorização do admin não deve depender de `authUser` do localStorage (manipulável no DevTools); preferir claims do JWT (requer backend expondo o role/exp no payload)

## 🔴 Críticos — Estabilidade
- [ ] Remover imports mortos/quebrados: page.tsx:40 (`set` de react-hook-form), :44 (`get` de `http`), :45 (`Separator` de `@radix-ui/react-select`), layout.tsx:5 (`Query` de react-query)
- [ ] QueryProvider.tsx:11: `new QueryClient()` inline recria o cache a cada render — memoizar (`useRef`) + `defaultOptions` (staleTime, `refetchOnWindowFocus: false`)
- [ ] EventForm.tsx:1267-1277: prevenir double-submit (estado isSubmitting, desabilitar botão)
- [ ] Limpar code review lãs dos editados antes do build: `npx lint` (60 warnings de no-unused-vars)

## 🔴 Críticos — SEO
- [ ] layout.tsx:29: `<html lang="en">` → `pt-BR`
- [ ] Metadata completa: openGraph, twitter, metadataBase, canonical, og:image (layout.tsx:18-21)
- [ ] Criar robots.txt, sitemap.xml e manifest (app router: robots.ts, sitemap.ts)
- [ ] Avaliar rota pública `/eventos/[id]` com metadata dinâmica (hoje detalhes só em modal, nada indexável)
- [ ] Descrição real do site em layout.tsx (hoje repete o title)

## 🔴 Críticos — Performance
- [ ] 🖥️ Paginação server-side (hoje `limit=1000` em data.ts:6,33 e pagina no client); fechar item "get eventos pega apenas próximos" acima
- [ ] Migrar `<img>` (EventCard.tsx:84,95; EventDetails.tsx:90; MapView.tsx:287; EventForm.tsx:1089) para `next/image` com loading lazy, width/height e remotePatterns no next.config
- [ ] Converter public/evento_sem_imagem.png (908 KB) para webp otimizado

## 🟠 Médios — UX
- [ ] Migrar modais manuais EventForm/EventDetails (`<div>` com backdrop) para `Dialog`/`AlertDialog` do shadcn (Esc, focus trap, scroll lock)
- [ ] Admin: adicionar skeleton/loading na tabela e tratar erro de fetch (admin/page.tsx:65-91)
- [ ] Home: distinguir erro de API de lista vazia (page.tsx:431 mostra "Nenhum evento encontrado" em falha)
- [ ] AdminEventos.tsx:167: coluna "Local" exibe texto literal "local" — dado falso
- [ ] Substituir alert()/confirm() nativos por sonner/AlertDialog: admin/page.tsx:152, AdminEventos.tsx:216, AdminCategorias.tsx:115, AdminUsuarios.tsx:264
- [ ] Navbar: menu "Oportunidades/Agentes/..." não navega (Navbar.tsx:21-29); fix mobile nav bar (item 17)
- [ ] Footer: todos os links href="#" + telefone/e-mail placeholders falsos — validar com SECITECI
- [ ] AdminCategorias: mutations sem onError, sem isPending no botão, dialog fecha antes do resultado (AdminCategorias.tsx:37-60,104)

## 🟠 Médios — Código
- [ ] Remover 324 linhas de JSX comentado (admin/page.tsx:246-569) e ~40 variáveis mortas
- [ ] Migrar admin para TanStack Query (hoje fetch manual com useState + reload)
- [ ] MapView: usar pacote npm `leaflet` via `next/dynamic` (ssr:false) em vez de CDN unpkg em runtime (MapView.tsx:57-85); usar tipos de @types/leaflet (remover `any`)
- [ ] Mover tipos Event/Categoria/Local de app/page.tsx para src/types/ e usar `import type` (acoplamento circular com data.ts e admin)
- [ ] data.ts: extrair helper de fetch para as 13 funções repetidas; renomear/melhorar cancelarEvento (manda status:'rascunho', enganoso)
- [ ] Remover console.log de produção: CalendarView.tsx:125, page.tsx:192, admin/page.tsx:72,86,132
- [ ] Remover `any` explícitos: AuthContext.tsx:87,118; MapView.tsx
- [ ] EventForm (1285 linhas): extrair steps de JSX e geocode/ViaCEP em hooks/componentes; mover fetch externos para data.ts
- [ ] Mover fetch de login/register para data.ts (AuthContext.tsx:65,96)

## 🟠 Médios — A11y
- [ ] aria-label em botões só-ícone: EventDetails.tsx:100-107, MapView.tsx:261-268, EventForm.tsx:546-548
- [ ] Navbar hamburguer: aria-expanded/aria-controls (Navbar.tsx:96-103)
- [ ] Inputs de busca sem aria-label (page.tsx:363-368, AdminEventos.tsx:111-116)
- [ ] Um único h1 por página (Navbar.tsx:46; page.tsx:294,576,591; AdminDashboard.tsx:94,372)
- [ ] EventForm: erros ligados ao input com aria-describedby/aria-invalid (EventForm.tsx:108-120)
- [ ] Paginação com `<a href="#">` que salta âncora — trocar por Button com aria-disabled (page.tsx:498,535,545; admin/page.tsx:244-246)
- [ ] EventCard "Ver detalhes" com ícone Edit + sem aria-label (EventCard.tsx:174-177)

## 🟡 Baixos
- [ ] Deletar arquivos mortos: EventForm2.tsx.backup, ui/*.tsx.del (5), ui/utils.ts (duplicata de lib/utils.ts), styles/globals.css (duplicado), figma/ImageWithFallback.tsx (órfão)
- [ ] 🖥️ Remover export morto getEventosFullQuery (data.ts:15) ou colocá-lo em uso (paginação server-side)
- [ ] Remover deps sem uso: daisyui, recharts, embla-carousel-react, input-otp (avaliar framer-motion)
- [ ] Remover viewMode toggle morto (page.tsx:113 / 371-390) e loading state morto (page.tsx:118)
- [ ] AuthContext: JSON.parse sem guard (:40); register com save-then-login duplicado (:109-115)
- [ ] router.push no lugar de window.location.href (AdminDashboard.tsx:103, Navbar.tsx:70)
- [ ] Usar `data` da query direto em vez de duplicar em useState (page.tsx:144-153)
- [ ] Navbar: usar logo real public/logo-mapasmt-branco.png (Navbar.tsx:41, comentado)
- [ ] Criar .env.example com NEXT_PUBLIC_API_URL documentado
- [ ] EventForm.tsx:291-304: setState duplicado em handleCoordinateChange
- [ ] Hero image next/image com sizes/priority (page.tsx:260-266)
