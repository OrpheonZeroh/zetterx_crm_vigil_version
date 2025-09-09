-- =========================================================
--  CORE / SINGLE-TENANT (1 ORGANIZACIÓN POR PROYECTO)
-- =========================================================
CREATE TABLE organization (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  ruc_tipo        TEXT,           -- dTipoRuc
  ruc_numero      TEXT,           -- dRuc
  ruc_dv          TEXT,           -- dDV
  branch_code     TEXT,           -- dSucEm
  phone           TEXT,
  email           TEXT,
  address_line    TEXT,
  ubi_code        TEXT,           -- dCodUbi (ej: 8-8-8)
  province        TEXT,
  district        TEXT,
  corregimiento   TEXT,
  coords          TEXT,           -- "lat,lon"
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('admin','ops','sales','tech','viewer')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
--  CLIENTES / PRODUCTOS / SERVICIOS
-- =========================================================
CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  address_line    TEXT,
  country_code    TEXT DEFAULT 'PA',
  ubi_code        TEXT,         -- dCodUbi del receptor
  province        TEXT,
  district        TEXT,
  corregimiento   TEXT,
  tax_id_type     TEXT,         -- iTipoRec o similar
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE,               -- dCodProd (RADIO-001)
  description     TEXT NOT NULL,            -- dDescProd
  unit_price      NUMERIC(12,2) NOT NULL,
  itbms_rate      NUMERIC(5,2) NOT NULL DEFAULT 0.00,  -- % (00, 07, 10, etc.)
  is_service      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
--  ZONAS Y PRECIOS (TABLA DE PRECIOS POR ÁREA)
-- =========================================================
CREATE TABLE price_zones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province        TEXT NOT NULL,
  district        TEXT NOT NULL,
  corregimiento   TEXT NOT NULL,
  price_min       NUMERIC(12,2) NOT NULL,
  price_max       NUMERIC(12,2) NOT NULL,
  effective_from  DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to    DATE,
  CHECK (price_max >= price_min)
);

CREATE INDEX ON price_zones (province, district, corregimiento);

-- =========================================================
--  INSPECCIONES / ÓRDENES DE TRABAJO / INSTALADORES / AGENDA
-- =========================================================
CREATE TABLE installers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE installer_teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE installer_team_members (
  team_id         UUID NOT NULL REFERENCES installer_teams(id) ON DELETE CASCADE,
  installer_id    UUID NOT NULL REFERENCES installers(id) ON DELETE CASCADE,
  is_lead         BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (team_id, installer_id)
);

-- Oportunidad / Proyecto / Orden de trabajo
CREATE TABLE work_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  title           TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('lead','quoted','approved','scheduled','in_progress','completed','cancelled')),
  estimated_value NUMERIC(12,2),
  address_line    TEXT,
  province        TEXT,
  district        TEXT,
  corregimiento   TEXT,
  ubi_code        TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inspecciones previas (con resultados y fotos)
CREATE TABLE inspections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  inspector_id    UUID REFERENCES users(id),
  price_zone_id   UUID REFERENCES price_zones(id),
  quoted_min      NUMERIC(12,2),
  quoted_max      NUMERIC(12,2),
  notes           TEXT,
  photos_urls     TEXT[],  -- o usa almacenamiento externo + tabla adjuntos
  result          TEXT,     -- breve resumen de hallazgos
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Slots de instalación calendarizados
CREATE TABLE installation_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  team_id         UUID REFERENCES installer_teams(id),
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('scheduled','confirmed','in_progress','done','no_show','cancelled')),
  cost_estimate   NUMERIC(12,2),  -- para control por costo/tiempo
  notes           TEXT,
  UNIQUE (work_order_id, start_at)
);

-- Metas semanales y performance
CREATE TABLE weekly_targets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start      DATE NOT NULL,  -- lunes de la semana (o domingo, define convención)
  amount_target   NUMERIC(12,2) NOT NULL DEFAULT 3000.00,
  UNIQUE (week_start)
);

-- =========================================================
--  FACTURACIÓN (DGI) + ITEMS + PAGOS + Trazabilidad API
-- =========================================================

-- Catálogo de formas de pago (opcional) de mapeo a iFormaPago
CREATE TABLE payment_methods (
  code            TEXT PRIMARY KEY,  -- '01'=Efectivo, '02'=Tarjeta, etc. (ajusta al catálogo real)
  description     TEXT NOT NULL
);

-- Facturas (snapshot + campos DGI)
CREATE TABLE invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id     UUID REFERENCES work_orders(id),
  customer_id       UUID REFERENCES customers(id),

  -- dGen
  env_code          INT  NOT NULL,                      -- iAmb
  emission_type     TEXT NOT NULL,                      -- iTpEmis
  doc_type          TEXT NOT NULL,                      -- iDoc (01 Factura)
  doc_number        TEXT NOT NULL,                      -- dNroDF
  pos_code          TEXT,                               -- dPtoFacDF
  issue_date        TIMESTAMPTZ NOT NULL,               -- dFechaEm
  exit_date         TIMESTAMPTZ,                        -- dFechaSalida
  nat_op            TEXT,                               -- iNatOp
  tipo_op           TEXT,                               -- iTipoOp
  dest              TEXT,                               -- iDest
  form_cafe         TEXT,                               -- iFormCAFE
  ent_cafe          TEXT,                               -- iEntCAFE
  env_fe            TEXT,                               -- dEnvFE
  sale_tran_type    TEXT,                               -- iTipoTranVenta
  version           TEXT,                               -- dVerForm

  -- Snapshot EMISOR (por inmutabilidad)
  emis_name         TEXT,
  emis_branch       TEXT,
  emis_coords       TEXT,
  emis_address      TEXT,
  emis_ruc_tipo     TEXT,
  emis_ruc_num      TEXT,
  emis_ruc_dv       TEXT,
  emis_ubi_code     TEXT,
  emis_correg       TEXT,
  emis_district     TEXT,
  emis_province     TEXT,
  emis_phone        TEXT,

  -- Snapshot RECEPTOR
  rec_type          TEXT,        -- iTipoRec
  rec_name          TEXT,
  rec_address       TEXT,
  rec_country       TEXT,
  rec_ubi_code      TEXT,
  rec_correg        TEXT,
  rec_district      TEXT,
  rec_province      TEXT,
  rec_phone         TEXT,
  rec_email         TEXT,

  -- Totales
  total_net         NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- dTotNeto
  total_itbms       NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- dTotITBMS
  total_isc         NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- dTotISC
  total_gravado     NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- dTotGravado
  total_discount    NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- dTotDesc
  total_amount      NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- dVTot
  total_received    NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- dTotRec
  num_payments      INT,
  num_items         INT,
  items_total       NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- dVTotItems

  -- Estado de la factura en tu app
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','accepted','rejected','cancelled')),

  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pos_code, doc_number)
);

CREATE INDEX ON invoices (issue_date);
CREATE INDEX ON invoices (work_order_id);
CREATE INDEX ON invoices (customer_id);

CREATE TABLE invoice_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  line_seq        INT NOT NULL,                         -- dSecItem
  product_code    TEXT,                                 -- dCodProd
  description     TEXT NOT NULL,                        -- dDescProd
  quantity        NUMERIC(12,3) NOT NULL,               -- dCantCodInt
  clas_sabr       TEXT,                                 -- dCodCPBSabr
  clas_cmp        TEXT,                                 -- dCodCPBScmp
  unit_price      NUMERIC(12,2) NOT NULL,               -- dPrUnit
  unit_discount   NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- dPrUnitDesc
  line_price      NUMERIC(12,2) NOT NULL,               -- dPrItem
  line_total      NUMERIC(12,2) NOT NULL,               -- dValTotItem
  itbms_rate      NUMERIC(5,2) NOT NULL DEFAULT 0.00,   -- dTasaITBMS
  itbms_value     NUMERIC(12,2) NOT NULL DEFAULT 0.00   -- dValITBMS
);

CREATE UNIQUE INDEX ON invoice_items (invoice_id, line_seq);

CREATE TABLE invoice_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  method_code     TEXT NOT NULL REFERENCES payment_methods(code),  -- iFormaPago
  amount          NUMERIC(12,2) NOT NULL,                          -- dVlrCuota
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notificaciones ligadas al gExtra.gNotification
CREATE TABLE invoice_notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  channel         TEXT NOT NULL,                -- 'Email'
  receiver_name   TEXT,
  receiver_email  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  provider_msg_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trazabilidad de llamadas a la API DGI / Gateway
CREATE TABLE invoice_api_calls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        UUID REFERENCES invoices(id) ON DELETE SET NULL,
  endpoint          TEXT NOT NULL,                         -- '/mdl18/feRecepFEDGI'
  method            TEXT NOT NULL DEFAULT 'POST',
  used_credential   TEXT,                                  -- alias/id de credencial, no el secreto
  request_payload   JSONB NOT NULL,
  response_payload  JSONB,
  http_status       INT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','error')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
--  PRESUPUESTOS / COTIZACIONES (opcional pero útil)
-- =========================================================
CREATE TABLE quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  version         INT NOT NULL DEFAULT 1,
  status          TEXT NOT NULL CHECK (status IN ('draft','sent','approved','rejected','expired')),
  subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  itbms_total     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount_total  NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total           NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE quote_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id        UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  line_seq        INT NOT NULL,
  product_code    TEXT,
  description     TEXT NOT NULL,
  quantity        NUMERIC(12,3) NOT NULL,
  unit_price      NUMERIC(12,2) NOT NULL,
  itbms_rate      NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  discount        NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  line_total      NUMERIC(12,2) NOT NULL
);

CREATE UNIQUE INDEX ON quote_items (quote_id, line_seq);

-- =========================================================
--  DATOS INICIALES
-- =========================================================

-- Insertar organización por defecto
INSERT INTO organization (name, ruc_tipo, ruc_numero, ruc_dv, branch_code, phone, email, address_line, ubi_code, province, district, corregimiento) 
VALUES ('Mi Empresa', 'RUC', '12345678', '9', '001', '+507 123-4567', 'admin@miempresa.com', 'Calle Principal 123', '8-8-8', 'PANAMA', 'PANAMA', '24 de dic');

-- Insertar usuario admin por defecto
INSERT INTO users (full_name, email, role) 
VALUES ('Administrador', 'admin@miempresa.com', 'admin');

-- Insertar métodos de pago básicos
INSERT INTO payment_methods (code, description) VALUES 
('01', 'Efectivo'),
('02', 'Tarjeta de Crédito'),
('03', 'Tarjeta de Débito'),
('04', 'Transferencia Bancaria'),
('05', 'Cheque');
