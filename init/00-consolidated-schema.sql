-- =========================================================
-- ZETTERX CRM - CONSOLIDATED SCHEMA 
-- Integra funcionalidad general del CRM + capacidades DGI
-- =========================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- TIPOS ENUMERADOS CONSOLIDADOS
-- =========================================================

-- Estados de documentos DGI
DO $$ BEGIN
    CREATE TYPE document_status AS ENUM (
        'RECEIVED', 'PREPARING', 'SENDING_TO_PAC', 'AUTHORIZED', 'REJECTED', 'ERROR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Estados de email
DO $$ BEGIN
    CREATE TYPE email_status AS ENUM (
        'PENDING', 'SENT', 'FAILED', 'RETRYING'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipos de documento DGI
DO $$ BEGIN
    CREATE TYPE document_type AS ENUM (
        'invoice', 'import_invoice', 'export_invoice', 'credit_note', 'debit_note', 
        'zone_franca', 'reembolso', 'foreign_invoice'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Estados generales para CRM
DO $$ BEGIN
    CREATE TYPE crm_status AS ENUM (
        'draft', 'issued', 'accepted', 'rejected', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Estados de work orders
DO $$ BEGIN
    CREATE TYPE work_order_status AS ENUM (
        'lead', 'quoted', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Estados de installation slots
DO $$ BEGIN
    CREATE TYPE slot_status AS ENUM (
        'scheduled', 'confirmed', 'in_progress', 'done', 'no_show', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Roles de usuario
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin', 'ops', 'sales', 'tech', 'viewer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =========================================================
-- CORE ORGANIZACIONAL 
-- =========================================================

-- Organización principal (single-tenant por proyecto)
CREATE TABLE IF NOT EXISTS organization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    ruc_tipo TEXT,
    ruc_numero TEXT,
    ruc_dv TEXT,
    branch_code TEXT DEFAULT '001',
    phone TEXT,
    email TEXT,
    address_line TEXT,
    ubi_code TEXT,
    province TEXT,
    district TEXT,
    corregimiento TEXT,
    coords TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- EMISORES DGI (Multi-emitter support)
-- =========================================================

CREATE TABLE IF NOT EXISTS emitters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company_code VARCHAR(10) UNIQUE NOT NULL,
    ruc_tipo VARCHAR(1) NOT NULL CHECK (ruc_tipo IN ('1', '2', '3')),
    ruc_numero VARCHAR(20) NOT NULL,
    ruc_dv VARCHAR(2) NOT NULL,
    suc_em VARCHAR(4) NOT NULL DEFAULT '0001',
    pto_fac_default VARCHAR(3) NOT NULL DEFAULT '001',
    iamb INTEGER NOT NULL DEFAULT 1 CHECK (iamb IN (1, 2)),
    itpemis_default VARCHAR(2) NOT NULL DEFAULT '01',
    idoc_default VARCHAR(2) NOT NULL DEFAULT '01',
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address_line TEXT,
    ubi_code VARCHAR(10),
    brand_logo_url TEXT,
    brand_primary_color VARCHAR(7),
    brand_footer_html TEXT,
    pac_api_key TEXT NOT NULL,
    pac_subscription_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(ruc_tipo, ruc_numero, ruc_dv, suc_em)
);

-- Series de documentos por emisor
CREATE TABLE IF NOT EXISTS emitter_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emitter_id UUID NOT NULL REFERENCES emitters(id) ON DELETE CASCADE,
    pto_fac_df VARCHAR(3) NOT NULL,
    doc_kind document_type NOT NULL,
    next_number INTEGER NOT NULL DEFAULT 1,
    issued_count INTEGER NOT NULL DEFAULT 0,
    authorized_count INTEGER NOT NULL DEFAULT 0,
    rejected_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(emitter_id, pto_fac_df, doc_kind)
);

-- API keys para integración
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emitter_id UUID REFERENCES emitters(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    rate_limit_per_min INTEGER NOT NULL DEFAULT 120,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- =========================================================
-- CLIENTES CONSOLIDADOS
-- =========================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Soporte multi-emitter para DGI (opcional)
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    
    -- Campos básicos
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address_line TEXT,
    
    -- Campos geográficos
    country_code TEXT DEFAULT 'PA',
    ubi_code TEXT,
    province TEXT,
    district TEXT,
    corregimiento TEXT,
    
    -- Identificación fiscal
    tax_id_type TEXT,
    tax_id TEXT,
    
    -- Metadatos
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: email único por emitter (si tiene emitter)
    UNIQUE(emitter_id, email)
);

-- Agregar columnas faltantes a customers si no existen
DO $$ 
BEGIN
    -- Agregar emitter_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'emitter_id') THEN
        ALTER TABLE customers ADD COLUMN emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL;
    END IF;
    
    -- Agregar otras columnas DGI si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'tax_id_type') THEN
        ALTER TABLE customers ADD COLUMN tax_id_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'tax_id') THEN
        ALTER TABLE customers ADD COLUMN tax_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'ubi_code') THEN
        ALTER TABLE customers ADD COLUMN ubi_code TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'country_code') THEN
        ALTER TABLE customers ADD COLUMN country_code TEXT DEFAULT 'PA';
    END IF;
END $$;

-- Índices para customers (crear solo si no existen)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_emitter') THEN
        CREATE INDEX idx_customers_emitter ON customers(emitter_id) WHERE emitter_id IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_email') THEN
        CREATE INDEX idx_customers_email ON customers(email) WHERE email IS NOT NULL;
    END IF;
END $$;

-- =========================================================
-- PRODUCTOS CONSOLIDADOS
-- =========================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Soporte multi-emitter para DGI (opcional)  
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    
    -- Identificadores
    code TEXT, -- Código general (sku)
    sku TEXT, -- Para compatibilidad DGI
    description TEXT NOT NULL,
    
    -- Clasificación DGI
    cpbs_abr VARCHAR(2),
    cpbs_cmp VARCHAR(4),
    
    -- Precios e impuestos
    unit_price NUMERIC(15,2) NOT NULL,
    itbms_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    tax_rate VARCHAR(2) NOT NULL DEFAULT '00',
    
    -- Tipo
    is_service BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Metadatos
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(emitter_id, sku)
);

-- Agregar columnas faltantes a products si no existen
DO $$ 
BEGIN
    -- Agregar emitter_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'emitter_id') THEN
        ALTER TABLE products ADD COLUMN emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL;
    END IF;
    
    -- Agregar columnas DGI si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'sku') THEN
        ALTER TABLE products ADD COLUMN sku TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'cpbs_abr') THEN
        ALTER TABLE products ADD COLUMN cpbs_abr VARCHAR(2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'cpbs_cmp') THEN
        ALTER TABLE products ADD COLUMN cpbs_cmp VARCHAR(4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'tax_rate') THEN
        ALTER TABLE products ADD COLUMN tax_rate VARCHAR(2) NOT NULL DEFAULT '00';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'code') THEN
        ALTER TABLE products ADD COLUMN code TEXT;
    END IF;
END $$;

-- Índices para products (crear solo si no existen)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_emitter') THEN
        CREATE INDEX idx_products_emitter ON products(emitter_id) WHERE emitter_id IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_code') THEN
        CREATE INDEX idx_products_code ON products(code) WHERE code IS NOT NULL;
    END IF;
END $$;

-- =========================================================
-- ZONAS DE PRECIOS
-- =========================================================

CREATE TABLE IF NOT EXISTS price_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    province TEXT NOT NULL,
    district TEXT NOT NULL,
    corregimiento TEXT NOT NULL,
    price_min NUMERIC(12,2) NOT NULL,
    price_max NUMERIC(12,2) NOT NULL,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    CHECK (price_max >= price_min)
);

CREATE INDEX idx_price_zones_location ON price_zones (province, district, corregimiento);

-- =========================================================
-- INSTALADORES Y EQUIPOS
-- =========================================================

CREATE TABLE IF NOT EXISTS installers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS installer_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS installer_team_members (
    team_id UUID NOT NULL REFERENCES installer_teams(id) ON DELETE CASCADE,
    installer_id UUID NOT NULL REFERENCES installers(id) ON DELETE CASCADE,
    is_lead BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (team_id, installer_id)
);

-- =========================================================
-- ÓRDENES DE TRABAJO
-- =========================================================

CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    title TEXT NOT NULL,
    status work_order_status NOT NULL DEFAULT 'lead',
    estimated_value NUMERIC(12,2),
    
    -- Ubicación
    address_line TEXT,
    province TEXT,
    district TEXT,
    corregimiento TEXT,
    ubi_code TEXT,
    
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inspecciones
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    inspector_id UUID REFERENCES users(id),
    price_zone_id UUID REFERENCES price_zones(id),
    quoted_min NUMERIC(12,2),
    quoted_max NUMERIC(12,2),
    notes TEXT,
    photos_urls TEXT[],
    result TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Slots de instalación
CREATE TABLE IF NOT EXISTS installation_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    team_id UUID REFERENCES installer_teams(id),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status slot_status NOT NULL DEFAULT 'scheduled',
    cost_estimate NUMERIC(12,2),
    notes TEXT,
    UNIQUE (work_order_id, start_at)
);

-- =========================================================
-- FACTURACIÓN CONSOLIDADA
-- =========================================================

-- Métodos de pago
CREATE TABLE IF NOT EXISTS payment_methods (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL
);

-- Facturas principales (consolidado CRM + DGI)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Referencias principales
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    series_id UUID REFERENCES emitter_series(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    work_order_id UUID REFERENCES work_orders(id),
    
    -- Información del documento
    doc_kind document_type,
    d_nrodf VARCHAR(10),
    d_ptofacdf VARCHAR(3),
    
    -- Estados duales
    status crm_status NOT NULL DEFAULT 'draft', -- Estado CRM general
    dgi_status document_status, -- Estado específico DGI
    email_status email_status NOT NULL DEFAULT 'PENDING',
    
    -- Fechas
    issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exit_date TIMESTAMPTZ,
    
    -- Campos DGI específicos
    env_code INT,
    emission_type TEXT,
    pos_code TEXT,
    cufe VARCHAR(255),
    url_cufe TEXT,
    xml_in TEXT,
    xml_response TEXT,
    xml_fe TEXT,
    
    -- Totales
    total_net NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_itbms NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_received NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    num_items INT,
    
    -- Metadatos
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agregar columnas faltantes a invoices si no existen
DO $$ 
BEGIN
    -- Agregar columnas DGI si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'emitter_id') THEN
        ALTER TABLE invoices ADD COLUMN emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'series_id') THEN
        ALTER TABLE invoices ADD COLUMN series_id UUID REFERENCES emitter_series(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'work_order_id') THEN
        ALTER TABLE invoices ADD COLUMN work_order_id UUID REFERENCES work_orders(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'doc_kind') THEN
        ALTER TABLE invoices ADD COLUMN doc_kind document_type;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'dgi_status') THEN
        ALTER TABLE invoices ADD COLUMN dgi_status document_status;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'd_nrodf') THEN
        ALTER TABLE invoices ADD COLUMN d_nrodf VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'd_ptofacdf') THEN
        ALTER TABLE invoices ADD COLUMN d_ptofacdf VARCHAR(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'cufe') THEN
        ALTER TABLE invoices ADD COLUMN cufe VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'url_cufe') THEN
        ALTER TABLE invoices ADD COLUMN url_cufe TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'xml_in') THEN
        ALTER TABLE invoices ADD COLUMN xml_in TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'xml_response') THEN
        ALTER TABLE invoices ADD COLUMN xml_response TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'xml_fe') THEN
        ALTER TABLE invoices ADD COLUMN xml_fe TEXT;
    END IF;
END $$;

-- Índices para invoices (crear solo si no existen)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_emitter') THEN
        CREATE INDEX idx_invoices_emitter ON invoices(emitter_id) WHERE emitter_id IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_customer') THEN
        CREATE INDEX idx_invoices_customer ON invoices(customer_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_work_order') THEN
        CREATE INDEX idx_invoices_work_order ON invoices(work_order_id) WHERE work_order_id IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_issue_date') THEN
        CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_dgi_status') THEN
        CREATE INDEX idx_invoices_dgi_status ON invoices(dgi_status) WHERE dgi_status IS NOT NULL;
    END IF;
END $$;

-- Items de factura
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_seq INT NOT NULL,
    product_code TEXT,
    description TEXT NOT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    
    -- Clasificación DGI
    clas_sabr TEXT,
    clas_cmp TEXT,
    
    -- Precios
    unit_price NUMERIC(12,2) NOT NULL,
    unit_discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    line_price NUMERIC(12,2) NOT NULL,
    line_total NUMERIC(12,2) NOT NULL,
    
    -- Impuestos
    itbms_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    itbms_value NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

CREATE UNIQUE INDEX idx_invoice_items_seq ON invoice_items (invoice_id, line_seq);

-- Pagos de factura
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    method_code TEXT NOT NULL REFERENCES payment_methods(code),
    amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notificaciones de factura
CREATE TABLE IF NOT EXISTS invoice_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'Email',
    receiver_name TEXT,
    receiver_email TEXT,
    status email_status NOT NULL DEFAULT 'PENDING',
    provider_msg_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trazabilidad API DGI
CREATE TABLE IF NOT EXISTS invoice_api_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'POST',
    used_credential TEXT,
    request_payload JSONB NOT NULL,
    response_payload JSONB,
    http_status INT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','error')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- COTIZACIONES
-- =========================================================

CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL CHECK (status IN ('draft','sent','approved','rejected','expired')),
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    itbms_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    line_seq INT NOT NULL,
    product_code TEXT,
    description TEXT NOT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    itbms_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(12,2) NOT NULL
);

CREATE UNIQUE INDEX idx_quote_items_seq ON quote_items (quote_id, line_seq);

-- =========================================================
-- METAS Y PERFORMANCE
-- =========================================================

CREATE TABLE IF NOT EXISTS weekly_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_start DATE NOT NULL,
    amount_target NUMERIC(12,2) NOT NULL DEFAULT 3000.00,
    UNIQUE (week_start)
);

-- =========================================================
-- DATOS INICIALES
-- =========================================================

-- Insertar métodos de pago (solo si no existen)
INSERT INTO payment_methods (code, description) VALUES 
('01', 'Efectivo'),
('02', 'Tarjeta de Crédito'),
('03', 'Tarjeta de Débito'),
('04', 'Transferencia Bancaria'),
('05', 'Cheque'),
('06', 'Compensación'),
('07', 'Permuta'),
('08', 'Venta a crédito'),
('09', 'Tarjeta prepago'),
('10', 'Método mixto')
ON CONFLICT (code) DO NOTHING;
