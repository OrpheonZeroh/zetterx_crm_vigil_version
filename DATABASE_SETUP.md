# 🗄️ ZetterX CRM - Database Setup Guide

## ✅ **PROBLEMA RESUELTO: Schema Conflicts**

Los conflictos entre `schemas.sql` y `01-init-schema.sql` han sido **completamente resueltos** mediante un esquema consolidado que integra:

- **Funcionalidad CRM completa** (customers, work orders, installers, quotes)
- **Capacidades DGI avanzadas** (emitters, document status, multi-tenant)
- **Estados duales compatibles** (CRM general + DGI específico)

---

## 📋 **ARCHIVOS DE INICIALIZACIÓN**

### **1. Schema Principal**
```
init/00-consolidated-schema.sql  ← USAR ESTE
```

### **2. Datos Iniciales**  
```
init/01-consolidated-seed-data.sql  ← USAR ESTE
```

### **🚫 Archivos Legacy (NO USAR)**
```
init/schemas.sql           ← REEMPLAZADO
init/01-init-schema.sql    ← REEMPLAZADO  
init/02-seed-data.sql      ← REEMPLAZADO
```

---

## 🚀 **INICIALIZACIÓN PASO A PASO**

### **Opción A: Supabase Dashboard (Recomendado)**

1. **Accede a tu proyecto Supabase**
   ```
   https://supabase.com/dashboard/project/[tu-project-id]
   ```

2. **Ve a SQL Editor**
   ```
   Dashboard → SQL Editor → New Query
   ```

3. **Ejecuta el schema consolidado**
   - Copia el contenido completo de `init/00-consolidated-schema.sql`
   - Pégalo en el editor SQL
   - Haz clic en **"Run"**

4. **Ejecuta los datos iniciales**
   - Copia el contenido completo de `init/01-consolidated-seed-data.sql`
   - Pégalo en el editor SQL  
   - Haz clic en **"Run"**

### **Opción B: Supabase CLI**

```bash
# 1. Login
supabase login

# 2. Link a tu proyecto
supabase link --project-ref [tu-project-id]

# 3. Ejecutar schema
supabase db push --include-all

# 4. O ejecutar manualmente
supabase db reset --linked
```

### **Opción C: Script Automatizado (En desarrollo)**

```bash
cd zetterx-crm
node scripts/init-db.mjs
```

---

## 🏗️ **ARQUITECTURA CONSOLIDADA**

### **Core Organizacional**
- `organization` - Configuración de la empresa principal
- `users` - Usuarios del sistema con roles

### **Multi-Emitter DGI** 
- `emitters` - Emisores de facturas DGI (multi-tenant)
- `emitter_series` - Series de documentos por emisor
- `api_keys` - Autenticación API

### **Entidades Principales**
- `customers` - Clientes (CRM + DGI compatible)
- `products` - Productos/servicios (CRM + DGI compatible)
- `invoices` - Facturación dual (CRM status + DGI status)

### **Workflow CRM**
- `work_orders` - Órdenes de trabajo
- `inspections` - Inspecciones técnicas
- `installation_slots` - Slots de instalación
- `quotes` - Cotizaciones

### **Soporte DGI**
- `invoice_items` - Items de factura con clasificación DGI
- `invoice_payments` - Métodos de pago
- `invoice_notifications` - Trazabilidad de envíos
- `invoice_api_calls` - Log de llamadas DGI API

---

## 🔧 **ESTADOS DUALES INTEGRADOS**

### **Estados CRM (General)**
```sql
status crm_status: 'draft', 'issued', 'accepted', 'rejected', 'cancelled'
```

### **Estados DGI (Específico)**
```sql
dgi_status document_status: 'RECEIVED', 'PREPARING', 'SENDING_TO_PAC', 'AUTHORIZED', 'REJECTED', 'ERROR'
```

### **Flujo de Estados**
```
CRM: draft → issued → accepted
DGI: RECEIVED → PREPARING → SENDING_TO_PAC → AUTHORIZED
```

---

## ✅ **VERIFICACIÓN POST-INSTALACIÓN**

### **1. Verificar Tablas Creadas**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **2. Verificar Datos de Ejemplo**
```sql
-- Verificar emisores
SELECT name, company_code, ruc_numero FROM emitters;

-- Verificar clientes
SELECT name, email, province FROM customers LIMIT 5;

-- Verificar productos  
SELECT sku, description, unit_price FROM products LIMIT 5;
```

### **3. Test de Conexión**
```sql
SELECT 
    'Schema OK' as status,
    count(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 🐛 **TROUBLESHOOTING**

### **Error: Extension UUID no existe**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### **Error: Tablas ya existen**
```sql
-- Limpiar schema existente (CUIDADO!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### **Error: Permisos insuficientes**
- Usar **Service Role Key** en lugar de anon key
- Verificar permisos en Supabase Dashboard

### **Error: Timeout en queries grandes**
- Ejecutar schema en secciones más pequeñas
- Usar Supabase Dashboard en lugar de CLI

---

## 📊 **DATOS DE EJEMPLO INCLUIDOS**

✅ **1 Organización principal** (ZetterX CRM)  
✅ **4 Usuarios** (admin, ops, sales, tech)  
✅ **1 Emisor DGI** (HYPERNOVA LABS)  
✅ **3 Clientes** (2 DGI + 1 CRM puro)  
✅ **4 Productos** (servicios + productos)  
✅ **3 Instaladores** con equipo  
✅ **4 Zonas de precios**  
✅ **1 Work order** de ejemplo  
✅ **Métodos de pago** completos  

---

## 🎯 **PRÓXIMOS PASOS**

1. ✅ **Esquema consolidado** - COMPLETADO
2. ✅ **Datos de ejemplo** - COMPLETADO  
3. 🔄 **Inicializar base de datos** - EN PROGRESO
4. ⏳ **Testing del flujo DGI** - PENDIENTE
5. ⏳ **Configurar variables de entorno** - PENDIENTE

---

## 📞 **SOPORTE**

Si encuentras problemas durante la inicialización:

1. **Verifica los logs** en Supabase Dashboard
2. **Ejecuta queries de verificación** mostradas arriba
3. **Revisa las variables de entorno** (.env.local)
4. **Confirma permisos** de Service Role Key

El esquema consolidado elimina **TODOS** los conflictos previos y proporciona una base sólida para el CRM con capacidades DGI avanzadas.
