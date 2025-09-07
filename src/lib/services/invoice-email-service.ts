'use client'

import { DGIProcessorService, DGIInvoiceData } from './dgi-processor-service'
import { PDFGeneratorService } from './pdf-generator-service'
import { EmailService } from './email-service'
import { supabase } from '@/lib/supabase'

export interface InvoiceEmailResult {
  success: boolean
  message: string
  emailSent?: boolean
  cufe?: string
  protocolNumber?: string
}

export interface SendInvoiceEmailParams {
  dgiResponse: any // Respuesta completa del DGI-FEP
  customerEmail?: string
  workOrderId?: string
  invoiceId?: string
}

export class InvoiceEmailService {
  /**
   * Procesa una factura DGI y la envía por email automáticamente
   */
  static async processAndSendInvoice(params: SendInvoiceEmailParams): Promise<InvoiceEmailResult> {
    try {
      console.log('🚀 Iniciando procesamiento de factura para envío por email')

      // 1. Procesar respuesta DGI
      const processedInvoice = DGIProcessorService.processDGIResponse(params.dgiResponse)
      if (!processedInvoice) {
        return {
          success: false,
          message: 'Error al procesar la respuesta del DGI'
        }
      }

      console.log(`📋 Factura procesada: ${processedInvoice.numeroFactura}`)

      // 2. Verificar que la factura fue autorizada
      if (!DGIProcessorService.isInvoiceAuthorized(processedInvoice)) {
        return {
          success: false,
          message: `Factura no autorizada: ${processedInvoice.estado.mensaje}`,
          cufe: processedInvoice.cufe
        }
      }

      // 3. Guardar información de la factura en la base de datos
      await this.saveInvoiceData(processedInvoice, params.workOrderId, params.invoiceId)

      // 4. Generar PDF
      console.log('📄 Generando PDF de la factura')
      const pdfBase64 = await PDFGeneratorService.generatePDFBase64(processedInvoice)

      // 5. Enviar por email
      const customerEmail = params.customerEmail || processedInvoice.cliente.email
      if (!customerEmail) {
        return {
          success: false,
          message: 'No se encontró email del cliente para envío',
          cufe: processedInvoice.cufe,
          protocolNumber: processedInvoice.protocoloAutorizacion
        }
      }

      console.log(`📧 Enviando factura por email a: ${customerEmail}`)
      const emailSent = await EmailService.sendInvoiceEmail(
        processedInvoice,
        pdfBase64,
        customerEmail
      )

      if (!emailSent) {
        return {
          success: false,
          message: 'Error al enviar el email con la factura',
          cufe: processedInvoice.cufe,
          protocolNumber: processedInvoice.protocoloAutorizacion
        }
      }

      // 6. Actualizar estado en base de datos
      await this.updateInvoiceEmailStatus(params.invoiceId, true, customerEmail)

      console.log('✅ Factura procesada y enviada exitosamente')

      return {
        success: true,
        message: 'Factura procesada y enviada por email exitosamente',
        emailSent: true,
        cufe: processedInvoice.cufe,
        protocolNumber: processedInvoice.protocoloAutorizacion
      }

    } catch (error) {
      console.error('❌ Error en processAndSendInvoice:', error)
      return {
        success: false,
        message: `Error procesando factura: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }
    }
  }

  /**
   * Reenvía una factura por email usando datos existentes
   */
  static async resendInvoiceEmail(
    invoiceId: string, 
    customerEmail: string
  ): Promise<InvoiceEmailResult> {
    try {
      console.log(`🔄 Reenviando factura ID: ${invoiceId}`)

      // 1. Obtener datos de la factura desde la base de datos
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          work_order:work_orders(
            *,
            customer:customers(name, email)
          )
        `)
        .eq('id', invoiceId)
        .single()

      if (error || !invoice) {
        return {
          success: false,
          message: 'Factura no encontrada'
        }
      }

      // 2. Verificar que tenga datos DGI
      if (!invoice.cufe || !invoice.dgi_data) {
        return {
          success: false,
          message: 'La factura no tiene información DGI completa'
        }
      }

      // 3. Reconstruir objeto DGIInvoiceData desde la base de datos
      const invoiceData = this.reconstructInvoiceDataFromDB(invoice)

      // 4. Generar PDF nuevamente
      const pdfBase64 = await PDFGeneratorService.generatePDFBase64(invoiceData)

      // 5. Enviar email
      const emailSent = await EmailService.sendInvoiceEmail(
        invoiceData,
        pdfBase64,
        customerEmail
      )

      if (!emailSent) {
        return {
          success: false,
          message: 'Error al reenviar el email'
        }
      }

      // 6. Actualizar registro de reenvío
      await this.logEmailResend(invoiceId, customerEmail)

      return {
        success: true,
        message: 'Factura reenviada exitosamente',
        emailSent: true,
        cufe: invoice.cufe
      }

    } catch (error) {
      console.error('❌ Error en resendInvoiceEmail:', error)
      return {
        success: false,
        message: `Error reenviando factura: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }
    }
  }

  /**
   * Guarda la información de la factura DGI en la base de datos
   */
  private static async saveInvoiceData(
    invoiceData: DGIInvoiceData,
    workOrderId?: string,
    invoiceId?: string
  ): Promise<void> {
    try {
      const invoiceRecord = {
        cufe: invoiceData.cufe,
        dgi_protocol: invoiceData.protocoloAutorizacion,
        dgi_status: invoiceData.estado.codigo,
        dgi_message: invoiceData.estado.mensaje,
        qr_url: invoiceData.urlQR,
        validation_url: invoiceData.urlConsulta,
        dgi_data: JSON.stringify(invoiceData),
        email_sent: false,
        updated_at: new Date().toISOString()
      }

      if (invoiceId) {
        // Actualizar factura existente
        const { error } = await supabase
          .from('invoices')
          .update(invoiceRecord)
          .eq('id', invoiceId)

        if (error) throw error
      } else if (workOrderId) {
        // Buscar factura por work_order_id
        const { error } = await supabase
          .from('invoices')
          .update(invoiceRecord)
          .eq('work_order_id', workOrderId)

        if (error) throw error
      }

      console.log('💾 Datos de factura DGI guardados en base de datos')

    } catch (error) {
      console.error('Error saving invoice data:', error)
      throw error
    }
  }

  /**
   * Actualiza el estado de envío por email
   */
  private static async updateInvoiceEmailStatus(
    invoiceId?: string,
    emailSent: boolean = false,
    emailAddress?: string
  ): Promise<void> {
    try {
      if (!invoiceId) return

      const { error } = await supabase
        .from('invoices')
        .update({
          email_sent: emailSent,
          email_sent_at: emailSent ? new Date().toISOString() : null,
          email_address: emailAddress,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)

      if (error) throw error

    } catch (error) {
      console.error('Error updating email status:', error)
    }
  }

  /**
   * Registra un reenvío de email
   */
  private static async logEmailResend(invoiceId: string, emailAddress: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invoice_email_log')
        .insert({
          invoice_id: invoiceId,
          email_address: emailAddress,
          sent_at: new Date().toISOString(),
          type: 'resend'
        })

      if (error) {
        console.error('Error logging email resend:', error)
      }

    } catch (error) {
      console.error('Error logging email resend:', error)
    }
  }

  /**
   * Reconstruye DGIInvoiceData desde la base de datos
   */
  private static reconstructInvoiceDataFromDB(invoice: any): DGIInvoiceData {
    // Si ya tenemos los datos DGI guardados, los usamos
    if (invoice.dgi_data) {
      return JSON.parse(invoice.dgi_data)
    }

    // Si no, reconstruimos con los datos disponibles
    return {
      cufe: invoice.cufe || '',
      numeroFactura: invoice.invoice_number || '',
      fechaEmision: invoice.issue_date || new Date().toISOString(),
      protocoloAutorizacion: invoice.dgi_protocol || '',
      urlQR: invoice.qr_url || '',
      urlConsulta: invoice.validation_url || '',
      estado: {
        codigo: invoice.dgi_status || '',
        mensaje: invoice.dgi_message || ''
      },
      emisor: {
        ruc: 'RUC_EMPRESA',
        nombre: 'EMPRESA_NOMBRE',
        direccion: 'DIRECCION_EMPRESA',
        telefono: 'TELEFONO_EMPRESA'
      },
      cliente: {
        nombre: invoice.work_order?.customer?.name || 'Cliente',
        direccion: 'Dirección del cliente',
        telefono: 'Teléfono del cliente',
        email: invoice.work_order?.customer?.email || '',
        tipoDocumento: '02'
      },
      items: [
        {
          seccion: '001',
          descripcion: 'Servicios prestados',
          codigo: 'SERV-001',
          cantidad: 1,
          precioUnitario: invoice.total_amount || 0,
          descuento: 0,
          total: invoice.total_amount || 0,
          itbms: 0
        }
      ],
      totales: {
        subtotal: invoice.total_amount || 0,
        descuentoTotal: 0,
        itbmsTotal: 0,
        total: invoice.total_amount || 0,
        totalRecibido: invoice.total_amount || 0,
        numeroItems: 1
      },
      formaPago: {
        tipo: '02',
        valor: invoice.total_amount || 0
      }
    }
  }

  /**
   * Obtiene el estado de una factura
   */
  static async getInvoiceEmailStatus(invoiceId: string) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('cufe, email_sent, email_sent_at, email_address, dgi_status, dgi_message')
        .eq('id', invoiceId)
        .single()

      if (error) throw error

      return {
        success: true,
        data: {
          hasCufe: !!data.cufe,
          emailSent: data.email_sent || false,
          emailSentAt: data.email_sent_at,
          emailAddress: data.email_address,
          dgiStatus: data.dgi_status,
          dgiMessage: data.dgi_message
        }
      }

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }
}
