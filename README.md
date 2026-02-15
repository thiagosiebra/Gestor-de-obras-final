# Gestor de Obras - SaaS Multi-Empresa

Sistema de gestión de obras para empresas de pintura y reformas.

## 🚀 Deploy en Vercel

### Configuración Automática
Este proyecto está configurado para desplegarse automáticamente en Vercel.

### Variables de Entorno (Ya configuradas)
Las siguientes variables ya están incluidas en `vercel.json`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Pasos para Deploy

1. **Conectar repositorio a Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Click en "Add New Project"
   - Importa el repositorio `thiagosiebra/gestor-de-obras`

2. **Configuración del proyecto:**
   - Framework Preset: **Next.js**
   - Build Command: `npm run build` (detectado automáticamente)
   - Output Directory: `.next` (detectado automáticamente)
   - Install Command: `npm install` (detectado automáticamente)

3. **Deploy:**
   - Click en "Deploy"
   - Espera 2-3 minutos
   - ¡Listo! Tu aplicación estará en línea

## 📦 Stack Tecnológico

- **Frontend:** Next.js 15 + React 19
- **Backend:** Supabase (BaaS)
- **Estilos:** CSS Modules
- **Hosting:** Vercel

## 🔧 Desarrollo Local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
gestor-de-obras/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Páginas de autenticación
│   │   ├── (dashboard)/     # Dashboard y módulos
│   │   ├── master/          # Panel maestro multi-empresa
│   │   └── page.tsx         # Landing page
│   ├── components/          # Componentes reutilizables
│   └── lib/                 # Utilidades y contexto
├── public/                  # Archivos estáticos
├── vercel.json             # Configuración de Vercel
└── package.json
```

## 🌐 URLs del Sistema

- **Landing:** `/`
- **Login Empresa:** `/login`
- **Dashboard:** `/dashboard`
- **Master Login:** `/master/login`
- **Master Panel:** `/master/empresas`

---

**Desarrollado por Vilanova Pinturas** 🎨
