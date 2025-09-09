import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbService } from '@/services/database';
import { DGIClient, createDGIClient } from '@/services/dgi-client';
import { emailService } from '@/services/email';
import { PDFGeneratorServerService } from '@/lib/services/pdf-generator-server';
import { SupabaseStorageService } from '@/lib/services/supabase-storage';
import { DocumentStatus } from '@/types/dgi';

// Schema simplificado para testing local
const TestInvoiceSchema = z.object({
  emitter_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  items: z.array(z.object({
    line_no: z.number().positive(),
    description: z.string().min(1),
    qty: z.number().positive(),
    unit_price: z.number().positive(),
    itbms_rate: z.string().default('07'),
    line_total: z.number().positive()
  })).min(1),
  payment_methods: z.array(z.object({
    method_code: z.string(),
    amount: z.number().positive()
  })).min(1),
  notification_emails: z.array(z.object({
    email: z.string().email(),
    name: z.string()
  })).optional()
});

/**
 * POST /api/dgi/test-local
 * Procesa factura DGI localmente sin Inngest para testing
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Starting local DGI test...');
    
    const body = await req.json();
    const validatedData = TestInvoiceSchema.parse(body);
    
    // Step 1: Crear factura en BD con estado RECEIVED
    console.log('📝 Creating invoice in database...');
    const invoiceId = await dbService.createInvoice(validatedData);
    
    // Step 2: Obtener datos necesarios
    console.log('📋 Fetching emitter, customer, and items...');
    const [emitter, customer, items] = await Promise.all([
      dbService.getEmitter(validatedData.emitter_id),
      dbService.getCustomer(validatedData.customer_id),
      // En un caso real, esto vendría de la BD
      Promise.resolve(validatedData.items)
    ]);
    
    if (!emitter) throw new Error('Emitter not found');
    if (!customer) throw new Error('Customer not found');
    
    // Step 3: Construir payload DGI
    console.log('🔧 Building DGI payload...');
    await dbService.updateInvoiceStatus(invoiceId, DocumentStatus.PREPARING);
    
    const invoiceNumber = `001-001-${Date.now().toString().slice(-6)}`;
    const dgiItems = items.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      invoice_id: invoiceId
    }));
    
    const dgiPayload = DGIClient.buildPayload(
      emitter,
      customer,
      dgiItems,
      invoiceNumber,
      validatedData.payment_methods,
      validatedData.notification_emails
    );
    
    // Step 4: Enviar a DGI
    console.log('🚀 Sending to DGI PAC...');
    await dbService.updateInvoiceStatus(invoiceId, DocumentStatus.SENDING_TO_PAC);
    
    const dgiClient = createDGIClient(emitter);
    const dgiResponse = await dgiClient.submitInvoice(dgiPayload);
    
    console.log('📥 DGI Response received:', {
      status: dgiResponse.Status?.Code,
      message: dgiResponse.Status?.Message
    });
    
    // Step 5: Procesar respuesta
    if (DGIClient.isSuccessResponse(dgiResponse)) {
      const successData = DGIClient.extractSuccessData(dgiResponse);
      
      if (successData) {
        console.log('✅ Invoice authorized by DGI:', successData.cufe);
        
        // Actualizar factura con datos de autorización
        await dbService.updateInvoiceStatus(invoiceId, DocumentStatus.AUTHORIZED, {
          cufe: successData.cufe,
          url_cufe: successData.urlCufe,
          xml_response: JSON.stringify(dgiResponse),
          xml_fe: successData.xmlFE
        });
        
        // Step 6: Generar PDF y subir a Supabase Storage
        console.log('📄 Generating PDF...');
        const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
        const itbms = items.reduce((sum, item) => sum + (item.line_total * parseFloat(item.itbms_rate) / 100), 0);
        const total = validatedData.payment_methods.reduce((sum, pm) => sum + pm.amount, 0);
        
        const invoiceData = {
          numeroFactura: invoiceNumber,
          cufe: successData.cufe,
          urlCufe: successData.urlCufe,
          emisor: emitter,
          cliente: customer,
          items: items.map(item => ({
            ...item,
            id: crypto.randomUUID(),
            invoice_id: invoiceId
          })),
          metodosPayment: validatedData.payment_methods,
          fechaEmision: new Date().toISOString(),
          subtotal,
          itbms,
          total,
          totales: {
            subtotal,
            itbms,
            total
          }
        };
        
        // PDF generation temporarily disabled to fix build issues
        console.log('📄 PDF generation temporarily disabled - build fix needed');
        
        // Create a placeholder PDF buffer for testing
        const htmlContent = `<h1>Factura ${invoiceNumber}</h1><p>CUFE: ${successData.cufe}</p>`;
        const pdfBuffer = Buffer.from(htmlContent, 'utf-8');
        
        // Subir archivos a Supabase Storage
        const storageService = new SupabaseStorageService();
        
        // Guardar XML
        const xmlUploadResult = await storageService.uploadInvoiceXML(
          invoiceId,
          invoiceNumber,
          successData.xmlFE || ''
        );
        
        if (xmlUploadResult.success) {
          console.log('☁️ XML uploaded to Supabase Storage:', xmlUploadResult.url);
        }
        
        // Step 7: Enviar email con PDF adjunto
        if (validatedData.notification_emails?.length) {
          console.log('📧 Sending email notification with PDF attachment...');
          
          const xmlBuffer = Buffer.from(successData.xmlFE || '', 'utf-8');
          
          const emailResult = await emailService.sendInvoiceEmail(
            validatedData.notification_emails[0].email,
            `Factura Electrónica ${invoiceNumber} - Autorizada por DGI`,
            validatedData.notification_emails[0].name,
            invoiceNumber,
            successData.cufe,
            successData.urlCufe,
            pdfBuffer,
            xmlBuffer
          );
          
          console.log('📧 Email result:', emailResult);
        }
        
        return NextResponse.json({
          success: true,
          invoice_id: invoiceId,
          invoice_number: invoiceNumber,
          cufe: successData.cufe,
          url_cufe: successData.urlCufe,
          status: DocumentStatus.AUTHORIZED,
          message: 'Invoice processed successfully (LOCAL TEST MODE)'
        });
      }
    }
    
    // Manejar rechazo o error
    const errorMessage = DGIClient.getErrorFromResponse(dgiResponse);
    console.log('❌ DGI rejected invoice:', errorMessage);
    
    await dbService.updateInvoiceStatus(invoiceId, DocumentStatus.REJECTED);
    
    return NextResponse.json({
      success: false,
      invoice_id: invoiceId,
      error: errorMessage,
      status: DocumentStatus.REJECTED
    }, { status: 400 });
    
  } catch (error) {
    console.error('💥 Local test error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
