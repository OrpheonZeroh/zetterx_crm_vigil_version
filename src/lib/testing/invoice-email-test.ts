'use client'

import { InvoiceEmailService } from '@/lib/services/invoice-email-service'
import { DGIProcessorService } from '@/lib/services/dgi-processor-service'
import { EmailService } from '@/lib/services/email-service'

// Datos de prueba simulando respuesta real del DGI-FEP
export const MOCK_DGI_RESPONSE = {
  "Data": [
    {
      "LoteFE": [
        {
          "Xml": `<rFE xmlns="http://dgi-fep.mef.gob.pa"><dVerForm>1.00</dVerForm><dId>FE0120000155646463-2-2017-8600012024032052095049600010128158741019</dId><gDGen><iAmb>2</iAmb><iTpEmis>01</iTpEmis><iDoc>01</iDoc><dNroDF>TEST001</dNroDF><dPtoFacDF>001</dPtoFacDF><dSeg>815874101</dSeg><dFechaEm>2024-03-20T10:30:23-05:00</dFechaEm><dFechaSalida>2024-03-20T10:30:23-05:00</dFechaSalida><iNatOp>01</iNatOp><iTipoOp>1</iTipoOp><iDest>1</iDest><iFormCAFE>1</iFormCAFE><iEntCAFE>1</iEntCAFE><dEnvFE>1</dEnvFE><iProGen>2</iProGen><iTipoTranVenta>2</iTipoTranVenta><gEmis><gRucEmi><dTipoRuc>2</dTipoRuc><dRuc>155646463-2-2017</dRuc><dDV>86</dDV></gRucEmi><dNombEm>ZETTERX SERVICIOS S.A.</dNombEm><dSucEm>0001</dSucEm><dCoordEm>8.992075,-79.517841</dCoordEm><dDirecEm>AVENIDA PERU, PANAMA</dDirecEm><gUbiEm><dCodUbi>8-8-8</dCodUbi><dCorreg>PUEBLO NUEVO</dCorreg><dDistr>PANAMA</dDistr><dProv>PANAMA</dProv></gUbiEm><dTfnEm>507-1234-5678</dTfnEm></gEmis><gDatRec><iTipoRec>02</iTipoRec><dNombRec>Cliente Prueba Test</dNombRec><dDirecRec>Ciudad de Panama</dDirecRec><gUbiRec><dCodUbi>8-8-7</dCodUbi><dCorreg>BELLA VISTA</dCorreg><dDistr>PANAMA</dDistr><dProv>PANAMA</dProv></gUbiRec><dTfnRec>507-5678-9012</dTfnRec><dCorElectRec>cliente@test.com</dCorElectRec><cPaisRec>PA</cPaisRec></gDatRec></gDGen><gItem><dSecItem>001</dSecItem><dDescProd>Instalación de Sistema de Seguridad</dDescProd><dCodProd>INST-SEC-001</dCodProd><dCantCodInt>1</dCantCodInt><dCodCPBSabr>85</dCodCPBSabr><dCodCPBScmp>8515</dCodCPBScmp><gPrecios><dPrUnit>500.00</dPrUnit><dPrUnitDesc>0.00</dPrUnitDesc><dPrItem>500.00</dPrItem><dPrAcarItem>0.00</dPrAcarItem><dPrSegItem>0.00</dPrSegItem><dValTotItem>500.00</dValTotItem></gPrecios><gITBMSItem><dTasaITBMS>07</dTasaITBMS><dValITBMS>35.00</dValITBMS></gITBMSItem></gItem><gTot><dTotNeto>500.00</dTotNeto><dTotITBMS>35.00</dTotITBMS><dTotGravado>500.00</dTotGravado><dTotDesc>0.00</dTotDesc><dVTot>535.00</dVTot><dTotRec>535.00</dTotRec><iPzPag>1</iPzPag><dNroItems>1</dNroItems><dVTotItems>500.00</dVTotItems><gFormaPago><iFormaPago>02</iFormaPago><dVlrCuota>535.00</dVlrCuota></gFormaPago></gTot></rFE>`
        }
      ],
      "gResProc": {
        "dCodRes": "0260",
        "dMsgRes": "Autorizado el uso de la FE"
      },
      "xProtFe": [
        {
          "rProtFe": {
            "dVerForm": "1.00",
            "dCufe": "FE0120000155646463-2-2017-8600012024032052095049600010128158741019",
            "gInfProt": {
              "dId": "FE0120000155646463-2-2017-8600012024032052095049600010128158741019",
              "iAmb": "2",
              "dVerApl": "1",
              "dCUFE": "FE0120000155646463-2-2017-8600012024032052095049600010128158741019",
              "dFecProc": "2025-08-29T13:30:22-05:00",
              "dProtAut": "1556464632201744260720250829133022706362",
              "dDigVal": "01",
              "gResProc": {
                "dCodRes": "0260",
                "dMsgRes": "Autorizado el uso de la FE"
              }
            }
          }
        }
      ],
      "urlCufe": "https://dgi-fep-test.mef.gob.pa:40001/Consultas/FacturasPorQR?chFE=FE0120000155646463-2-2017-8600012024032052095049600010128158741019&iAmb=2&digestValue=MfAOttXth9Cn6w3LOJEKbVLYdT/WF36o1huQhqmYs+M=&jwt=test-jwt-token",
      "urlCufeAlternative": "https://dgi-fep-test.mef.gob.pa:40001/Consultas/FacturasPorCUFE?CUFE=FE0120000155646463-2-2017-8600012024032052095049600010128158741019",
      "sendFail": false
    }
  ],
  "Status": {
    "Code": "200", 
    "Message": "Accepted"
  }
}

export class InvoiceEmailTester {
  /**
   * 🧪 PRUEBA 1: Procesamiento de respuesta DGI
   */
  static async testDGIProcessor(): Promise<void> {
    console.log('🧪 TEST 1: Procesando respuesta DGI-FEP...')
    
    try {
      const processed = DGIProcessorService.processDGIResponse(MOCK_DGI_RESPONSE)
      
      if (!processed) {
        throw new Error('No se pudo procesar la respuesta DGI')
      }

      console.log('✅ Datos procesados exitosamente:')
      console.log('📋 Número Factura:', processed.numeroFactura)
      console.log('🔐 CUFE:', processed.cufe.substring(0, 20) + '...')
      console.log('📧 Email Cliente:', processed.cliente.email)
      console.log('💰 Total:', processed.totales.total)
      console.log('✅ Autorizada:', DGIProcessorService.isInvoiceAuthorized(processed))
      
    } catch (error) {
      console.error('❌ Error en TEST 1:', error)
      throw error
    }
  }

  /**
   * 🧪 PRUEBA 2: Generación de PDF (placeholder)
   */
  static async testPDFGeneration(): Promise<string> {
    console.log('🧪 TEST 2: Generando PDF...')
    
    try {
      const processed = DGIProcessorService.processDGIResponse(MOCK_DGI_RESPONSE)!
      
      // Solo importamos dinámicamente para evitar errores en build
      const { PDFGeneratorService } = await import('@/lib/services/pdf-generator-service')
      
      const pdfBase64 = await PDFGeneratorService.generatePDFBase64(processed)
      
      console.log('✅ PDF generado (placeholder):', pdfBase64.length, 'caracteres')
      
      return pdfBase64
      
    } catch (error) {
      console.error('❌ Error en TEST 2:', error)
      throw error
    }
  }

  /**
   * 🧪 PRUEBA 3: Envío de email (TEST MODE)
   */
  static async testEmailSending(testEmail: string): Promise<void> {
    console.log('🧪 TEST 3: Enviando email de prueba...')
    
    try {
      const processed = DGIProcessorService.processDGIResponse(MOCK_DGI_RESPONSE)!
      
      // Simular envío (en modo test)
      const testResult = await EmailService.sendNotificationEmail(
        testEmail,
        'Cliente Prueba',
        '🧪 Test - Factura Electrónica #TEST001',
        `Esta es una prueba del sistema de facturas electrónicas de ZetterX CRM.
        
        Datos de prueba:
        - CUFE: ${processed.cufe.substring(0, 30)}...
        - Cliente: ${processed.cliente.nombre}
        - Total: B/. ${processed.totales.total}
        - Estado: ${processed.estado.mensaje}
        
        El sistema está funcionando correctamente ✅`
      )
      
      if (testResult) {
        console.log('✅ Email de prueba enviado exitosamente')
      } else {
        console.log('❌ Error enviando email de prueba')
      }
      
    } catch (error) {
      console.error('❌ Error en TEST 3:', error)
      throw error
    }
  }

  /**
   * 🧪 PRUEBA 4: Proceso completo end-to-end
   */
  static async testFullProcess(params: {
    testEmail: string,
    workOrderId?: string,
    invoiceId?: string
  }): Promise<void> {
    console.log('🧪 TEST 4: Proceso completo end-to-end...')
    
    try {
      const result = await InvoiceEmailService.processAndSendInvoice({
        dgiResponse: MOCK_DGI_RESPONSE,
        customerEmail: params.testEmail,
        workOrderId: params.workOrderId,
        invoiceId: params.invoiceId
      })
      
      console.log('📊 Resultado completo:')
      console.log('✅ Éxito:', result.success)
      console.log('📧 Email enviado:', result.emailSent)
      console.log('💬 Mensaje:', result.message)
      console.log('🔐 CUFE:', result.cufe?.substring(0, 30) + '...')
      
      if (!result.success) {
        throw new Error(`Proceso falló: ${result.message}`)
      }
      
    } catch (error) {
      console.error('❌ Error en TEST 4:', error)
      throw error
    }
  }

  /**
   * 🎯 Ejecutar todas las pruebas
   */
  static async runAllTests(testEmail: string = 'test@example.com'): Promise<void> {
    console.log('🚀 INICIANDO SUITE DE PRUEBAS DE FACTURAS POR EMAIL')
    console.log('=' . repeat(60))
    
    try {
      // Test 1: Procesamiento DGI
      await this.testDGIProcessor()
      console.log('')
      
      // Test 2: PDF Generation  
      await this.testPDFGeneration()
      console.log('')
      
      // Test 3: Email Sending
      await InvoiceEmailTester.testEmailSending(testEmail)
      console.log('')
      
      // Test 4: Full Process
      await this.testFullProcess({ testEmail })
      console.log('')
      
      console.log('TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE')
      
    } catch (error) {
      console.error('💥 FALLO EN SUITE DE PRUEBAS:', error)
      throw error
    }
  }
}

/**
 * 🎮 Funciones de utilidad para pruebas manuales en consola
 */
export const TestHelpers = {
  // Función para probar desde consola del navegador
  runQuickTest: async (email: string) => {
    console.log('🧪 Ejecutando prueba rápida...')
    await InvoiceEmailTester.testEmailSending(email)
  },
  
  // Procesar respuesta DGI custom
  processCustomDGI: (dgiResponse: any) => {
    return DGIProcessorService.processDGIResponse(dgiResponse)
  },
  
  // Formatear datos para debug
  debugInvoiceData: (processed: any) => {
    console.table({
      'Número': processed.numeroFactura,
      'Cliente': processed.cliente.nombre,
      'Email': processed.cliente.email,
      'Total': `B/. ${processed.totales.total}`,
      'Estado': processed.estado.mensaje,
      'CUFE': processed.cufe.substring(0, 25) + '...'
    })
  }
}

// Exportar para uso en consola del navegador
if (typeof window !== 'undefined') {
  const windowGlobal = window as unknown as Record<string, unknown>
  windowGlobal.InvoiceEmailTester = InvoiceEmailTester
  windowGlobal.TestHelpers = TestHelpers
}
