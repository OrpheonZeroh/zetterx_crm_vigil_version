import { Resend } from 'resend'
import { Quote } from './quote-service'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface QuoteEmailData {
  quote: Quote
  recipientEmail: string
  recipientName: string
  senderName?: string
  customMessage?: string
}

export class QuoteEmailService {
  static async sendQuoteByEmail(data: QuoteEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { quote, recipientEmail, recipientName, senderName = 'ZetterX', customMessage } = data

      const emailHtml = this.generateQuoteEmailHtml(quote, recipientName, senderName, customMessage)

      const { data: emailData, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: recipientEmail,
        subject: `Cotización #${quote.id?.slice(-8)} - ${senderName}`,
        html: emailHtml,
        text: this.generateQuoteEmailText(quote, recipientName, senderName)
      })

      if (error) {
        console.error('Error sending quote email:', error)
        return { success: false, error: error.message }
      }

      return { success: true, messageId: emailData?.id }
    } catch (error: any) {
      console.error('Error in sendQuoteByEmail:', error)
      return { success: false, error: error.message || 'Error desconocido al enviar el email' }
    }
  }

  private static generateQuoteEmailHtml(quote: Quote, recipientName: string, senderName: string, customMessage?: string): string {
    const customerName = quote.customers?.name || recipientName
    const subtotal = quote.subtotal || 0
    const itbmsTotal = quote.itbms_total || 0
    const total = quote.total || 0
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotización ${quote.id?.slice(-8)}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .quote-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .quote-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .quote-table th, .quote-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    .quote-table th { background-color: #f8f9fa; font-weight: bold; }
    .total-section { background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .total-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .total-final { font-size: 1.2em; font-weight: bold; border-top: 2px solid #2563eb; padding-top: 10px; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
    .btn { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${senderName}</h1>
      <p>Cotización Profesional</p>
    </div>
    
    <div class="content">
      <h2>Estimado/a ${recipientName},</h2>
      
      ${customMessage ? `<p>${customMessage}</p>` : `
        <p>Esperamos que se encuentre bien. Adjuntamos la cotización solicitada con todos los detalles de nuestros servicios.</p>
      `}
      
      <div class="quote-details">
        <h3>Detalles de la Cotización</h3>
        <p><strong>Cotización ID:</strong> #${quote.id?.slice(-8)}</p>
        <p><strong>Cliente:</strong> ${customerName}</p>
        <p><strong>Estado:</strong> ${this.getStatusLabel(quote.status)}</p>
        <p><strong>Fecha:</strong> ${quote.created_at ? new Date(quote.created_at).toLocaleDateString('es-PA') : new Date().toLocaleDateString('es-PA')}</p>
        ${quote.notes ? `<p><strong>Notas:</strong> ${quote.notes}</p>` : ''}
      </div>

      <div class="total-section">
        <h3>Resumen Financiero</h3>
        <div class="total-row">
          <span>Subtotal:</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>ITBMS (7%):</span>
          <span>$${itbmsTotal.toFixed(2)}</span>
        </div>
        ${quote.discount_total > 0 ? `
        <div class="total-row">
          <span>Descuento:</span>
          <span>-$${quote.discount_total.toFixed(2)}</span>
        </div>` : ''}
        <div class="total-row total-final">
          <span>TOTAL:</span>
          <span>$${total.toFixed(2)}</span>
        </div>
      </div>

      <p>Esta cotización tiene una validez de 30 días a partir de la fecha de emisión. Si tiene alguna pregunta o desea proceder con el proyecto, no dude en contactarnos.</p>
      
      <p>Gracias por considerar nuestros servicios.</p>
      
      <p>Atentamente,<br>
      <strong>Equipo ${senderName}</strong></p>
    </div>
    
    <div class="footer">
      <p>Este email fue enviado desde el sistema de gestión de ${senderName}</p>
      <p>Para cualquier consulta, responda a este email o contacte a nuestro equipo de ventas.</p>
    </div>
  </div>
</body>
</html>
    `
  }

  private static generateQuoteEmailText(quote: Quote, recipientName: string, senderName: string): string {
    const customerName = quote.customers?.name || recipientName
    const total = quote.total || 0
    
    return `
Estimado/a ${recipientName},

Adjuntamos la cotización solicitada:

DETALLES DE LA COTIZACIÓN
========================
Cotización ID: #${quote.id?.slice(-8)}
Cliente: ${customerName}
Estado: ${this.getStatusLabel(quote.status)}
Fecha: ${quote.created_at ? new Date(quote.created_at).toLocaleDateString('es-PA') : new Date().toLocaleDateString('es-PA')}

TOTAL: $${total.toFixed(2)}

Esta cotización tiene una validez de 30 días a partir de la fecha de emisión.

Gracias por considerar nuestros servicios.

Atentamente,
Equipo ${senderName}

---
Este email fue enviado desde el sistema de gestión de ${senderName}
    `
  }

  private static getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'Borrador',
      'sent': 'Enviada',
      'approved': 'Aprobada', 
      'rejected': 'Rechazada',
      'expired': 'Expirada'
    }
    return statusMap[status] || status
  }
}
