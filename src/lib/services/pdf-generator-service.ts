// Dynamic import to avoid webpack issues in Next.js

export interface DGIInvoiceData {
  numeroFactura: string;
  cufe: string;
  urlCufe: string;
  emisor: any;
  cliente: any;
  items: any[];
  metodosPayment: any[];
  fechaEmision: string;
  subtotal: number;
  itbms: number;
  total: number;
  estado?: string;
  protocoloAutorizacion?: string;
  totales?: {
    subtotal: number;
    itbms: number;
    total: number;
  };
  formaPago?: any[];
  urlQR?: string;
  urlConsulta?: string;
}

export class PDFGeneratorService {
  /**
   * Genera el HTML para la factura que será convertido a PDF
   */
  static generateInvoiceHTML(invoiceData: DGIInvoiceData): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'PAB'
      }).format(amount)
    }

    const formatDate = (dateString: string) => {
      try {
        return new Date(dateString).toLocaleDateString('es-PA', {
          year: 'numeric',
          month: 'long',  
          day: 'numeric'
        })
      } catch {
        return dateString
      }
    }

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura #${invoiceData.numeroFactura}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
          }

          .invoice-header {
            display: table;
            width: 100%;
            margin-bottom: 20px;
            border-bottom: 3px solid #0066cc;
            padding-bottom: 15px;
          }

          .company-info {
            display: table-cell;
            vertical-align: top;
            width: 60%;
          }

          .invoice-info {
            display: table-cell;
            vertical-align: top;
            width: 40%;
            text-align: right;
          }

          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #0066cc;
            margin: 0 0 5px 0;
          }

          .company-details {
            color: #666;
            font-size: 11px;
            line-height: 1.3;
          }

          .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin: 0 0 10px 0;
          }

          .invoice-number {
            font-size: 18px;
            color: #0066cc;
            font-weight: bold;
          }

          .dgi-info {
            background: #f0f8ff;
            border: 2px solid #0066cc;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }

          .dgi-title {
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 10px;
            font-size: 14px;
          }

          .cufe-box {
            background: white;
            border: 1px solid #ddd;
            padding: 8px;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            word-break: break-all;
            border-radius: 4px;
          }

          .client-info {
            background: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }

          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin: 0 0 10px 0;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 5px;
          }

          .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 10px;
          }

          .info-row {
            display: table-row;
          }

          .info-label {
            display: table-cell;
            font-weight: bold;
            width: 30%;
            padding: 5px 10px 5px 0;
            vertical-align: top;
          }

          .info-value {
            display: table-cell;
            padding: 5px 0;
            vertical-align: top;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 2px solid #0066cc;
          }

          .items-table th {
            background: #0066cc;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
          }

          .items-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #ddd;
            vertical-align: top;
          }

          .items-table tr:nth-child(even) {
            background: #f8f9fa;
          }

          .text-right {
            text-align: right;
          }

          .text-center {
            text-align: center;
          }

          .totals-section {
            margin-top: 20px;
            display: table;
            width: 100%;
          }

          .totals-left {
            display: table-cell;
            width: 50%;
            vertical-align: top;
          }

          .totals-right {
            display: table-cell;
            width: 50%;
            vertical-align: top;
          }

          .totals-table {
            width: 100%;
            margin-left: auto;
          }

          .totals-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #ddd;
          }

          .totals-table .label {
            font-weight: bold;
            text-align: right;
            background: #f5f5f5;
          }

          .totals-table .value {
            text-align: right;
            font-weight: bold;
          }

          .total-final {
            background: #0066cc !important;
            color: white !important;
            font-size: 16px;
          }

          .qr-section {
            margin-top: 30px;
            border: 2px dashed #0066cc;
            padding: 15px;
            text-align: center;
            border-radius: 8px;
          }

          .validation-urls {
            font-size: 10px;
            color: #666;
            margin-top: 10px;
            word-break: break-all;
          }

          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 10px;
            color: #666;
            text-align: center;
          }

          .status-badge {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 11px;
            font-weight: bold;
            margin: 5px 0;
          }

          .amount-words {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            border-radius: 4px;
            font-style: italic;
            margin: 10px 0;
          }

          @media print {
            .no-print { display: none; }
            body { font-size: 11px; }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="invoice-header">
          <div class="company-info">
            <div class="company-name">${invoiceData.emisor.nombre}</div>
            <div class="company-details">
              <strong>RUC:</strong> ${invoiceData.emisor.ruc}<br>
              <strong>Dirección:</strong> ${invoiceData.emisor.direccion}<br>
              <strong>Teléfono:</strong> ${invoiceData.emisor.telefono}
              ${invoiceData.emisor.email ? `<br><strong>Email:</strong> ${invoiceData.emisor.email}` : ''}
            </div>
          </div>
          <div class="invoice-info">
            <div class="invoice-title">FACTURA</div>
            <div class="invoice-number">#${invoiceData.numeroFactura}</div>
            <div style="margin-top: 10px; font-size: 11px;">
              <strong>Fecha:</strong> ${formatDate(invoiceData.fechaEmision)}
            </div>
          </div>
        </div>

        <!-- DGI Authorization Info -->
        <div class="dgi-info">
          <div class="dgi-title">📋 INFORMACIÓN DE AUTORIZACIÓN DGI</div>
          <div class="status-badge">✅ Autorizada</div>
          <div class="totales-summary">
            <div class="total-row">
              <strong>Subtotal: $${invoiceData.totales?.subtotal?.toFixed(2) || '0.00'}</strong>
            </div>
            <div class="total-row">
              <strong>Descuentos: $0.00</strong>
            </div>
            <div class="total-row">
              <strong>ITBMS: $${invoiceData.totales?.itbms?.toFixed(2) || '0.00'}</strong>
            </div>
            <div class="total-row total-final">
              <strong>TOTAL: $${invoiceData.totales?.total?.toFixed(2) || '0.00'}</strong>
            </div>
          </div>
          <div class="info-grid">
            <div class="info-row">
              <div class="info-label">CUFE:</div>
              <div class="info-value">
                <div class="cufe-box">${invoiceData.cufe}</div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">Protocolo:</div>
              <div class="info-value">${invoiceData.protocoloAutorizacion}</div>
            </div>
          </div>
        </div>

        <!-- Client Information -->
        <div class="client-info">
          <div class="section-title">👤 DATOS DEL CLIENTE</div>
          <div class="info-grid">
            <div class="info-row">
              <div class="info-label">Cliente:</div>
              <div class="info-value">${invoiceData.cliente.nombre}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Dirección:</div>
              <div class="info-value">${invoiceData.cliente.direccion}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Teléfono:</div>
              <div class="info-value">${invoiceData.cliente.telefono}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Email:</div>
              <div class="info-value">${invoiceData.cliente.email}</div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 10%;">Item</th>
              <th style="width: 15%;">Código</th>
              <th style="width: 35%;">Descripción</th>
              <th style="width: 10%;">Cant.</th>
              <th style="width: 15%;">Precio Unit.</th>
              <th style="width: 15%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map((item, index) => `
              <tr>
                <td class="text-center">${String(index + 1).padStart(3, '0')}</td>
                <td>${item.codigo}</td>
                <td>${item.descripcion}</td>
                <td class="text-center">${item.cantidad}</td>
                <td class="text-right">${formatCurrency(item.precioUnitario)}</td>
                <td class="text-right">${formatCurrency(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals Section -->
        <div class="totals-section">
          <div class="totals-left">
            <div class="amount-words">
              <strong>Total en Letras:</strong><br>
              ${this.convertNumberToWords(invoiceData.totales?.total || 0)} BALBOAS
            </div>
            <div style="margin-top: 15px; font-size: 11px;">
              <strong>Forma de Pago:</strong> Efectivo<br>
              <strong>Valor:</strong> $${invoiceData.totales?.total?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div class="totals-right">
            <table class="totals-table">
              <tr>
                <td class="label">Subtotal:</td>
                <td class="value">${formatCurrency(invoiceData.totales?.subtotal || 0)}</td>
              </tr>
              <tr>
                <td class="label">Descuentos:</td>
                <td class="value">${formatCurrency(0)}</td>
              </tr>
              <tr>
                <td class="label">ITBMS:</td>
                <td class="value">${formatCurrency(invoiceData.totales?.itbms || 0)}</td>
              </tr>
              <tr class="total-final">
                <td class="label">TOTAL:</td>
                <td class="value total-final">${formatCurrency(invoiceData.totales?.total || 0)}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- QR and Validation -->
        <div class="qr-section">
          <div style="font-weight: bold; margin-bottom: 10px;">🔍 VALIDACIÓN EN LÍNEA</div>
          <div style="font-size: 11px; margin-bottom: 10px;">
            Puede verificar la autenticidad de esta factura escaneando el código QR<br>
            o visitando las siguientes URLs:
          </div>
          <div class="validation-urls">
            <strong>QR:</strong> ${invoiceData.urlQR}<br>
            <strong>CUFE:</strong> ${invoiceData.urlConsulta}
          </div>
          <!-- Payment Methods -->
          <div class="payment-info">
            <h3>Forma de Pago</h3>
            <p><strong>Tipo:</strong> ${invoiceData.formaPago?.[0]?.method_code || 'Efectivo'}</p>
            <p><strong>Valor:</strong> $${invoiceData.formaPago?.[0]?.amount?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <strong>FACTURA ELECTRÓNICA AUTORIZADA POR LA DIRECCIÓN GENERAL DE INGRESOS</strong><br>
          Este documento constituye una factura oficial para efectos fiscales y comerciales.<br>
          Procesado el ${new Date().toLocaleDateString('es-PA')} a las ${new Date().toLocaleTimeString('es-PA')}
        </div>
      </body>
      </html>
    `
  }

  /**
   * Convierte número a palabras (implementación básica)
   */
  private static convertNumberToWords(amount: number): string {
    // Implementación simplificada - en producción usar librería completa
    const integerPart = Math.floor(amount)
    const decimalPart = Math.round((amount - integerPart) * 100)
    
    if (integerPart === 0) return "CERO"
    if (integerPart === 1) return "UN"
    if (integerPart < 10) return ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"][integerPart]
    if (integerPart < 100) return `${Math.floor(integerPart / 10)} DECENAS Y ${integerPart % 10}`
    if (integerPart < 1000) return `${Math.floor(integerPart / 100)} CIENTOS`
    
    return `${integerPart.toLocaleString('es-PA')} (EN NÚMEROS)`
  }

  /**
   * Obtiene nombre del método de pago
   */
  private static getPaymentMethodName(paymentType: string): string {
    const paymentMethods: Record<string, string> = {
      '01': 'Efectivo',
      '02': 'Tarjeta de Crédito',
      '03': 'Tarjeta de Débito', 
      '04': 'Cheque',
      '05': 'Transferencia Bancaria',
      '06': 'Otros'
    }
    return paymentMethods[paymentType] || 'No Especificado'
  }

  /**
   * Genera PDF usando html-pdf-node con importación dinámica
   */
  static async generatePDFBuffer(invoiceData: DGIInvoiceData): Promise<Buffer> {
    try {
      console.log('🔄 Generating PDF from HTML...');
      
      // Importación dinámica para evitar problemas de webpack
      const htmlPdf = await import('html-pdf-node');
      
      const htmlContent = this.generateInvoiceHTML(invoiceData);
      
      const options = {
        format: 'A4',
        border: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      };

      const pdfBuffer = await htmlPdf.default.generatePdf({ content: htmlContent }, options);
      console.log('✅ PDF generated successfully');
      
      if (Buffer.isBuffer(pdfBuffer)) {
        return pdfBuffer;
      } else {
        throw new Error('PDF generation did not return a valid Buffer');
      }
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw new Error('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Genera PDF como base64 string (para compatibilidad)
   */
  static async generatePDFBase64(invoiceData: DGIInvoiceData): Promise<string> {
    try {
      const pdfBuffer = await this.generatePDFBuffer(invoiceData);
      return pdfBuffer.toString('base64');
    } catch (error) {
      console.error('❌ Error generating PDF base64:', error);
      throw error;
    }
  }

  /**
   * Método para previsualizar HTML sin convertir a PDF
   */
  static getPreviewHTML(invoiceData: DGIInvoiceData): string {
    return this.generateInvoiceHTML(invoiceData);
  }
}
