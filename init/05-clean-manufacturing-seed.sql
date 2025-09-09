-- =========================================================
-- ZETTERX CRM - CLEAN MANUFACTURING SEED DATA
-- Datos para vidrio templado y aluminio (versión sin errores)
-- =========================================================

-- Configuración de organización
INSERT INTO organization (
    name, ruc_tipo, ruc_numero, ruc_dv, branch_code,
    phone, email, address_line, city, province,
    dgi_environment, logo_url, primary_color
) VALUES (
    'ZetterX Glass & Aluminum', '2', '155646463', '86', '001',
    '507-1234-5678', 'info@zetterx.com', 
    'Parque Industrial, Zona Libre de Colón', 'COLON', 'COLON',
    1, 'https://zetterx.com/logo.png', '#2563EB'
) ON CONFLICT DO NOTHING;

-- Usuarios del sistema
INSERT INTO users (full_name, email, role) VALUES 
    ('Jonathan Admin', 'admin@zetterx.com', 'admin'),
    ('Carlos Vendedor', 'sales@zetterx.com', 'sales'),
    ('María Producción', 'production@zetterx.com', 'ops'),
    ('Luis Instalador', 'installer@zetterx.com', 'tech')
ON CONFLICT (email) DO NOTHING;

-- Emisor único para el negocio (single-tenant)
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
) ON CONFLICT (company_code) DO NOTHING;

-- Obtener ID del emisor para referencias
DO $$
DECLARE
    emitter_id UUID;
BEGIN
    SELECT id INTO emitter_id FROM emitters WHERE company_code = '155646463-86-001';
    
    -- Productos de manufactura de vidrio y aluminio
    INSERT INTO products (emitter_id, code, description, price, cost, unit_code, itbms_rate, category) VALUES
        -- VENTANAS
        (emitter_id, 'VEN-ALU-001', 'Ventana Corrediza Aluminio 1.20x1.00 - Vidrio templado 6mm', 285.00, 180.00, 'UND', 0.07, 'WINDOWS'),
        (emitter_id, 'VEN-ALU-002', 'Ventana Corrediza Aluminio 1.50x1.20 - Vidrio templado 6mm', 350.00, 220.00, 'UND', 0.07, 'WINDOWS'),
        (emitter_id, 'VEN-ALU-003', 'Ventana Corrediza Aluminio 2.00x1.50 - Vidrio templado 6mm', 485.00, 300.00, 'UND', 0.07, 'WINDOWS'),
        (emitter_id, 'VEN-ALU-004', 'Ventana Batiente Aluminio 0.80x1.00 - Vidrio templado 6mm', 245.00, 155.00, 'UND', 0.07, 'WINDOWS'),
        (emitter_id, 'VEN-ALU-005', 'Ventana Batiente Aluminio 1.00x1.20 - Vidrio templado 6mm', 295.00, 185.00, 'UND', 0.07, 'WINDOWS'),
        
        -- PUERTAS
        (emitter_id, 'PTA-ALU-001', 'Puerta Corrediza Aluminio 2.40x2.10 - Vidrio templado 8mm', 650.00, 420.00, 'UND', 0.07, 'DOORS'),
        (emitter_id, 'PTA-ALU-002', 'Puerta Batiente Aluminio 0.90x2.10 - Vidrio templado 8mm', 485.00, 315.00, 'UND', 0.07, 'DOORS'),
        (emitter_id, 'PTA-ALU-003', 'Puerta Doble Batiente Aluminio 1.80x2.10 - Vidrio templado 8mm', 750.00, 485.00, 'UND', 0.07, 'DOORS'),
        
        -- VIDRIOS Y PANELES
        (emitter_id, 'VID-TEM-001', 'Panel Vidrio Templado Transparente 6mm', 35.00, 22.00, 'M2', 0.07, 'GLASS'),
        (emitter_id, 'VID-TEM-002', 'Panel Vidrio Templado Transparente 8mm', 45.00, 28.00, 'M2', 0.07, 'GLASS'),
        (emitter_id, 'VID-TEM-003', 'Panel Vidrio Templado Transparente 10mm', 55.00, 35.00, 'M2', 0.07, 'GLASS'),
        (emitter_id, 'VID-TEM-004', 'Vidrio Laminado de Seguridad 6+6mm', 65.00, 42.00, 'M2', 0.07, 'GLASS'),
        (emitter_id, 'VID-TEM-005', 'Vidrio Reflectivo Bronce 6mm', 42.00, 28.00, 'M2', 0.07, 'GLASS'),
        
        -- PERFILES DE ALUMINIO
        (emitter_id, 'ALU-PRF-001', 'Perfil Aluminio Marco Ventana Natural', 12.50, 8.50, 'ML', 0.07, 'ALUMINUM'),
        (emitter_id, 'ALU-PRF-002', 'Perfil Aluminio Marco Puerta Reforzado', 18.75, 12.25, 'ML', 0.07, 'ALUMINUM'),
        (emitter_id, 'ALU-PRF-003', 'Perfil Aluminio Divisor Intermedio', 8.25, 5.50, 'ML', 0.07, 'ALUMINUM'),
        (emitter_id, 'ALU-PRF-004', 'Perfil Aluminio Esquinero', 15.00, 9.50, 'ML', 0.07, 'ALUMINUM'),
        
        -- HERRAJES Y ACCESORIOS
        (emitter_id, 'HER-COR-001', 'Kit Herrajes Ventana Corrediza Completo', 45.00, 28.00, 'UND', 0.07, 'HARDWARE'),
        (emitter_id, 'HER-BAT-001', 'Kit Herrajes Ventana Batiente Completo', 35.00, 22.00, 'UND', 0.07, 'HARDWARE'),
        (emitter_id, 'HER-PTA-001', 'Kit Herrajes Puerta Corrediza Pesada', 85.00, 55.00, 'UND', 0.07, 'HARDWARE'),
        (emitter_id, 'HER-SEG-001', 'Sistema Seguridad Multilock', 125.00, 80.00, 'UND', 0.07, 'HARDWARE'),
        (emitter_id, 'HER-MOS-001', 'Kit Mosquiteros Aluminio', 65.00, 40.00, 'UND', 0.07, 'HARDWARE'),
        
        -- SERVICIOS
        (emitter_id, 'SRV-INS-001', 'Servicio Instalación Ventana', 75.00, 45.00, 'UND', 0.07, 'SERVICE'),
        (emitter_id, 'SRV-INS-002', 'Servicio Instalación Puerta', 95.00, 60.00, 'UND', 0.07, 'SERVICE'),
        (emitter_id, 'SRV-MED-001', 'Servicio Medición y Levantamiento', 25.00, 15.00, 'UND', 0.07, 'SERVICE'),
        (emitter_id, 'SRV-MAN-001', 'Servicio Mantenimiento Anual', 150.00, 90.00, 'UND', 0.07, 'SERVICE')
    ON CONFLICT (code) DO NOTHING;
    
    -- Clientes del negocio manufacturero
    INSERT INTO customers (
        emitter_id, name, email, phone, address_line, city, province, 
        tax_id_type, tax_id, country_code, notes
    ) VALUES 
        (emitter_id, 'Constructora Panamá S.A.', 'ventas@construpanama.com', '507-264-5500', 
         'Avenida Balboa, Torre Global Bank', 'PANAMA', 'PANAMA', 
         'RUC', '155123456-2-2015', 'PA', 'Cliente corporativo - Proyectos residenciales'),
        
        (emitter_id, 'Residencial Costa Verde', 'administracion@costaverde.com', '507-236-7800', 
         'Costa del Este, Residencial Costa Verde', 'PANAMA', 'PANAMA', 
         'RUC', '155987654-1-2018', 'PA', 'Desarrollo residencial - Ventanas para apartamentos'),
        
        (emitter_id, 'Juan Carlos Pérez', 'jcperez@email.com', '507-6789-1234', 
         'Altos de Panamá, Casa 15A', 'PANAMA', 'PANAMA', 
         'CEDULA', '8-123-456', 'PA', 'Cliente residencial - Casa propia'),
        
        (emitter_id, 'María González Vda.', 'maria.gonzalez@email.com', '507-5555-6666', 
         'Chorrera, Residencial Nova', 'LA CHORRERA', 'PANAMA OESTE', 
         'CEDULA', '8-987-654', 'PA', 'Renovación de ventanas'),
        
        (emitter_id, 'Oficinas Torre Ejecutiva', 'mantenimiento@torreeje.com', '507-215-3000', 
         'Avenida Samuel Lewis, Torre Ejecutiva', 'PANAMA', 'PANAMA', 
         'RUC', '155555555-3-2020', 'PA', 'Mantenimiento corporativo - Oficinas')
    ON CONFLICT DO NOTHING;
    
    -- Instaladores especializados
    INSERT INTO installers (
        emitter_id, full_name, phone, email, specialties, 
        certification_level, hourly_rate, is_active
    ) VALUES
        (emitter_id, 'Luis Méndez', '507-6123-4567', 'luis.mendez@zetterx.com', 
         'Ventanas corredizas, Puertas batientes', 'SENIOR', 18.50, true),
        
        (emitter_id, 'Carlos Rivera', '507-6234-5678', 'carlos.rivera@zetterx.com', 
         'Vidrio templado, Paneles especiales', 'EXPERT', 22.00, true),
        
        (emitter_id, 'Ana Vargas', '507-6345-6789', 'ana.vargas@zetterx.com', 
         'Puertas pesadas, Sistemas de seguridad', 'SENIOR', 20.00, true),
        
        (emitter_id, 'Miguel Torres', '507-6456-7890', 'miguel.torres@zetterx.com', 
         'Instalación integral, Supervisión', 'EXPERT', 25.00, true)
    ON CONFLICT DO NOTHING;
    
    -- Equipos de instalación
    INSERT INTO installer_teams (emitter_id, name, max_concurrent_jobs, is_active) VALUES
        (emitter_id, 'Equipo Alpha Glass', 3, true),
        (emitter_id, 'Equipo Beta Doors', 2, true)
    ON CONFLICT DO NOTHING;
    
    -- Zonas de precio (área metropolitana de Panamá)
    INSERT INTO price_zones (emitter_id, name, multiplier, delivery_days, notes) VALUES
        (emitter_id, 'Panamá Centro', 1.00, 1, 'Casco urbano - Sin costo adicional'),
        (emitter_id, 'Costa del Este', 1.05, 1, 'Zona premium - 5% adicional'),
        (emitter_id, 'Panamá Oeste', 1.10, 2, 'Chorrera, Capira - 10% adicional'),
        (emitter_id, 'Interior República', 1.25, 5, 'Provincias centrales - 25% adicional'),
        (emitter_id, 'Colón Industrial', 1.15, 3, 'Zona Libre Colón - 15% adicional')
    ON CONFLICT DO NOTHING;
    
    -- Metas de ventas para manufactura
    INSERT INTO weekly_targets (emitter_id, year, week_number, target_amount, target_orders) VALUES
        -- Primer trimestre (temporada alta construcción)
        (emitter_id, EXTRACT(YEAR FROM CURRENT_DATE), 1, 3500.00, 2),
        (emitter_id, EXTRACT(YEAR FROM CURRENT_DATE), 2, 4200.00, 3),
        (emitter_id, EXTRACT(YEAR FROM CURRENT_DATE), 3, 4800.00, 3),
        (emitter_id, EXTRACT(YEAR FROM CURRENT_DATE), 4, 5200.00, 4),
        -- Segundo trimestre (pico de temporada seca)
        (emitter_id, EXTRACT(YEAR FROM CURRENT_DATE), 13, 6500.00, 5),
        (emitter_id, EXTRACT(YEAR FROM CURRENT_DATE), 14, 7200.00, 5),
        (emitter_id, EXTRACT(YEAR FROM CURRENT_DATE), 15, 7800.00, 6),
        (emitter_id, EXTRACT(YEAR FROM CURRENT_DATE), 16, 8000.00, 6),
        -- Temporada de lluvia (menor actividad)
        (emitter_id, EXTRACT(YEAR FROM CURRENT_DATE), 26, 4500.00, 3),
        (emitter_id, EXTRACT(YEAR FROM CURRENT_DATE), 27, 4200.00, 3)
    ON CONFLICT DO NOTHING;
    
END $$;
