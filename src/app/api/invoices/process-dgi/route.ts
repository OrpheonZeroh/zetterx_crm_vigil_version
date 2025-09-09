import { NextRequest, NextResponse } from 'next/server'
import { DGIApiService } from '@/lib/services/dgi-api-service'
import { PDFGeneratorServerService } from '@/lib/services/pdf-generator-server'
import { supabaseStorage } from '@/lib/services/supabase-storage'
import { emailService } from '@/services/email'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, customerEmail } = await req.json()

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    console.log(`🎯 Processing invoice ${invoiceId} with DGI...`)

    // 1. Obtener factura de BD
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(name, email),
        work_order:work_orders(title)
      `)
      .eq('id', invoiceId)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // 2. Enviar a DGI
    console.log('📤 Enviando factura a DGI...')
    const dgiResponse = await DGIApiService.sendInvoiceToDGI(invoice, customerEmail)

    // 3. Verificar respuesta DGI exitosa
    if (!dgiResponse || dgiResponse.Status?.Code !== 'A200') {
      const errorMsg = dgiResponse?.Status?.Message || 'Error desconocido de DGI'
      
      // Actualizar factura con error
      await supabase
        .from('invoices')
        .update({
          dgi_status: 'ERROR',
          dgi_message: errorMsg,
          dgi_response: JSON.stringify(dgiResponse),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)

      return NextResponse.json({
        success: false,
        error: `DGI Error: ${errorMsg}`,
        dgiResponse
      }, { status: 400 })
    }

    console.log('✅ DGI aprobó la factura')

    // 4. Extraer datos de autorización DGI
    const cufe = dgiResponse.Data?.dCufe || dgiResponse.processingResult?.cufe
    const urlCufe = dgiResponse.Data?.dUrlCufe || dgiResponse.processingResult?.urlCufe
    const xmlFE = dgiResponse.Data?.dXmlFirmado || dgiResponse.processingResult?.xmlFE

    if (!cufe) {
      return NextResponse.json({
        success: false,
        error: 'No se recibió CUFE de DGI'
      }, { status: 400 })
    }

    // 5. Preparar datos para PDF
    const invoiceData = {
      numeroFactura: invoice.doc_number || 'N/A',
      cufe: cufe,
      urlCufe: urlCufe || `https://dgi-fep.mef.gob.pa/fe/consulta/${cufe}`,
      emisor: {
        ruc: '155646463-2-2017',
        razon_social: 'ZETTERX SERVICIOS S.A.',
        direccion: 'AVENIDA PERU, PANAMA'
      },
      cliente: {
        nombre: invoice.customer?.name || 'Cliente',
        email: customerEmail || invoice.customer?.email,
        direccion: 'Ciudad de Panama'
      },
      items: [{
        description: invoice.work_order?.title || 'Servicios ZetterX',
        qty: 1,
        unit_price: invoice.total_amount || 0,
        itbms_rate: '0',
        line_total: invoice.total_amount || 0
      }],
      metodosPayment: [{
        method_code: '02',
        amount: invoice.total_amount || 0
      }],
      fechaEmision: new Date().toISOString(),
      subtotal: invoice.total_amount || 0,
      itbms: 0,
      total: invoice.total_amount || 0
    }

    // 6. Generar PDF
    console.log('📄 Generando PDF...')
    const pdfResult = await PDFGeneratorServerService.generateInvoicePDF(invoice)
    
    if (!pdfResult.success || !pdfResult.buffer) {
      throw new Error(`Error generando PDF: ${pdfResult.error}`)
    }
    
    const pdfBuffer = pdfResult.buffer

    // 7. Subir PDF y XML a Supabase Storage
    console.log('☁️ Subiendo archivos a Storage...')
    const [pdfUpload, xmlUpload] = await Promise.all([
      supabaseStorage.uploadInvoicePDF(
        invoiceId,
        invoice.doc_number || 'invoice',
        pdfBuffer
      ),
      xmlFE ? supabaseStorage.uploadInvoiceXML(
        invoiceId,
        invoice.doc_number || 'invoice',
        xmlFE
      ) : Promise.resolve({ success: true, url: null })
    ])

    if (!pdfUpload.success) {
      console.error('❌ Error uploading PDF:', pdfUpload.error)
    }

    // 8. Actualizar factura en BD con datos DGI y URLs de archivos
    const updateData = {
      cufe: cufe,
      dgi_protocol: dgiResponse.Data?.dProtocolo || '',
      dgi_status: 'AUTHORIZED',
      dgi_message: 'Factura autorizada por DGI',
      qr_url: urlCufe,
      validation_url: urlCufe,
      dgi_response: JSON.stringify(dgiResponse),
      pdf_url: pdfUpload.url,
      xml_url: xmlUpload.url,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)

    if (updateError) {
      console.error('❌ Error updating invoice:', updateError)
    }

    // 9. Enviar email con PDF adjunto
    const finalEmail = customerEmail || invoice.customer?.email
    if (finalEmail && pdfBuffer) {
      console.log(`📧 Enviando email a: ${finalEmail}`)
      
      const xmlBuffer = xmlFE ? Buffer.from(xmlFE, 'utf-8') : undefined
      
      const emailResult = await emailService.sendInvoiceEmail(
        finalEmail,
        `Factura Electrónica ${invoice.doc_number} - Autorizada por DGI`,
        invoice.customer?.name || 'Cliente',
        invoice.doc_number || 'N/A',
        cufe,
        urlCufe || '',
        pdfBuffer,
        xmlBuffer
      )

      if (emailResult.success) {
        console.log('✅ Email enviado exitosamente')
        
        // Actualizar estado de email
        await supabase
          .from('invoices')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            email_address: finalEmail
          })
          .eq('id', invoiceId)
      } else {
        console.error('❌ Error enviando email:', emailResult.error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Factura procesada exitosamente',
      invoiceId,
      cufe,
      urlCufe,
      pdfUrl: pdfUpload.url,
      xmlUrl: xmlUpload.url,
      emailSent: !!finalEmail
    })

  } catch (error) {
    console.error('💥 Error processing invoice:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 })
  }
}
