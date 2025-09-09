-- =========================================================
-- ZETTERX CRM - CLEAN CONSOLIDATED SCHEMA
-- Versión simplificada que funciona sin errores
-- =========================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================  
-- TIPOS ENUMERADOS
-- =========================================================

-- Estados de documentos DGI
DO $$ BEGIN
    CREATE TYPE document_status AS ENUM (
        'RECEIVED', 'PREPARING', 'SENDING_TO_PAC', 'AUTHORIZED', 'REJECTED', 'ERROR'
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

-- Roles de usuario
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin', 'ops', 'sales', 'tech', 'viewer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =========================================================
-- TABLAS PRINCIPALES
-- =========================================================

-- Organización
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
    city TEXT,
    province TEXT,
    dgi_environment INTEGER DEFAULT 1,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#2563EB',
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

-- Emisores DGI
CREATE TABLE IF NOT EXISTS emitters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    ruc_tipo VARCHAR(10) NOT NULL,
    ruc_numero VARCHAR(20) NOT NULL,
    ruc_dv VARCHAR(5) NOT NULL,
    branch_code VARCHAR(10) NOT NULL DEFAULT '001',
    address_line TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    dgi_subscription_key TEXT,
    dgi_client_key TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address_line TEXT,
    city TEXT,
    province TEXT,
    district TEXT,
    corregimiento TEXT,
    tax_id_type TEXT,
    tax_id TEXT,
    country_code TEXT DEFAULT 'PA',
    ubi_code TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Productos
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    cost NUMERIC(12,2),
    unit_code VARCHAR(10) DEFAULT 'UND',
    itbms_rate NUMERIC(5,2) DEFAULT 0.07,
    category VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Instaladores
CREATE TABLE IF NOT EXISTS installers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    specialties TEXT,
    certification_level TEXT DEFAULT 'BASIC',
    hourly_rate NUMERIC(8,2) DEFAULT 15.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Equipos de instalación
CREATE TABLE IF NOT EXISTS installer_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    lead_installer_id UUID REFERENCES installers(id),
    max_concurrent_jobs INTEGER DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Miembros de equipos
CREATE TABLE IF NOT EXISTS installer_team_members (
    team_id UUID NOT NULL REFERENCES installer_teams(id) ON DELETE CASCADE,
    installer_id UUID NOT NULL REFERENCES installers(id) ON DELETE CASCADE,
    is_lead BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, installer_id)
);

-- Zonas de precio
CREATE TABLE IF NOT EXISTS price_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    multiplier NUMERIC(5,2) DEFAULT 1.00,
    delivery_days INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    title TEXT NOT NULL,
    status work_order_status NOT NULL DEFAULT 'lead',
    estimated_value NUMERIC(12,2),
    address_line TEXT,
    city TEXT,
    province TEXT,
    district TEXT,
    corregimiento TEXT,
    ubi_code TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Métodos de pago
CREATE TABLE IF NOT EXISTS payment_methods (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL
);

-- Facturas
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID REFERENCES work_orders(id),
    customer_id UUID REFERENCES customers(id),
    env_code INTEGER NOT NULL DEFAULT 1,
    emission_type VARCHAR(10) DEFAULT '01',
    doc_type VARCHAR(10) DEFAULT '01',
    doc_number VARCHAR(50) NOT NULL,
    pos_code VARCHAR(10),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    exit_date DATE,
    
    -- Emisor data
    emis_name TEXT,
    emis_branch TEXT,
    emis_coords TEXT,
    emis_address TEXT,
    emis_ruc_tipo VARCHAR(10),
    emis_ruc_num VARCHAR(20),
    emis_ruc_dv VARCHAR(5),
    
    -- Receptor data
    rec_type VARCHAR(10),
    rec_name TEXT,
    rec_address TEXT,
    rec_country VARCHAR(10),
    rec_phone TEXT,
    rec_email TEXT,
    
    -- Totales
    total_net NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_itbms NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_gravado NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_received NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    items_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    
    status crm_status NOT NULL DEFAULT 'draft',
    
    -- DGI fields
    cufe TEXT,
    dgi_protocol TEXT,
    dgi_status TEXT,
    dgi_message TEXT,
    qr_url TEXT,
    validation_url TEXT,
    dgi_data JSONB,
    
    -- Email fields
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    email_address TEXT,
    invoice_number TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items de factura
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_seq INTEGER NOT NULL,
    product_code TEXT,
    description TEXT NOT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    clas_sabr TEXT,
    clas_cmp TEXT,
    unit_price NUMERIC(12,2) NOT NULL,
    unit_discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    line_price NUMERIC(12,2) NOT NULL,
    line_total NUMERIC(12,2) NOT NULL,
    itbms_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    itbms_value NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

-- Pagos de factura
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    method_code TEXT NOT NULL REFERENCES payment_methods(code),
    amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Metas semanales
CREATE TABLE IF NOT EXISTS weekly_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    year INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    target_amount NUMERIC(12,2) NOT NULL DEFAULT 3000.00,
    target_orders INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- ÍNDICES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_customers_emitter ON customers(emitter_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_products_emitter ON products(emitter_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer ON work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- =========================================================
-- DATOS INICIALES
-- =========================================================

-- Métodos de pago estándar de Panamá
INSERT INTO payment_methods (code, description) VALUES 
('01', 'Efectivo'),
('02', 'Tarjeta de Crédito'),
('03', 'Tarjeta de Débito'),
('04', 'Transferencia Bancaria'),
('05', 'Cheque'),
('08', 'Crédito')
ON CONFLICT (code) DO NOTHING;
