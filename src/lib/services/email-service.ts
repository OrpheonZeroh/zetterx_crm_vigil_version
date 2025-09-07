'use client'

import { DGIInvoiceData } from './dgi-processor-service'

export interface EmailConfig {
  apiKey: string
  senderEmail: string
  senderName: string
}

export interface EmailAttachment {
  name: string
  content: string // Base64 encoded content
  type: string // MIME type
}

export interface EmailData {
  to: string
  toName: string
  subject: string
  htmlContent: string
  attachment?: EmailAttachment
}

export class EmailService {
  private static readonly BREVO_API_URL = 'https://api.brevo.com/v3'
  private static readonly API_KEY = 'mDqC2MHrdpRES17a'
  private static readonly SENDER_EMAIL = 'jadamson382@gmail.com'
  private static readonly SENDER_NAME = 'ZetterX CRM'

  /**
   * Envía un email usando la API de Brevo
   */
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const payload = {
        sender: {
          name: this.SENDER_NAME,
          email: this.SENDER_EMAIL
        },
        to: [
          {
            email: emailData.to,
            name: emailData.toName
          }
        ],
        subject: emailData.subject,
        htmlContent: emailData.htmlContent,
        attachment: emailData.attachment ? [
          {
            name: emailData.attachment.name,
            content: emailData.attachment.content
          }
        ] : undefined
      }

      const response = await fetch(`${this.BREVO_API_URL}/smtp/email`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.API_KEY
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Error sending email:', error)
        return false
      }

      const result = await response.json()
      console.log('Email sent successfully:', result.messageId)
      return true

    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  /**
   * Envía factura por email con PDF adjunto
   */
  static async sendInvoiceEmail(
    invoiceData: DGIInvoiceData, 
    pdfBase64: string,
    customerEmail?: string
  ): Promise<boolean> {
    try {
      const clientEmail = customerEmail || invoiceData.cliente.email
      
      if (!clientEmail) {
        console.error('No email provided for customer')
        return false
      }

      const emailData: EmailData = {
        to: clientEmail,
        toName: invoiceData.cliente.nombre,
        subject: `Factura Electrónica #${invoiceData.numeroFactura} - ${invoiceData.emisor.nombre}`,
        htmlContent: this.generateInvoiceEmailTemplate(invoiceData),
        attachment: {
          name: `Factura_${invoiceData.numeroFactura}.pdf`,
          content: pdfBase64,
          type: 'application/pdf'
        }
      }

      return await this.sendEmail(emailData)

    } catch (error) {
      console.error('Error sending invoice email:', error)
      return false
    }
  }

  /**
   * Genera la plantilla HTML para el email de factura
   */
  private static generateInvoiceEmailTemplate(invoiceData: DGIInvoiceData): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'PAB'
      }).format(amount)
    }

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura Electrónica</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .info-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #667eea;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
          }
          .info-item { 
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .info-item:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; margin-top: 5px; }
          .amount { 
            font-size: 24px; 
            font-weight: bold; 
            color: #28a745;
            text-align: center;
            background: #f8fff8;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #28a745;
            margin: 20px 0;
          }
          .qr-section {
            text-align: center;
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            border: 2px dashed #667eea;
            margin: 20px 0;
          }
          .btn {
            display: inline-block;
            background: #667eea;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            margin: 10px;
            font-weight: bold;
          }
          .btn:hover { background: #5a6fd8; }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .status-badge {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📧 Factura Electrónica</h1>
          <p>Su factura ha sido procesada exitosamente</p>
        </div>

        <div class="info-section">
          <div class="status-badge">✅ ${invoiceData.estado.mensaje}</div>
          <h2>📋 Información de la Factura</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Número de Factura:</div>
              <div class="value">#${invoiceData.numeroFactura}</div>
            </div>
            <div class="info-item">
              <div class="label">Fecha de Emisión:</div>
              <div class="value">${new Date(invoiceData.fechaEmision).toLocaleDateString('es-PA')}</div>
            </div>
            <div class="info-item">
              <div class="label">CUFE:</div>
              <div class="value" style="word-break: break-all; font-size: 11px;">${invoiceData.cufe}</div>
            </div>
            <div class="info-item">
              <div class="label">Protocolo:</div>
              <div class="value">${invoiceData.protocoloAutorizacion}</div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <h2>🏢 Datos del Emisor</h2>
          <div class="info-item">
            <div class="label">Empresa:</div>
            <div class="value">${invoiceData.emisor.nombre}</div>
          </div>
          <div class="info-item">
            <div class="label">RUC:</div>
            <div class="value">${invoiceData.emisor.ruc}</div>
          </div>
          <div class="info-item">
            <div class="label">Dirección:</div>
            <div class="value">${invoiceData.emisor.direccion}</div>
          </div>
        </div>

        <div class="amount">
          💰 Total: ${formatCurrency(invoiceData.totales.total)}
        </div>

        <div class="info-section">
          <h2>📊 Resumen de Facturación</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Subtotal:</div>
              <div class="value">${formatCurrency(invoiceData.totales.subtotal)}</div>
            </div>
            <div class="info-item">
              <div class="label">ITBMS:</div>
              <div class="value">${formatCurrency(invoiceData.totales.itbmsTotal)}</div>
            </div>
            <div class="info-item">
              <div class="label">Descuentos:</div>
              <div class="value">${formatCurrency(invoiceData.totales.descuentoTotal)}</div>
            </div>
            <div class="info-item">
              <div class="label">Artículos:</div>
              <div class="value">${invoiceData.totales.numeroItems}</div>
            </div>
          </div>
        </div>

        <div class="qr-section">
          <h3>🔍 Validación en Línea</h3>
          <p>Puede verificar la autenticidad de esta factura en:</p>
          <a href="${invoiceData.urlQR}" class="btn" target="_blank">
            📱 Consultar con QR
          </a>
          <a href="${invoiceData.urlConsulta}" class="btn" target="_blank">
            🌐 Consultar por CUFE
          </a>
        </div>

        <div class="footer">
          <p>
            <strong>Factura Electrónica Autorizada por la DGI</strong><br>
            Este documento ha sido procesado y autorizado por el sistema de Facturación Electrónica de Panamá
          </p>
          <p style="font-size: 12px; margin-top: 15px;">
            📎 Encontrará el PDF oficial de su factura adjunto a este correo.<br>
            Para cualquier consulta, puede contactarnos respondiendo a este email.
          </p>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Envía email de notificación simple
   */
  static async sendNotificationEmail(
    to: string,
    toName: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
          <h2 style="color: #333; margin-top: 0;">📧 ${subject}</h2>
          <p style="color: #555; line-height: 1.6;">${message}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            Este mensaje fue enviado desde ZetterX CRM
          </p>
        </div>
      </div>
    `

    return await this.sendEmail({
      to,
      toName,
      subject,
      htmlContent
    })
  }
}
