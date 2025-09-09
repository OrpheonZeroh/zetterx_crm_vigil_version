-- =========================================================
-- ZETTERX CRM - MANUFACTURING SEED DATA
-- Datos iniciales para negocio de vidrio templado y aluminio
-- =========================================================

-- Configuración de la empresa
INSERT INTO company_settings (
    company_name, ruc_tipo, ruc_numero, ruc_dv, branch_code,
    phone, email, address_line, city, province,
    dgi_environment, logo_url, primary_color
) VALUES (
    'ZetterX Glass & Aluminum', '2', '155646463', '86', '001',
    '507-1234-5678', 'info@zetterx.com', 
    'Parque Industrial, Zona Libre de Colón', 'COLON', 'COLON',
    1, 'https://zetterx.com/logo.png', '#2563EB'
);

-- Usuarios del sistema
INSERT INTO users (full_name, email, role) VALUES 
    ('Jonathan Admin', 'admin@zetterx.com', 'admin'),
    ('Carlos Vendedor', 'sales@zetterx.com', 'sales'),
    ('María Producción', 'production@zetterx.com', 'production'),
    ('Luis Instalador', 'installer@zetterx.com', 'installer');

-- Productos de manufactura específicos
INSERT INTO products (code, name, description, category, width_mm, height_mm, thickness_mm, primary_material, finish, unit_price, cost_price, production_days) VALUES 

-- VENTANAS
('VEN-ALU-001', 'Ventana Corrediza Aluminio 1.20x1.00', 'Ventana corrediza de aluminio con vidrio templado 6mm', 'window', 1200.00, 1000.00, 6.00, 'Aluminum', 'Natural', 285.00, 180.00, 5),
('VEN-ALU-002', 'Ventana Corrediza Aluminio 1.50x1.20', 'Ventana corrediza de aluminio con vidrio templado 6mm', 'window', 1500.00, 1200.00, 6.00, 'Aluminum', 'Natural', 350.00, 220.00, 5),
('VEN-ALU-003', 'Ventana Corrediza Aluminio 2.00x1.50', 'Ventana corrediza de aluminio con vidrio templado 6mm', 'window', 2000.00, 1500.00, 6.00, 'Aluminum', 'Natural', 485.00, 300.00, 6),
('VEN-ALU-004', 'Ventana Batiente Aluminio 0.80x1.00', 'Ventana batiente de aluminio con vidrio templado 6mm', 'window', 800.00, 1000.00, 6.00, 'Aluminum', 'White', 245.00, 155.00, 4),
('VEN-ALU-005', 'Ventana Batiente Aluminio 1.00x1.20', 'Ventana batiente de aluminio con vidrio templado 6mm', 'window', 1000.00, 1200.00, 6.00, 'Aluminum', 'White', 295.00, 185.00, 4),

-- PUERTAS
('PTA-ALU-001', 'Puerta Corrediza Aluminio 2.40x2.10', 'Puerta corrediza de aluminio con vidrio templado 8mm', 'door', 2400.00, 2100.00, 8.00, 'Aluminum', 'Bronze', 650.00, 420.00, 7),
('PTA-ALU-002', 'Puerta Batiente Aluminio 0.90x2.10', 'Puerta batiente de aluminio con vidrio templado 8mm', 'door', 900.00, 2100.00, 8.00, 'Aluminum', 'Black', 485.00, 315.00, 6),
('PTA-ALU-003', 'Puerta Doble Batiente 1.80x2.10', 'Puerta doble batiente aluminio con vidrio templado', 'door', 1800.00, 2100.00, 8.00, 'Aluminum', 'Natural', 750.00, 485.00, 8),

-- PANELES DE VIDRIO
('VID-TEM-001', 'Panel Vidrio Templado 6mm', 'Panel de vidrio templado transparente 6mm', 'glass_panel', NULL, NULL, 6.00, 'Tempered Glass', 'Clear', 35.00, 22.00, 3),
('VID-TEM-002', 'Panel Vidrio Templado 8mm', 'Panel de vidrio templado transparente 8mm', 'glass_panel', NULL, NULL, 8.00, 'Tempered Glass', 'Clear', 45.00, 28.00, 3),
('VID-TEM-003', 'Panel Vidrio Templado 10mm', 'Panel de vidrio templado transparente 10mm', 'glass_panel', NULL, NULL, 10.00, 'Tempered Glass', 'Clear', 55.00, 35.00, 4),

-- PERFILES DE ALUMINIO
('ALU-PRF-001', 'Perfil Aluminio Marco Ventana', 'Perfil de aluminio para marco de ventana', 'aluminum_profile', NULL, NULL, NULL, 'Aluminum', 'Natural', 12.50, 8.50, 0),
('ALU-PRF-002', 'Perfil Aluminio Marco Puerta', 'Perfil de aluminio reforzado para marco de puerta', 'aluminum_profile', NULL, NULL, NULL, 'Aluminum', 'Natural', 18.75, 12.25, 0),
('ALU-PRF-003', 'Perfil Aluminio Divisor', 'Perfil de aluminio para divisiones internas', 'aluminum_profile', NULL, NULL, NULL, 'Aluminum', 'Natural', 8.25, 5.50, 0),

-- HERRAJES
('HER-COR-001', 'Kit Herrajes Ventana Corrediza', 'Herrajes completos para ventana corrediza', 'hardware', NULL, NULL, NULL, 'Hardware', 'Stainless', 45.00, 28.00, 0),
('HER-BAT-001', 'Kit Herrajes Ventana Batiente', 'Herrajes completos para ventana batiente', 'hardware', NULL, NULL, NULL, 'Hardware', 'Stainless', 35.00, 22.00, 0),
('HER-PTA-001', 'Kit Herrajes Puerta Corrediza', 'Herrajes completos para puerta corrediza', 'hardware', NULL, NULL, NULL, 'Hardware', 'Stainless', 85.00, 55.00, 0),

-- SERVICIOS
('SRV-INS-001', 'Instalación Ventana', 'Servicio de instalación de ventana', 'installation', NULL, NULL, NULL, 'Service', NULL, 75.00, 45.00, 0),
('SRV-INS-002', 'Instalación Puerta', 'Servicio de instalación de puerta', 'installation', NULL, NULL, NULL, 'Service', NULL, 95.00, 60.00, 0),
('SRV-MED-001', 'Servicio de Medición', 'Toma de medidas en sitio', 'service', NULL, NULL, NULL, 'Service', NULL, 25.00, 15.00, 0);

-- Instaladores
INSERT INTO installers (full_name, phone, email, specialties) VALUES
    ('Luis Méndez', '507-6123-4567', 'luis.mendez@zetterx.com', '{"windows","doors"}'),
    ('Carlos Rivera', '507-6234-5678', 'carlos.rivera@zetterx.com', '{"windows","glass_panels"}'),
    ('Ana Vargas', '507-6345-6789', 'ana.vargas@zetterx.com', '{"doors","installation"}'),
    ('Miguel Torres', '507-6456-7890', 'miguel.torres@zetterx.com', '{"windows","doors","glass_panels"}');

-- Equipos de instalación
INSERT INTO installer_teams (name, max_concurrent_jobs) VALUES 
    ('Equipo Alpha', 3),
    ('Equipo Beta', 2);

-- Asignación de instaladores a equipos
DO $$
DECLARE
    team_alpha_id UUID;
    team_beta_id UUID;
    luis_id UUID;
    carlos_id UUID;
    ana_id UUID;
    miguel_id UUID;
BEGIN
    -- Obtener IDs
    SELECT id INTO team_alpha_id FROM installer_teams WHERE name = 'Equipo Alpha';
    SELECT id INTO team_beta_id FROM installer_teams WHERE name = 'Equipo Beta';
    SELECT id INTO luis_id FROM installers WHERE full_name = 'Luis Méndez';
    SELECT id INTO carlos_id FROM installers WHERE full_name = 'Carlos Rivera';
    SELECT id INTO ana_id FROM installers WHERE full_name = 'Ana Vargas';
    SELECT id INTO miguel_id FROM installers WHERE full_name = 'Miguel Torres';
    
    -- Asignar a equipos
    INSERT INTO installer_team_members (team_id, installer_id, is_lead) VALUES
        (team_alpha_id, luis_id, true),
        (team_alpha_id, carlos_id, false),
        (team_beta_id, ana_id, true),
        (team_beta_id, miguel_id, false);
END $$;

-- Clientes de ejemplo
INSERT INTO customers (name, email, phone, address_line, city, province, tax_id_type, tax_id) VALUES 
    ('Constructora Panamá S.A.', 'ventas@construpanama.com', '507-264-5500', 'Avenida Balboa, Torre Global Bank', 'PANAMA', 'PANAMA', 'RUC', '155123456-2-2015'),
    ('Residencial Costa Verde', 'administracion@costaverde.com', '507-236-7800', 'Costa del Este, Residencial Costa Verde', 'PANAMA', 'PANAMA', 'RUC', '155987654-1-2018'),
    ('Juan Carlos Pérez', 'jcperez@email.com', '507-6789-1234', 'Altos de Panamá, Casa 15A', 'PANAMA', 'PANAMA', 'CEDULA', '8-123-456'),
    ('María González Vda.', 'maria.gonzalez@email.com', '507-5555-6666', 'Chorrera, Residencial Nova', 'LA CHORRERA', 'PANAMA OESTE', 'CEDULA', '8-987-654'),
    ('Oficinas Torre Ejecutiva', 'mantenimiento@torreeje.com', '507-215-3000', 'Avenida Samuel Lewis, Torre Ejecutiva', 'PANAMA', 'PANAMA', 'RUC', '155555555-3-2020');

-- Metas de ventas para el año actual
DO $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    INSERT INTO sales_targets (year, month, target_amount, target_orders) VALUES
        (current_year, 1, 15000.00, 8),
        (current_year, 2, 18000.00, 10),
        (current_year, 3, 22000.00, 12),
        (current_year, 4, 25000.00, 14),
        (current_year, 5, 28000.00, 15),
        (current_year, 6, 30000.00, 16),
        (current_year, 7, 32000.00, 18),
        (current_year, 8, 30000.00, 16),
        (current_year, 9, 28000.00, 15),
        (current_year, 10, 26000.00, 14),
        (current_year, 11, 24000.00, 13),
        (current_year, 12, 20000.00, 11);
END $$;

-- Work order de ejemplo
DO $$
DECLARE
    constructora_id UUID;
    juan_carlos_id UUID;
    sales_user_id UUID;
BEGIN
    -- Obtener IDs
    SELECT id INTO constructora_id FROM customers WHERE name = 'Constructora Panamá S.A.';
    SELECT id INTO juan_carlos_id FROM customers WHERE name = 'Juan Carlos Pérez';
    SELECT id INTO sales_user_id FROM users WHERE email = 'sales@zetterx.com';
    
    -- Work order para constructora (proyecto grande)
    INSERT INTO work_orders (
        customer_id, title, status, estimated_value,
        installation_address, installation_city, installation_province,
        estimated_production_days, estimated_installation_days,
        target_delivery_date, notes, created_by, assigned_to
    ) VALUES (
        constructora_id, 'Ventanas Edificio Residencial - Torre A', 'quoted', 12500.00,
        'Costa del Este, Proyecto Residencial Vista Mar', 'PANAMA', 'PANAMA',
        15, 3, CURRENT_DATE + INTERVAL '25 days',
        '24 ventanas corredizas para apartamentos. Vidrio templado 6mm.', 
        sales_user_id, sales_user_id
    );
    
    -- Work order para cliente residencial
    INSERT INTO work_orders (
        customer_id, title, status, estimated_value,
        installation_address, installation_city, installation_province,
        estimated_production_days, estimated_installation_days,
        target_delivery_date, notes, created_by, assigned_to
    ) VALUES (
        juan_carlos_id, 'Puertas y Ventanas Casa Residencial', 'approved', 3200.00,
        'Altos de Panamá, Casa 15A', 'PANAMA', 'PANAMA',
        8, 1, CURRENT_DATE + INTERVAL '12 days',
        '3 ventanas corredizas sala/comedor + 1 puerta corrediza terraza', 
        sales_user_id, sales_user_id
    );
END $$;
