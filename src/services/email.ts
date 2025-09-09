import { Resend } from 'resend';
import { EmailStatus } from '@/types/dgi';

const resend = new Resend(process.env.RESEND_API_KEY!);

export class EmailService {
  /**
   * Send invoice email with PDF attachment
   */
  async sendInvoiceEmail(
    to: string,
    subject: string,
    customerName: string,
    invoiceNumber: string,
    cufe: string,
    urlCufe: string,
    pdfBuffer?: Buffer,
    xmlBuffer?: Buffer,
    cc?: string[]
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const attachments: Array<{ filename: string; content: Buffer }> = [];
      
      if (pdfBuffer) {
        attachments.push({
          filename: `Factura_${invoiceNumber}.pdf`,
          content: pdfBuffer
        });
      }
      
      if (xmlBuffer) {
        attachments.push({
          filename: `Factura_${invoiceNumber}.xml`,
          content: xmlBuffer
        });
      }

      const htmlContent = this.generateInvoiceEmailHTML(
        customerName,
        invoiceNumber,
        cufe,
        urlCufe
      );

      const emailData: any = {
        from: process.env.FROM_EMAIL || 'facturas@zetterx.com',
        to: [to],
        subject,
        html: htmlContent,
      };

      if (cc && cc.length > 0) {
        emailData.cc = cc;
      }

      if (attachments.length > 0) {
        emailData.attachments = attachments;
      }

      const result = await resend.emails.send(emailData);

      if (result.error) {
        return {
          success: false,
          error: result.error.message
        };
      }

      return {
        success: true,
        messageId: result.data?.id
      };
    } catch (error) {
      console.error('Error sending invoice email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate HTML template for invoice email
   */
  private generateInvoiceEmailHTML(
    customerName: string,
    invoiceNumber: string,
    cufe: string,
    urlCufe: string
  ): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura Electrónica ${invoiceNumber}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e1e1e1;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
        }
        .content {
            margin-bottom: 30px;
        }
        .invoice-details {
            background: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e1e1e1;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #374151;
        }
        .detail-value {
            color: #6b7280;
        }
        .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .cta-button:hover {
            background: #1d4ed8;
        }
        .footer {
            border-top: 1px solid #e1e1e1;
            padding-top: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .warning-text {
            color: #92400e;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ZetterX</div>
            <div class="subtitle">Factura Electrónica Autorizada</div>
        </div>
        
        <div class="content">
            <h2>Estimado/a ${customerName},</h2>
            
            <p>Adjunto encontrará su Factura Electrónica debidamente autorizada por la Dirección General de Ingresos (DGI) de Panamá.</p>
            
            <div class="invoice-details">
                <div class="detail-row">
                    <span class="detail-label">Número de Factura:</span>
                    <span class="detail-value">${invoiceNumber}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">CUFE:</span>
                    <span class="detail-value">${cufe}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Estado:</span>
                    <span class="detail-value" style="color: #059669; font-weight: 600;">Autorizada por DGI</span>
                </div>
            </div>
            
            <p>Puede verificar la autenticidad de esta factura en el portal oficial de la DGI:</p>
            
            <div style="text-align: center;">
                <a href="${urlCufe}" class="cta-button" target="_blank">
                    Verificar en Portal DGI
                </a>
            </div>
            
            <div class="warning">
                <p class="warning-text">
                    <strong>Importante:</strong> Esta factura electrónica tiene plena validez fiscal y legal. 
                    Conserve este documento para sus registros contables y fiscales.
                </p>
            </div>
            
            <p>Si tiene alguna pregunta sobre esta factura, no dude en contactarnos.</p>
            
            <p>Gracias por su confianza.</p>
        </div>
        
        <div class="footer">
            <p>Este es un mensaje automático, por favor no responda a este correo.</p>
            <p>© ${new Date().getFullYear()} ZetterX. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Send error notification email to support team
   */
  async sendErrorNotification(
    invoiceId: string,
    error: string,
    context?: any
  ): Promise<void> {
    try {
      const supportEmail = process.env.SUPPORT_EMAIL || 'support@zetterx.com';
      
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'system@zetterx.com',
        to: [supportEmail],
        subject: `Error en procesamiento DGI - Factura ${invoiceId}`,
        html: `
          <h2>Error en procesamiento de factura</h2>
          <p><strong>Invoice ID:</strong> ${invoiceId}</p>
          <p><strong>Error:</strong> ${error}</p>
          ${context ? `<p><strong>Contexto:</strong> <pre>${JSON.stringify(context, null, 2)}</pre></p>` : ''}
          <p>Timestamp: ${new Date().toISOString()}</p>
        `
      });
    } catch (error) {
      console.error('Error sending error notification:', error);
    }
  }
}

export const emailService = new EmailService();
