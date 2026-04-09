# Deploy en Cloudflare Pages

## Estado del proyecto

El frontend ya esta preparado para publicarse en `Cloudflare Pages` como SPA estatica con:

- build de Vite en `dist/`;
- `sourcemap: false` en produccion;
- headers de seguridad en `public/_headers`;
- CSP base en `index.html`;
- `BrowserRouter` compatible con el comportamiento SPA por defecto de Pages.

## Antes de publicar

1. Reejecutar en Supabase el SQL:
   - `supabase/sql/2026-04-09-admin-approval-and-mfa.sql`
2. Confirmar que existe al menos una cuenta con:
   - `role = 'superadmin'`
   - `approval_status = 'approved'`
3. Confirmar que las variables de entorno de produccion existen en Cloudflare Pages:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

## Configuracion recomendada en Cloudflare Pages

### Opcion 1: Git integration en dashboard

En `Workers & Pages > Create application > Pages > Connect to Git` usar:

- Framework preset: `React (Vite)` o manual equivalente.
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: dejar vacio si el repo publicado es solo `estadistica-web`; si es monorepo, apuntar a la carpeta correcta.

Con esta opcion, Cloudflare detecta automaticamente cada push a `main` si esa rama esta marcada como rama de produccion.

### Opcion 2: GitHub Actions + Cloudflare Pages

El repo ya incluye el workflow:

- `.github/workflows/deploy-cloudflare-pages.yml`

Este workflow despliega automaticamente a Cloudflare Pages cada vez que hay push a `main`.

#### Secrets de GitHub requeridos

En `GitHub > Settings > Secrets and variables > Actions` crear:

- Secret `CLOUDFLARE_API_TOKEN`
- Secret `CLOUDFLARE_ACCOUNT_ID`
- Secret `VITE_SUPABASE_URL`
- Secret `VITE_SUPABASE_PUBLISHABLE_KEY`

#### Variable de GitHub requerida

En `GitHub > Settings > Secrets and variables > Actions > Variables` crear:

- Variable `CLOUDFLARE_PAGES_PROJECT_NAME`

Debe contener exactamente el nombre del proyecto de Pages.

#### Nota importante

Si usaras este workflow como mecanismo principal de despliegue, te conviene:

1. crear el proyecto Pages una sola vez en Cloudflare;
2. dejar que GitHub Actions haga los despliegues siguientes a `main`.

### Variables de entorno

Configurar en:

- `Settings > Environment variables > Production`
- `Settings > Environment variables > Preview`

Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Archivos importantes para Pages

- `public/_headers`
  - aplica headers de seguridad a respuestas estaticas.
- `index.html`
  - contiene CSP base.

## Checklist post-deploy

1. Abrir la URL `*.pages.dev`.
2. Confirmar que una ruta interna directa funciona:
   - `/dashboard`
   - `/anova`
   - `/chi-square`
   - `/admin`
3. Confirmar en DevTools > Network que se reciben:
   - `Content-Security-Policy`
   - `X-Content-Type-Options`
   - `X-Frame-Options`
   - `Referrer-Policy`
   - `Permissions-Policy`
4. Validar con cuentas reales:
   - usuario nuevo `pending`
   - usuario aprobado
   - usuario rechazado
   - admin con MFA
   - superadmin gestionando admins
5. Confirmar que el ultimo admin no puede eliminarse ni degradarse.

## No olvidar

- No subir `.env.local`.
- Si alguna clave fue expuesta historicamente, rotarla antes de abrir el sistema a terceros.
- Revisar el riesgo abierto de `xlsx` y `xlsx-js-style` antes de considerar el release como completamente listo para produccion.
