-- =========================================================
-- ZETTERX CRM - MANUFACTURING SCHEMA (SINGLE TENANT)
-- Esquema simplificado para manufactura de vidrio templado y aluminio
-- =========================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- TIPOS ENUMERADOS
-- =========================================================

-- Estados de work orders
CREATE TYPE work_order_status AS ENUM (
    'lead', 'quoted', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled'
);

-- Estados de installation slots
CREATE TYPE slot_status AS ENUM (
    'scheduled', 'confirmed', 'in_progress', 'done', 'no_show', 'cancelled'
);

-- Roles de usuario
CREATE TYPE user_role AS ENUM (
    'admin', 'sales', 'production', 'installer', 'viewer'
);

-- Estados de facturas (CRM + DGI)
CREATE TYPE invoice_status AS ENUM (
    'draft', 'issued', 'dgi_sent', 'dgi_authorized', 'dgi_rejected', 'paid', 'cancelled'
);

-- Estados de email
CREATE TYPE email_status AS ENUM (
    'pending', 'sent', 'failed', 'retrying'
);

-- Tipos de producto
CREATE TYPE product_category AS ENUM (
    'window', 'door', 'glass_panel', 'aluminum_profile', 'hardware', 'service', 'installation'
);

-- =========================================================
-- CONFIGURACIÓN DE LA EMPRESA
-- =========================================================

-- Información de la empresa (single record)
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    
    -- Información fiscal DGI
    ruc_tipo TEXT NOT NULL DEFAULT '2',
    ruc_numero TEXT NOT NULL,
    ruc_dv TEXT NOT NULL,
    branch_code TEXT NOT NULL DEFAULT '001',
    
    -- Contacto
    phone TEXT,
    email TEXT,
    address_line TEXT,
    city TEXT DEFAULT 'PANAMA',
    province TEXT DEFAULT 'PANAMA',
    
    -- Configuración DGI
    dgi_environment INTEGER NOT NULL DEFAULT 1, -- 1=prod, 2=test
    pac_api_key TEXT,
    pac_subscription_key TEXT,
    
    -- Branding
    logo_url TEXT,
    primary_color TEXT DEFAULT '#0F172A',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usuarios del sistema
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- CLIENTES
-- =========================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Información básica
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    
    -- Dirección
    address_line TEXT,
    city TEXT,
    province TEXT,
    district TEXT,
    corregimiento TEXT,
    
    -- Información fiscal (para DGI)
    tax_id_type TEXT, -- 'CEDULA', 'RUC', 'PASSPORT'
    tax_id TEXT,
    
    -- Metadatos
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_tax_id ON customers(tax_id) WHERE tax_id IS NOT NULL;

-- =========================================================
-- PRODUCTOS MANUFACTURA
-- =========================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificación
    code TEXT UNIQUE NOT NULL, -- SKU interno
    name TEXT NOT NULL,
    description TEXT,
    category product_category NOT NULL,
    
    -- Especificaciones técnicas
    width_mm NUMERIC(8,2), -- Ancho en milímetros
    height_mm NUMERIC(8,2), -- Alto en milímetros
    thickness_mm NUMERIC(6,2), -- Grosor en milímetros
    
    -- Material principal
    primary_material TEXT, -- 'Aluminum', 'Tempered Glass', 'Hardware'
    finish TEXT, -- 'Natural', 'White', 'Bronze', 'Black'
    
    -- Precios
    unit_price NUMERIC(12,2) NOT NULL,
    cost_price NUMERIC(12,2), -- Costo de materiales
    
    -- Impuestos DGI
    itbms_rate NUMERIC(5,2) NOT NULL DEFAULT 7.00,
    
    -- Tiempo de producción
    production_days INTEGER DEFAULT 0, -- Días de fabricación
    
    -- Metadatos
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_code ON products(code);

-- =========================================================
-- INSTALADORES Y EQUIPOS
-- =========================================================

CREATE TABLE installers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    specialties TEXT[], -- ['windows', 'doors', 'glass_panels']
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE installer_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    max_concurrent_jobs INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE installer_team_members (
    team_id UUID NOT NULL REFERENCES installer_teams(id) ON DELETE CASCADE,
    installer_id UUID NOT NULL REFERENCES installers(id) ON DELETE CASCADE,
    is_lead BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (team_id, installer_id)
);

-- =========================================================
-- ÓRDENES DE TRABAJO
-- =========================================================

CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- Información básica
    title TEXT NOT NULL,
    status work_order_status NOT NULL DEFAULT 'lead',
    
    -- Ubicación de instalación
    installation_address TEXT,
    installation_city TEXT,
    installation_province TEXT,
    
    -- Estimaciones
    estimated_value NUMERIC(12,2),
    estimated_production_days INTEGER DEFAULT 7,
    estimated_installation_days INTEGER DEFAULT 1,
    
    -- Fechas importantes
    target_delivery_date DATE,
    
    -- Notas y observaciones
    notes TEXT,
    special_requirements TEXT,
    
    -- Tracking
    created_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id), -- Vendedor responsable
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_work_orders_customer ON work_orders(customer_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_assigned ON work_orders(assigned_to);

-- =========================================================
-- COTIZACIONES
-- =========================================================

CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    
    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL CHECK (status IN ('draft','sent','approved','rejected','expired')),
    
    -- Totales
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    itbms_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    
    -- Términos
    validity_days INTEGER DEFAULT 30,
    payment_terms TEXT DEFAULT 'Net 30',
    delivery_terms TEXT,
    
    -- Notas
    notes TEXT,
    internal_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    
    -- Referencia al producto
    product_id UUID REFERENCES products(id),
    
    -- Override de información (para productos personalizados)
    item_code TEXT,
    description TEXT NOT NULL,
    
    -- Especificaciones personalizadas
    custom_width_mm NUMERIC(8,2),
    custom_height_mm NUMERIC(8,2),
    custom_specifications TEXT,
    
    -- Cantidades y precios
    quantity NUMERIC(12,3) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    discount_percentage NUMERIC(5,2) DEFAULT 0.00,
    line_total NUMERIC(12,2) NOT NULL,
    
    -- Tiempos
    production_days INTEGER,
    
    -- Orden de visualización
    sort_order INTEGER DEFAULT 0
);

-- =========================================================
-- PRODUCCIÓN Y FABRICACIÓN
-- =========================================================

CREATE TABLE production_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    quote_id UUID REFERENCES quotes(id),
    
    -- Información básica
    production_number TEXT UNIQUE, -- P-2024-0001
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_production','quality_check','ready','shipped')),
    
    -- Fechas
    start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE,
    
    -- Responsable de producción
    production_manager_id UUID REFERENCES users(id),
    
    -- Notas de producción
    production_notes TEXT,
    quality_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items específicos de producción
CREATE TABLE production_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
    quote_item_id UUID REFERENCES quote_items(id),
    
    -- Especificaciones finales
    final_width_mm NUMERIC(8,2),
    final_height_mm NUMERIC(8,2),
    final_specifications TEXT,
    
    -- Status individual
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','cutting','assembly','quality_check','completed')),
    
    -- Tracking de tiempo
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- =========================================================
-- INSTALACIONES
-- =========================================================

CREATE TABLE installation_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    team_id UUID REFERENCES installer_teams(id),
    
    -- Programación
    scheduled_date DATE NOT NULL,
    start_time TIME,
    estimated_hours NUMERIC(4,2) DEFAULT 8.0,
    
    -- Status
    status slot_status NOT NULL DEFAULT 'scheduled',
    
    -- Resultados
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    completion_notes TEXT,
    customer_signature_url TEXT, -- URL a imagen de firma
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_installation_slots_date ON installation_slots(scheduled_date);
CREATE INDEX idx_installation_slots_team ON installation_slots(team_id);

-- =========================================================
-- FACTURACIÓN
-- =========================================================

-- Métodos de pago
CREATE TABLE payment_methods (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Facturas
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID REFERENCES work_orders(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- Numeración
    invoice_number TEXT UNIQUE, -- F-2024-0001
    
    -- Estados
    status invoice_status NOT NULL DEFAULT 'draft',
    email_status email_status NOT NULL DEFAULT 'pending',
    
    -- Fechas
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- Totales
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    itbms_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    
    -- Información DGI (cuando se envíe)
    dgi_cufe TEXT, -- Código único de facturación electrónica
    dgi_qr_url TEXT,
    dgi_xml_response TEXT,
    dgi_sent_at TIMESTAMPTZ,
    dgi_authorized_at TIMESTAMPTZ,
    
    -- Metadatos
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);

-- Items de factura
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Referencia opcional al item de cotización
    quote_item_id UUID REFERENCES quote_items(id),
    
    -- Información del item
    description TEXT NOT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    discount_percentage NUMERIC(5,2) DEFAULT 0.00,
    
    -- Totales calculados
    line_subtotal NUMERIC(12,2) NOT NULL,
    line_discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    line_itbms NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(12,2) NOT NULL,
    
    -- Orden
    sort_order INTEGER DEFAULT 0
);

-- Pagos de factura
CREATE TABLE invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Información del pago
    payment_method_code TEXT NOT NULL REFERENCES payment_methods(code),
    amount NUMERIC(12,2) NOT NULL,
    reference_number TEXT,
    
    -- Fechas
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- REPORTES Y KPIs
-- =========================================================

-- Metas de ventas mensuales
CREATE TABLE sales_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    target_amount NUMERIC(12,2) NOT NULL,
    target_orders INTEGER,
    UNIQUE(year, month)
);

-- =========================================================
-- DATOS INICIALES
-- =========================================================

-- Insertar métodos de pago estándar de Panamá
INSERT INTO payment_methods (code, description) VALUES 
('01', 'Efectivo'),
('02', 'Tarjeta de Crédito'),
('03', 'Tarjeta de Débito'),
('04', 'Transferencia Bancaria'),
('05', 'Cheque'),
('08', 'Crédito');
