import 'server-only';

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
  totales?: {
    subtotal: number;
    itbms: number;
    total: number;
  };
  estado?: string;
  formaPago?: any[];
}

/**
 * Server-only PDF Generator Service
 * This service can only run on the server side to avoid webpack issues
 */
export class PDFGeneratorServerService {
  /**
   * Genera PDF usando html-pdf-node con importación dinámica
   * Solo funciona en server-side
   */
  static async generatePDFBuffer(invoiceData: DGIInvoiceData): Promise<Buffer> {
    try {
      console.log('🔄 Generating PDF from HTML (server-side)...');
      
      // Importación dinámica para evitar problemas de webpack
      const htmlPdf = await import('html-pdf-node');
      
      const htmlContent = this.generateInvoiceHTML(invoiceData);
      
      const options = {
        format: 'A4' as const,
        border: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      };

      const pdfBuffer = await htmlPdf.default.generatePdf({ content: htmlContent }, options);
      console.log('✅ PDF generated successfully');
      
      // Ensure we return a proper Buffer
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
   * Genera el HTML de la factura para convertir a PDF
   */
  private static generateInvoiceHTML(invoiceData: DGIInvoiceData): string {
    const subtotal = invoiceData.totales?.subtotal || invoiceData.subtotal || 0;
    const itbms = invoiceData.totales?.itbms || invoiceData.itbms || 0;
    const total = invoiceData.totales?.total || invoiceData.total || 0;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura Electrónica ${invoiceData.numeroFactura}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      font-size: 12px;
      line-height: 1.4;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .invoice-title {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 18px;
      color: #666;
      margin-bottom: 5px;
    }
    .cufe {
      font-size: 10px;
      color: #888;
      word-break: break-all;
    }
    .company-info {
      text-align: left;
      margin-bottom: 20px;
    }
    .customer-info {
      text-align: left;
      margin-bottom: 20px;
      border: 1px solid #ddd;
      padding: 15px;
      background-color: #f9f9f9;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .label {
      font-weight: bold;
      color: #333;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .items-table th,
    .items-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    .items-table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    .items-table td.number {
      text-align: right;
    }
    .totals {
      margin-top: 20px;
      text-align: right;
    }
    .totals-table {
      margin-left: auto;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 5px 15px;
      border: none;
    }
    .totals-table .label {
      text-align: right;
      font-weight: bold;
    }
    .totals-table .amount {
      text-align: right;
      border-bottom: 1px solid #ddd;
    }
    .total-final {
      font-size: 16px;
      font-weight: bold;
      border-top: 2px solid #333 !important;
      border-bottom: 2px solid #333 !important;
    }
    .payment-info {
      margin-top: 20px;
      padding: 15px;
      border: 1px solid #ddd;
      background-color: #f9f9f9;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 10px;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
    .qr-section {
      text-align: center;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="invoice-title">FACTURA ELECTRÓNICA</div>
    <div class="invoice-number">No. ${invoiceData.numeroFactura}</div>
    <div class="cufe">CUFE: ${invoiceData.cufe}</div>
  </div>

  <div class="company-info">
    <h3>INFORMACIÓN DEL EMISOR</h3>
    <div class="info-row">
      <span class="label">RUC:</span>
      <span>${invoiceData.emisor?.ruc || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="label">Razón Social:</span>
      <span>${invoiceData.emisor?.razon_social || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="label">Dirección:</span>
      <span>${invoiceData.emisor?.direccion || 'N/A'}</span>
    </div>
  </div>

  <div class="customer-info">
    <h3>INFORMACIÓN DEL CLIENTE</h3>
    <div class="info-row">
      <span class="label">Cliente:</span>
      <span>${invoiceData.cliente?.nombre || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="label">RUC/Cédula:</span>
      <span>${invoiceData.cliente?.ruc || invoiceData.cliente?.cedula || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="label">Dirección:</span>
      <span>${invoiceData.cliente?.direccion || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="label">Email:</span>
      <span>${invoiceData.cliente?.email || 'N/A'}</span>
    </div>
  </div>

  <div class="info-row">
    <span class="label">Fecha de Emisión:</span>
    <span>${new Date(invoiceData.fechaEmision).toLocaleDateString('es-PA')}</span>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Descripción</th>
        <th>Cantidad</th>
        <th>Precio Unit.</th>
        <th>ITBMS</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceData.items.map(item => `
        <tr>
          <td>${item.description || 'Producto/Servicio'}</td>
          <td class="number">${item.qty || 1}</td>
          <td class="number">$${(item.unit_price || 0).toFixed(2)}</td>
          <td class="number">${item.itbms_rate || '7'}%</td>
          <td class="number">$${(item.line_total || 0).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr>
        <td class="label">Subtotal:</td>
        <td class="amount">$${subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="label">ITBMS:</td>
        <td class="amount">$${itbms.toFixed(2)}</td>
      </tr>
      <tr class="total-final">
        <td class="label">TOTAL:</td>
        <td class="amount">$${total.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  <div class="payment-info">
    <h3>FORMA DE PAGO</h3>
    ${invoiceData.metodosPayment?.map(pm => `
      <div class="info-row">
        <span class="label">${this.getPaymentMethodName(pm.method_code)}:</span>
        <span>$${pm.amount.toFixed(2)}</span>
      </div>
    `).join('') || '<div>Efectivo: $' + total.toFixed(2) + '</div>'}
  </div>

  <div class="qr-section">
    <p><strong>Para verificar esta factura electrónica, visite:</strong></p>
    <p><a href="${invoiceData.urlCufe}" target="_blank">${invoiceData.urlCufe}</a></p>
  </div>

  <div class="footer">
    <p>Esta es una representación gráfica de la Factura Electrónica generada en el Sistema DGI-FEP</p>
    <p>Factura generada el ${new Date().toLocaleString('es-PA')}</p>
  </div>
</body>
</html>`;
  }

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
   * Método para previsualizar HTML sin convertir a PDF
   */
  static getPreviewHTML(invoiceData: DGIInvoiceData): string {
    return this.generateInvoiceHTML(invoiceData);
  }
}
