# 🚀 Zetterx CRM

Un sistema CRM moderno y completo para empresas panameñas, construido con Next.js 14, TypeScript, Tailwind CSS y Supabase.

## ✨ Características

- **Dashboard Moderno** con métricas y KPIs
- **Gestión de Clientes** completa
- **Catálogo de Productos** y servicios
- **Pipeline de Ventas** con estados
- **Sistema de Facturación** DGI
- **Gestión de Inspecciones** y agenda
- **Autenticación** segura con Supabase
- **Diseño Responsive** para todos los dispositivos
- **Colores de Marca** Zetterx

## 🛠️ Tecnologías

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Estado**: React Hooks + Context
- **Formularios**: React Hook Form
- **UI Components**: Radix UI + Headless UI
- **Iconos**: Lucide React
- **Deployment**: Vercel (recomendado)

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Base de datos PostgreSQL

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd zetterx-crm
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.local.example` a `.env.local` y configura:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Database Connection (opcional)
DATABASE_URL=postgresql://usuario:password@host:puerto/database

# App Configuration
NEXT_PUBLIC_APP_NAME=Zetterx CRM
NEXT_PUBLIC_APP_VERSION=1.0.0

# Service Role Key (para operaciones del servidor)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### 4. Configurar Supabase

#### 4.1 Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Copia la URL y anon key

#### 4.2 Ejecutar el esquema SQL
1. Ve a **SQL Editor** en tu proyecto Supabase
2. Copia y pega el contenido de `scripts/setup-database.sql`
3. Ejecuta el script

#### 4.3 Configurar autenticación
1. Ve a **Authentication** → **Settings**
2. Configura tu dominio (localhost:3000 para desarrollo)
3. Habilita **Email confirmations** si lo deseas

### 5. Ejecutar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📚 Estructura del Proyecto

```
zetterx-crm/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── dashboard/          # Dashboard principal
│   │   ├── customers/          # Gestión de clientes
│   │   ├── products/           # Catálogo de productos
│   │   ├── work-orders/        # Órdenes de trabajo
│   │   ├── login/              # Página de login
│   │   └── register/           # Página de registro
│   ├── components/             # Componentes reutilizables
│   │   ├── ui/                 # Componentes base
│   │   ├── layout/             # Layout principal
│   │   ├── dashboard/          # Componentes del dashboard
│   │   └── auth/               # Componentes de autenticación
│   ├── lib/                    # Utilidades y configuraciones
│   │   ├── supabase/           # Configuración de Supabase
│   │   ├── services/           # Servicios de datos
│   │   └── utils.ts            # Utilidades generales
│   └── hooks/                  # Hooks personalizados
├── public/                     # Archivos estáticos
├── scripts/                    # Scripts de base de datos
└── tailwind.config.ts          # Configuración de Tailwind
```

## 🔐 Autenticación

### Crear primer usuario

1. Ve a `/register` en tu aplicación
2. Completa el formulario con tus datos
3. Confirma tu email (si está habilitado)
4. Inicia sesión en `/login`

### Roles de usuario

- **admin**: Acceso completo al sistema
- **ops**: Operaciones y gestión
- **sales**: Ventas y clientes
- **tech**: Técnico e instalaciones
- **viewer**: Solo visualización

## 🎨 Personalización

### Colores de marca

Los colores están definidos en `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    500: '#667eea', // Color principal
    900: '#333366', // Texto oscuro
  }
}
```

### Componentes

Los componentes usan clases CSS personalizadas definidas en `globals.css`:

- `.card` - Tarjetas con sombra
- `.widget` - Widgets del dashboard
- `.stats-card` - Tarjetas de estadísticas
- `.form-input` - Campos de formulario

## 📊 Base de Datos

### Tablas principales

- **organization**: Datos de la empresa
- **users**: Usuarios del sistema
- **customers**: Clientes
- **products**: Productos y servicios
- **work_orders**: Órdenes de trabajo
- **invoices**: Facturas
- **inspections**: Inspecciones

### Esquema completo

Ver `scripts/setup-database.sql` para el esquema completo con:
- Todas las tablas
- Índices optimizados
- Políticas de seguridad (RLS)
- Datos iniciales

## 🚀 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Deploy automático en cada push

### Variables de entorno en producción

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
NEXT_PUBLIC_APP_NAME=Zetterx CRM
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🔧 Desarrollo

### Comandos útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start

# Linting
npm run lint

# Type checking
npm run type-check
```

### Estructura de commits

```
feat: nueva funcionalidad
fix: corrección de bug
style: cambios de estilo
refactor: refactorización de código
docs: documentación
test: pruebas
```

## 📱 Responsive Design

La aplicación está optimizada para:
- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px
- **Mobile**: < 768px

## 🔒 Seguridad

- **Row Level Security (RLS)** habilitado
- **Autenticación** con Supabase Auth
- **Validación** de formularios
- **Sanitización** de datos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

## 🆘 Soporte

Para soporte técnico:
- Email: soporte@zetterx.com
- Documentación: [docs.zetterx.com](https://docs.zetterx.com)
- Issues: [GitHub Issues](https://github.com/tu-usuario/zetterx-crm/issues)

## 🎯 Roadmap

- [ ] Módulo de reportes avanzados
- [ ] Integración con APIs externas
- [ ] Sistema de notificaciones push
- [ ] App móvil nativa
- [ ] Integración con WhatsApp Business
- [ ] Sistema de pagos en línea

---

**Desarrollado con ❤️ por el equipo de Zetterx**
