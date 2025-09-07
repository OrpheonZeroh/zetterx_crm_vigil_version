-- =========================================================
--  MIGRACIÓN: Agregar campos DGI y Email a tabla invoices
-- =========================================================

-- Agregar campos DGI faltantes a la tabla invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cufe TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS dgi_protocol TEXT;  
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS dgi_status TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS dgi_message TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qr_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS validation_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS dgi_data JSONB;

-- Agregar campos de email
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS email_address TEXT;

-- Índices para consultas de DGI
CREATE INDEX IF NOT EXISTS idx_invoices_cufe ON invoices (cufe);
CREATE INDEX IF NOT EXISTS idx_invoices_dgi_status ON invoices (dgi_status);
CREATE INDEX IF NOT EXISTS idx_invoices_email_sent ON invoices (email_sent);

-- =========================================================
--  TABLA: Log de envío de emails de facturas
-- =========================================================
CREATE TABLE IF NOT EXISTS invoice_email_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  email_address   TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'send' CHECK (type IN ('send', 'resend')),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message   TEXT,
  brevo_message_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_email_log_invoice_id ON invoice_email_log (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_email_log_sent_at ON invoice_email_log (sent_at);

-- =========================================================
--  ACTUALIZAR campos invoice_number para compatibilidad
-- =========================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Actualizar invoice_number con doc_number donde esté vacío
UPDATE invoices 
SET invoice_number = doc_number 
WHERE invoice_number IS NULL AND doc_number IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN invoices.cufe IS 'Código Único de Factura Electrónica del DGI';
COMMENT ON COLUMN invoices.dgi_protocol IS 'Número de protocolo de autorización DGI';
COMMENT ON COLUMN invoices.dgi_status IS 'Código de estado de respuesta DGI (ej: 0260)';
COMMENT ON COLUMN invoices.dgi_message IS 'Mensaje de estado DGI (ej: Autorizado el uso de la FE)';
COMMENT ON COLUMN invoices.qr_url IS 'URL del código QR para consulta de factura';
COMMENT ON COLUMN invoices.validation_url IS 'URL alternativa para validación por CUFE';
COMMENT ON COLUMN invoices.dgi_data IS 'Datos completos procesados de respuesta DGI (JSON)';
COMMENT ON COLUMN invoices.email_sent IS 'Indica si la factura fue enviada por email';
COMMENT ON COLUMN invoices.email_sent_at IS 'Timestamp del primer envío exitoso por email';
COMMENT ON COLUMN invoices.email_address IS 'Email donde fue enviada la factura';

COMMENT ON TABLE invoice_email_log IS 'Log de todos los envíos de facturas por email';
