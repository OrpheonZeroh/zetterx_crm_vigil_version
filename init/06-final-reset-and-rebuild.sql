-- =========================================================
-- RESET COMPLETO Y RECONSTRUCCIÓN 
-- Este script hace todo de una vez: borra y recrea limpio
-- =========================================================

-- PASO 1: Limpiar todo
DROP TABLE IF EXISTS weekly_targets CASCADE;
DROP TABLE IF EXISTS invoice_payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS installation_slots CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS quote_items CASCADE;
DROP TABLE IF EXISTS price_zones CASCADE;
DROP TABLE IF EXISTS installer_team_members CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS installer_teams CASCADE;
DROP TABLE IF EXISTS installers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS emitters CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organization CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;

-- Borrar enums
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS work_order_status CASCADE;
DROP TYPE IF EXISTS crm_status CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS slot_status CASCADE;

-- PASO 2: Recrear estructura completa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE document_status AS ENUM (
    'RECEIVED', 'PREPARING', 'SENDING_TO_PAC', 'AUTHORIZED', 'REJECTED', 'ERROR'
);

CREATE TYPE work_order_status AS ENUM (
    'lead', 'quoted', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled'
);

CREATE TYPE crm_status AS ENUM (
    'draft', 'issued', 'accepted', 'rejected', 'cancelled'
);

CREATE TYPE slot_status AS ENUM (
    'scheduled', 'confirmed', 'in_progress', 'done', 'no_show', 'cancelled'
);

CREATE TYPE user_role AS ENUM (
    'admin', 'ops', 'sales', 'tech', 'viewer'
);

-- Tablas
CREATE TABLE organization (
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

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE emitters (
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

CREATE TABLE customers (
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

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    cost NUMERIC(12,2),
    unit_code VARCHAR(10) DEFAULT 'UND',
    itbms_rate NUMERIC(5,2) DEFAULT 0.07,
    category VARCHAR(50),
    is_service BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE installers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    province TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE installer_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    lead_installer_id UUID REFERENCES installers(id),
    max_concurrent_jobs INTEGER DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE installer_team_members (
    team_id UUID NOT NULL REFERENCES installer_teams(id) ON DELETE CASCADE,
    installer_id UUID NOT NULL REFERENCES installers(id) ON DELETE CASCADE,
    is_lead BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, installer_id)
);

CREATE TABLE price_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    multiplier NUMERIC(5,2) DEFAULT 1.00,
    delivery_days INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE work_orders (
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

-- Slots de instalación
CREATE TABLE installation_slots (
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

CREATE TABLE payment_methods (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL
);

-- Cotizaciones
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL CHECK (status IN ('draft','sent','approved','rejected','expired')),
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    itbms_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quote_items (
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

-- Inspecciones (después de work_orders)
CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES users(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    inspection_type TEXT NOT NULL DEFAULT 'quality' CHECK (inspection_type IN ('quality', 'installation', 'final')),
    notes TEXT,
    passed BOOLEAN,
    issues_found TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invoices (
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

CREATE TABLE invoice_items (
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

CREATE TABLE invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    method_code TEXT NOT NULL REFERENCES payment_methods(code),
    amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE weekly_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emitter_id UUID REFERENCES emitters(id) ON DELETE SET NULL,
    year INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    target_amount NUMERIC(12,2) NOT NULL DEFAULT 3000.00,
    target_orders INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_customers_emitter ON customers(emitter_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_products_emitter ON products(emitter_id);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_work_orders_customer ON work_orders(customer_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(issue_date);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Métodos de pago
INSERT INTO payment_methods (code, description) VALUES 
('01', 'Efectivo'),
('02', 'Tarjeta de Crédito'),
('03', 'Tarjeta de Débito'),
('04', 'Transferencia Bancaria'),
('05', 'Cheque'),
('08', 'Crédito');

-- PASO 3: Datos manufactureros
INSERT INTO organization (
    name, ruc_tipo, ruc_numero, ruc_dv, branch_code,
    phone, email, address_line, city, province,
    dgi_environment, logo_url, primary_color
) VALUES (
    'ZetterX Glass & Aluminum', '2', '155646463', '86', '001',
    '507-1234-5678', 'info@zetterx.com', 
    'Parque Industrial, Zona Libre de Colón', 'COLON', 'COLON',
    1, 'https://zetterx.com/logo.png', '#2563EB'
);

INSERT INTO users (full_name, email, role) VALUES 
    ('Jonathan Admin', 'admin@zetterx.com', 'admin'),
    ('Carlos Vendedor', 'sales@zetterx.com', 'sales'),
    ('María Producción', 'production@zetterx.com', 'ops'),
    ('Luis Instalador', 'installer@zetterx.com', 'tech');

INSERT INTO emitters (
    name, company_code, company_name, 
    ruc_tipo, ruc_numero, ruc_dv, branch_code,
    address_line, city, province, phone, email,
    dgi_subscription_key, dgi_client_key, is_active
) VALUES (
    'ZetterX Glass & Aluminum', '155646463-86-001', 'ZetterX Glass & Aluminum',
    '2', '155646463', '86', '001',
    'Parque Industrial, Zona Libre de Colón', 'COLON', 'COLON', 
    '507-1234-5678', 'info@zetterx.com',
    'YOUR_DGI_SUBSCRIPTION_KEY', 'YOUR_DGI_CLIENT_KEY', true
);

-- Productos manufactureros (con UNIQUE constraint funcionando)
INSERT INTO products (emitter_id, code, description, price, cost, unit_code, itbms_rate, category, is_service) VALUES
    -- VENTANAS
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'VEN-ALU-001', 'Ventana Corrediza Aluminio 1.20x1.00 - Vidrio templado 6mm', 285.00, 180.00, 'UND', 0.07, 'WINDOWS', false),
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'VEN-ALU-002', 'Ventana Corrediza Aluminio 1.50x1.20 - Vidrio templado 6mm', 350.00, 220.00, 'UND', 0.07, 'WINDOWS', false),
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'VEN-ALU-003', 'Ventana Corrediza Aluminio 2.00x1.50 - Vidrio templado 6mm', 485.00, 300.00, 'UND', 0.07, 'WINDOWS', false),
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'VEN-ALU-004', 'Ventana Batiente Aluminio 0.80x1.00 - Vidrio templado 6mm', 245.00, 155.00, 'UND', 0.07, 'WINDOWS', false),
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'VEN-ALU-005', 'Ventana Batiente Aluminio 1.00x1.20 - Vidrio templado 6mm', 295.00, 185.00, 'UND', 0.07, 'WINDOWS', false),
    
    -- PUERTAS
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'PTA-ALU-001', 'Puerta Corrediza Aluminio 2.40x2.10 - Vidrio templado 8mm', 650.00, 420.00, 'UND', 0.07, 'DOORS', false),
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'PTA-ALU-002', 'Puerta Batiente Aluminio 0.90x2.10 - Vidrio templado 8mm', 485.00, 315.00, 'UND', 0.07, 'DOORS', false),
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'PTA-ALU-003', 'Puerta Doble Batiente Aluminio 1.80x2.10 - Vidrio templado 8mm', 750.00, 485.00, 'UND', 0.07, 'DOORS', false),
    
    -- VIDRIOS Y PANELES
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'VID-TEM-001', 'Panel Vidrio Templado Transparente 6mm', 35.00, 22.00, 'M2', 0.07, 'GLASS', false),
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'VID-TEM-002', 'Panel Vidrio Templado Transparente 8mm', 45.00, 28.00, 'M2', 0.07, 'GLASS', false),
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'VID-TEM-003', 'Panel Vidrio Templado Transparente 10mm', 55.00, 35.00, 'M2', 0.07, 'GLASS', false),
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'VID-TEM-004', 'Vidrio Laminado de Seguridad 6+6mm', 65.00, 42.00, 'M2', 0.07, 'GLASS', false),
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'VID-TEM-005', 'Vidrio Reflectivo Bronce 6mm', 42.00, 28.00, 'M2', 0.07, 'GLASS', false),
    
    -- SERVICIOS
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'SRV-INS-001', 'Servicio Instalación Ventana', 75.00, 45.00, 'UND', 0.07, 'SERVICE', true),
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'SRV-INS-002', 'Servicio Instalación Puerta', 95.00, 60.00, 'UND', 0.07, 'SERVICE', true),
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'SRV-MED-001', 'Servicio Medición y Levantamiento', 25.00, 15.00, 'UND', 0.07, 'SERVICE', true);

-- Clientes manufactureros  
INSERT INTO customers (
    emitter_id, name, email, phone, address_line, city, province, 
    tax_id_type, tax_id, country_code, notes
) VALUES 
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'Constructora Panamá S.A.', 'ventas@construpanama.com', '507-264-5500', 
     'Avenida Balboa, Torre Global Bank', 'PANAMA', 'PANAMA', 
     'RUC', '155123456-2-2015', 'PA', 'Cliente corporativo - Proyectos residenciales'),
    
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 'Juan Carlos Pérez', 'jcperez@email.com', '507-6789-1234', 
     'Altos de Panamá, Casa 15A', 'PANAMA', 'PANAMA', 
     'CEDULA', '8-123-456', 'PA', 'Cliente residencial - Casa propia');

-- Work Orders de prueba
INSERT INTO work_orders (
    emitter_id, customer_id, title, description, status, 
    total_amount, scheduled_date, address_line, city, province, notes
) VALUES 
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'), 
     (SELECT id FROM customers WHERE name = 'Constructora Panamá S.A.' LIMIT 1),
     'Instalación Ventanas Torre Corporativa', 
     'Instalación de 12 ventanas corredizas de aluminio para oficinas corporativas',
     'approved', 3420.00, NOW() + INTERVAL '5 days',
     'Avenida Balboa, Torre Global Bank', 'PANAMA', 'PANAMA',
     'Proyecto corporativo - Coordinar con administración del edificio'),
     
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'),
     (SELECT id FROM customers WHERE name = 'Juan Carlos Pérez' LIMIT 1),
     'Renovación Puertas Residencial',
     'Instalación de puerta corrediza y 3 ventanas para casa residencial',
     'scheduled', 1825.00, NOW() + INTERVAL '10 days',
     'Altos de Panamá, Casa 15A', 'PANAMA', 'PANAMA',
     'Cliente residencial - Acceso por portería principal');

-- Quotes de prueba 
INSERT INTO quotes (
    emitter_id, customer_id, work_order_id, quote_number, title, 
    status, total_amount, valid_until, notes
) VALUES 
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'),
     (SELECT id FROM customers WHERE name = 'Constructora Panamá S.A.' LIMIT 1),
     (SELECT id FROM work_orders WHERE title = 'Instalación Ventanas Torre Corporativa' LIMIT 1),
     'COT-2024-001', 'Cotización Ventanas Torre Corporativa',
     'accepted', 3420.00, NOW() + INTERVAL '30 days',
     'Cotización aprobada por el cliente'),
     
    ((SELECT id FROM emitters WHERE company_code = '155646463-86-001'),
     (SELECT id FROM customers WHERE name = 'Juan Carlos Pérez' LIMIT 1),
     (SELECT id FROM work_orders WHERE title = 'Renovación Puertas Residencial' LIMIT 1),
     'COT-2024-002', 'Cotización Renovación Casa Residencial',
     'pending', 1825.00, NOW() + INTERVAL '15 days',
     'Cotización enviada - En espera de respuesta del cliente');

-- Quote Items de prueba
INSERT INTO quote_items (
    quote_id, product_id, line_seq, quantity, unit_price, 
    line_total, description
) VALUES 
    -- Items para Cotización 1
    ((SELECT id FROM quotes WHERE quote_number = 'COT-2024-001' LIMIT 1),
     (SELECT id FROM products WHERE code = 'VEN-ALU-002' LIMIT 1),
     1, 12, 350.00, 4200.00, 'Ventana Corrediza Aluminio 1.50x1.20'),
    ((SELECT id FROM quotes WHERE quote_number = 'COT-2024-001' LIMIT 1),
     (SELECT id FROM products WHERE code = 'SRV-INS-001' LIMIT 1),
     2, 12, 75.00, 900.00, 'Servicio Instalación Ventana'),
     
    -- Items para Cotización 2  
    ((SELECT id FROM quotes WHERE quote_number = 'COT-2024-002' LIMIT 1),
     (SELECT id FROM products WHERE code = 'PTA-ALU-001' LIMIT 1),
     1, 1, 650.00, 650.00, 'Puerta Corrediza Aluminio 2.40x2.10'),
    ((SELECT id FROM quotes WHERE quote_number = 'COT-2024-002' LIMIT 1),
     (SELECT id FROM products WHERE code = 'VEN-ALU-001' LIMIT 1),
     2, 3, 285.00, 855.00, 'Ventana Corrediza Aluminio 1.20x1.00'),
    ((SELECT id FROM quotes WHERE quote_number = 'COT-2024-002' LIMIT 1),
     (SELECT id FROM products WHERE code = 'SRV-INS-002' LIMIT 1),
     3, 1, 95.00, 95.00, 'Servicio Instalación Puerta'),
    ((SELECT id FROM quotes WHERE quote_number = 'COT-2024-002' LIMIT 1),
     (SELECT id FROM products WHERE code = 'SRV-INS-001' LIMIT 1),
     4, 3, 75.00, 225.00, 'Servicio Instalación Ventana');

-- Inspecciones de prueba
INSERT INTO inspections (
    work_order_id, inspector_id, scheduled_at, status, 
    inspection_type, notes
) VALUES 
    ((SELECT id FROM work_orders WHERE title = 'Instalación Ventanas Torre Corporativa' LIMIT 1),
     (SELECT id FROM users WHERE email = 'production@zetterx.com' LIMIT 1),
     NOW() + INTERVAL '2 days', 'scheduled', 'quality',
     'Inspección de calidad pre-instalación - Revisar medidas y acabados'),
     
    ((SELECT id FROM work_orders WHERE title = 'Instalación Ventanas Torre Corporativa' LIMIT 1),
     (SELECT id FROM users WHERE email = 'installer@zetterx.com' LIMIT 1),
     NOW() + INTERVAL '7 days', 'scheduled', 'installation',
     'Inspección durante instalación - Verificar alineación y sellado'),
     
    ((SELECT id FROM work_orders WHERE title = 'Renovación Puertas Residencial' LIMIT 1),
     (SELECT id FROM users WHERE email = 'production@zetterx.com' LIMIT 1),
     NOW() + INTERVAL '8 days', 'scheduled', 'quality',
     'Inspección de calidad pre-instalación - Verificar materiales y dimensiones'),
     
    ((SELECT id FROM work_orders WHERE title = 'Renovación Puertas Residencial' LIMIT 1),
     (SELECT id FROM users WHERE email = 'installer@zetterx.com' LIMIT 1),
     NOW() + INTERVAL '12 days', 'scheduled', 'final',
     'Inspección final post-instalación - Verificar funcionamiento y acabados');

-- Usuario admin para autenticación (debe coincidir con Supabase Auth UUID)
-- IMPORTANTE: Ejecutar después de crear usuario en Supabase Auth
-- INSERT INTO users (id, email, full_name, role, is_active) 
-- VALUES ('USER_UUID_FROM_SUPABASE', 'admin@zetterx.com', 'Admin User', 'admin', true);

-- ¡LISTO! Base de datos completamente inicializada
