# Setup — Mapa PDVs Mobil × Mad4Performance

## Modo rápido (sin Supabase)
La app funciona inmediatamente con los 61 PDVs del Excel cargados localmente.
Solo ejecuta:
```bash
npm run dev
```
Abre http://localhost:5173 — el mapa ya funciona.

---

## Modo producción (con Supabase — recomendado)

### 1. Crear proyecto Supabase
1. Ve a https://app.supabase.com → New Project
2. Nombre: `mobil-pdv-map` | Región: más cercana a Venezuela (us-east-1)
3. Guarda la contraseña de la base de datos

### 2. Configurar la base de datos
En Supabase Dashboard → SQL Editor → New Query:
1. Pega el contenido de `supabase/schema.sql` → Run
2. Pega el contenido de `supabase/policies.sql` → Run
3. Pega el contenido de `supabase/seed.sql` → Run (carga los 61 PDVs)

### 3. Obtener credenciales
Settings → API:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public key** → `VITE_SUPABASE_ANON_KEY`

### 4. Crear archivo .env
```bash
cp .env.example .env
# Edita .env con tus valores reales
```

### 5. Crear usuario administrador
En Supabase Dashboard → Authentication → Users → Invite user:
- Email: `admin@mad4performance.com`
- El usuario recibirá un email para crear su contraseña

---

## Deploy en Vercel
```bash
# 1. Sube el código a GitHub
# 2. Conecta el repo en vercel.com
# 3. En Environment Variables añade:
#    VITE_SUPABASE_URL=...
#    VITE_SUPABASE_ANON_KEY=...
# 4. Deploy ✓
```

---

## Estructura del proyecto
```
pdv-map/
├── src/
│   ├── pages/
│   │   ├── MapPage.tsx          ← Mapa principal
│   │   ├── PDVDetailPage.tsx    ← Página de verificación QR (/pdv/:slug)
│   │   └── admin/
│   │       ├── LoginPage.tsx    ← Login admin
│   │       └── DashboardPage.tsx ← Panel de control
│   ├── components/
│   │   ├── map/                 ← MapView, PDVPopup
│   │   ├── sidebar/             ← Sidebar, PDVCard, búsqueda, filtros
│   │   ├── admin/               ← PDVForm, CSVImport
│   │   └── layout/              ← Header, Banner
│   ├── data/pdvs-seed.ts       ← 61 PDVs del Excel (fallback local)
│   └── lib/
│       ├── supabase.ts          ← Cliente Supabase
│       └── geo.ts               ← Cálculos de distancia, URLs
├── supabase/
│   ├── schema.sql              ← Tablas y triggers
│   ├── policies.sql            ← Row Level Security
│   └── seed.sql                ← Datos iniciales (61 PDVs)
└── public/
    ├── mobil-logo.png
    └── mad4performance-logo.png
```

## URLs del sistema
| URL | Descripción |
|-----|-------------|
| `/` | Mapa público con todos los PDVs |
| `/pdv/royal-autorama` | Página de verificación QR de un PDV |
| `/admin` | Redirige a login |
| `/admin/login` | Login de administrador |
| `/admin/dashboard` | Panel de control (requiere auth) |
