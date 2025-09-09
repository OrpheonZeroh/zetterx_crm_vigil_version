-- =========================================================
-- ZETTERX CRM - CLEAN DATABASE RESET
-- Elimina toda la estructura existente para empezar limpio
-- =========================================================

-- ⚠️  CUIDADO: Este script elimina TODOS los datos existentes

-- Eliminar todas las tablas si existen
DROP TABLE IF EXISTS invoice_api_calls CASCADE;
DROP TABLE IF EXISTS invoice_notifications CASCADE;
DROP TABLE IF EXISTS invoice_payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS quote_items CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS installation_slots CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS installer_team_members CASCADE;
DROP TABLE IF EXISTS installer_teams CASCADE;
DROP TABLE IF EXISTS installers CASCADE;
DROP TABLE IF EXISTS price_zones CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS weekly_targets CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS emitter_series CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS emitters CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organization CASCADE;

-- Eliminar tipos enumerados si existen
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS slot_status CASCADE;
DROP TYPE IF EXISTS work_order_status CASCADE;
DROP TYPE IF EXISTS crm_status CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS email_status CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;

-- Mensaje de confirmación
SELECT 'Base de datos limpiada completamente - lista para nuevo esquema' AS status;
