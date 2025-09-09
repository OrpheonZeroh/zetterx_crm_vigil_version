-- =========================================================
-- ZETTERX CRM - CONSOLIDATED SEED DATA
-- Datos iniciales compatibles con esquema consolidado
-- =========================================================

-- Insertar organización principal
INSERT INTO organization (
    name, ruc_tipo, ruc_numero, ruc_dv, branch_code,
    phone, email, address_line, ubi_code, province, district, corregimiento
) VALUES (
    'ZetterX CRM', '2', '155646463', '86', '001',
    '507-1234-5678', 'admin@zetterx.com', 
    'AVENIDA PERU, CIUDAD DE PANAMA', '8-8-8',
    'PANAMA', 'PANAMA', 'SAN FRANCISCO'
) ON CONFLICT (name) DO UPDATE SET 
    phone = EXCLUDED.phone,
    email = EXCLUDED.email;

-- Insertar usuario administrador
INSERT INTO users (full_name, email, role) VALUES 
    ('Administrador ZetterX', 'admin@zetterx.com', 'admin'),
    ('Operador Principal', 'ops@zetterx.com', 'ops'),
    ('Vendedor Principal', 'sales@zetterx.com', 'sales'),
    ('Técnico Principal', 'tech@zetterx.com', 'tech')
ON CONFLICT (email) DO NOTHING;

-- Insertar emisor DGI de ejemplo (HYPERNOVA LABS)
INSERT INTO emitters (
    name, company_code, ruc_tipo, ruc_numero, ruc_dv, suc_em, 
    pto_fac_default, iamb, itpemis_default, idoc_default,
    email, phone, address_line, ubi_code,
    brand_logo_url, brand_primary_color, brand_footer_html,
    pac_api_key, pac_subscription_key
) VALUES (
    'HYPERNOVA LABS',
    'HYPE',
    '2',
    '155646463',
    '86',
    '0001',
    '001',
    1, -- Producción
    '01', -- Normal
    '01', -- Factura
    'facturas@hypernova.com',
    '507-1234',
    'AVENIDA PERU, CIUDAD DE PANAMA',
    '8-8-8',
    'https://cdn.hypernova.com/logo.png',
    '#0F172A',
    '<p>Gracias por su compra. Para consultas: facturas@hypernova.com</p>',
    'pac_api_key_example_123',
    'pac_subscription_key_example_456'
) ON CONFLICT (ruc_tipo, ruc_numero, ruc_dv, suc_em) DO NOTHING;

-- Obtener el ID del emisor insertado y crear datos relacionados
DO $$
DECLARE
    v_emitter_id UUID;
    v_customer1_id UUID;
    v_customer2_id UUID;
    v_product1_id UUID;
    v_product2_id UUID;
    v_team_id UUID;
    v_installer_id UUID;
BEGIN
    SELECT id INTO v_emitter_id FROM emitters WHERE company_code = 'HYPE' LIMIT 1;
    
    IF v_emitter_id IS NOT NULL THEN
        -- Insertar series de documentos
        INSERT INTO emitter_series (emitter_id, pto_fac_df, doc_kind, next_number) VALUES
            (v_emitter_id, '001', 'invoice', 1),
            (v_emitter_id, '001', 'credit_note', 1),
            (v_emitter_id, '001', 'debit_note', 1),
            (v_emitter_id, '002', 'invoice', 1), -- Punto de facturación alternativo
            (v_emitter_id, '002', 'credit_note', 1)
        ON CONFLICT (emitter_id, pto_fac_df, doc_kind) DO NOTHING;

        -- Insertar productos de ejemplo
        INSERT INTO products (
            emitter_id, sku, code, description, cpbs_abr, cpbs_cmp,
            unit_price, tax_rate, itbms_rate, is_service
        ) VALUES 
            (v_emitter_id, 'SERV001', 'INSTALL_BASIC', 'Instalación Básica de Sistema', '00', '0000', 
             250.00, '07', 7.00, true),
            (v_emitter_id, 'SERV002', 'INSTALL_PREMIUM', 'Instalación Premium con Configuración', '00', '0000', 
             450.00, '07', 7.00, true),
            (v_emitter_id, 'PROD001', 'CABLE_CAT6', 'Cable UTP Cat6 por metro', '00', '0000', 
             2.50, '07', 7.00, false),
            (v_emitter_id, 'PROD002', 'ROUTER_AC', 'Router WiFi AC1200', '00', '0000', 
             89.99, '07', 7.00, false)
        ON CONFLICT (emitter_id, sku) DO NOTHING;

        -- Obtener IDs de productos para referencias
        SELECT id INTO v_product1_id FROM products WHERE sku = 'SERV001' AND emitter_id = v_emitter_id;
        SELECT id INTO v_product2_id FROM products WHERE sku = 'SERV002' AND emitter_id = v_emitter_id;

        -- Insertar clientes de ejemplo (tanto para CRM como DGI)
        INSERT INTO customers (
            emitter_id, name, email, phone, address_line, 
            ubi_code, province, district, corregimiento,
            tax_id_type, tax_id
        ) VALUES 
            (v_emitter_id, 'Juan Pérez', 'juan.perez@email.com', '507-6789-1234', 
             'COSTA DEL ESTE, TORRE A, APTO 15B', '8-8-1', 
             'PANAMA', 'PANAMA', 'COSTA DEL ESTE', 'CEDULA', '8-123-456'),
            (v_emitter_id, 'CORPORACION ABC S.A.', 'contabilidad@abccorp.com', '507-2000-3000',
             'VIA ESPAÑA, EDIFICIO GLOBAL PLAZA', '8-8-2',
             'PANAMA', 'PANAMA', 'EL CANGREJO', 'RUC', '155123456-2-2015'),
            (NULL, 'María González', 'maria.gonzalez@email.com', '507-5555-6666',
             'CHORRERA, RESIDENCIAL NOVA', '3-1-1',
             'PANAMA OESTE', 'LA CHORRERA', 'CHORRERA CABECERA', 'CEDULA', '8-987-654')
        ON CONFLICT (emitter_id, email) DO NOTHING;

        -- Obtener IDs de clientes
        SELECT id INTO v_customer1_id FROM customers WHERE email = 'juan.perez@email.com' AND emitter_id = v_emitter_id;
        SELECT id INTO v_customer2_id FROM customers WHERE email = 'contabilidad@abccorp.com' AND emitter_id = v_emitter_id;

        -- Insertar instaladores
        IF NOT EXISTS (SELECT 1 FROM installers WHERE full_name = 'Carlos Méndez') THEN
            INSERT INTO installers (full_name, phone, email) VALUES
                ('Carlos Méndez', '507-6123-4567', 'carlos.mendez@zetterx.com');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM installers WHERE full_name = 'Luis Rivera') THEN
            INSERT INTO installers (full_name, phone, email) VALUES
                ('Luis Rivera', '507-6234-5678', 'luis.rivera@zetterx.com');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM installers WHERE full_name = 'Ana Vargas') THEN
            INSERT INTO installers (full_name, phone, email) VALUES
                ('Ana Vargas', '507-6345-6789', 'ana.vargas@zetterx.com');
        END IF;

        -- Crear equipo de instaladores
        IF NOT EXISTS (SELECT 1 FROM installer_teams WHERE name = 'Equipo Alpha') THEN
            INSERT INTO installer_teams (name) VALUES ('Equipo Alpha');
        END IF;
        SELECT id INTO v_team_id FROM installer_teams WHERE name = 'Equipo Alpha' LIMIT 1;
        SELECT id INTO v_installer_id FROM installers WHERE full_name = 'Carlos Méndez' LIMIT 1;

        -- Asignar instaladores al equipo
        IF v_team_id IS NOT NULL AND v_installer_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM installer_team_members WHERE team_id = v_team_id AND installer_id = v_installer_id) THEN
                INSERT INTO installer_team_members (team_id, installer_id, is_lead) VALUES
                    (v_team_id, v_installer_id, true);
            END IF;
        END IF;

        -- Insertar zonas de precios de ejemplo
        IF NOT EXISTS (SELECT 1 FROM price_zones WHERE province = 'PANAMA' AND district = 'PANAMA' AND corregimiento = 'SAN FRANCISCO') THEN
            INSERT INTO price_zones (province, district, corregimiento, price_min, price_max) VALUES
                ('PANAMA', 'PANAMA', 'SAN FRANCISCO', 200.00, 500.00);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM price_zones WHERE province = 'PANAMA' AND district = 'PANAMA' AND corregimiento = 'COSTA DEL ESTE') THEN
            INSERT INTO price_zones (province, district, corregimiento, price_min, price_max) VALUES
                ('PANAMA', 'PANAMA', 'COSTA DEL ESTE', 300.00, 700.00);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM price_zones WHERE province = 'PANAMA OESTE' AND district = 'LA CHORRERA' AND corregimiento = 'CHORRERA CABECERA') THEN
            INSERT INTO price_zones (province, district, corregimiento, price_min, price_max) VALUES
                ('PANAMA OESTE', 'LA CHORRERA', 'CHORRERA CABECERA', 150.00, 400.00);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM price_zones WHERE province = 'COLON' AND district = 'COLON' AND corregimiento = 'COLON') THEN
            INSERT INTO price_zones (province, district, corregimiento, price_min, price_max) VALUES
                ('COLON', 'COLON', 'COLON', 180.00, 450.00);
        END IF;

        -- Insertar work orders de ejemplo
        IF v_customer1_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM work_orders WHERE customer_id = v_customer1_id AND title = 'Instalación Internet Hogar') THEN
                INSERT INTO work_orders (
                    customer_id, title, status, estimated_value,
                    address_line, province, district, corregimiento, ubi_code
                ) VALUES (
                    v_customer1_id, 'Instalación Internet Hogar', 'lead', 250.00,
                    'COSTA DEL ESTE, TORRE A, APTO 15B', 'PANAMA', 'PANAMA', 'COSTA DEL ESTE', '8-8-1'
                );
            END IF;
        END IF;

        -- Insertar meta semanal
        IF NOT EXISTS (SELECT 1 FROM weekly_targets WHERE week_start = DATE_TRUNC('week', CURRENT_DATE)) THEN
            INSERT INTO weekly_targets (week_start, amount_target) VALUES
                (DATE_TRUNC('week', CURRENT_DATE), 3000.00);
        END IF;

    END IF;
END $$;

-- Insertar configuración de aplicación (solo si no existe)
DO $$
BEGIN
    -- Insertar Sistema Principal si no existe
    IF NOT EXISTS (SELECT 1 FROM api_keys WHERE name = 'Sistema Principal') THEN
        INSERT INTO api_keys (name, key_hash, is_active, rate_limit_per_min) VALUES
            ('Sistema Principal', encode(digest('zetterx_main_key_2024', 'sha256'), 'hex'), true, 240);
    END IF;
    
    -- Insertar API Externa si no existe
    IF NOT EXISTS (SELECT 1 FROM api_keys WHERE name = 'API Externa') THEN
        INSERT INTO api_keys (name, key_hash, is_active, rate_limit_per_min) VALUES
            ('API Externa', encode(digest('external_api_key_2024', 'sha256'), 'hex'), true, 60);
    END IF;
END $$;

-- Datos iniciales insertados correctamente para ZetterX CRM con soporte DGI
-- Script ejecutado exitosamente
