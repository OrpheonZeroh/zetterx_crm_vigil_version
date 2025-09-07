'use client'

import { Invoice } from './invoice-service'
import { InvoiceEmailService } from './invoice-email-service'

export interface DGIApiConfig {
  baseUrl: string
  apiKey: string
  subscriptionKey: string
  companyCode: string
  isTestMode: boolean
}

export interface DGIPayload {
  dGen: {
    iAmb: number
    iTpEmis: string
    iDoc: string
    dNroDF: string
    dPtoFacDF: string
    dFechaEm: string
    dFechaSalida: string
    iNatOp: string
    iTipoOp: string
    iDest: string
    iFormCAFE: string
    iEntCAFE: string
    dEnvFE: string
    iTipoTranVenta: string
    gEmis: {
      dNombEm: string
      dSucEm: string
      dCoordEm: string
      dDirecEm: string
      gRucEmi: {
        dTipoRuc: string
        dRuc: string
        dDV: string
      }
      gUbiEm: {
        dCodUbi: string
        dCorreg: string
        dDistr: string
        dProv: string
      }
      dTfnEm: string
    }
    gDatRec: {
      iTipoRec: string
      dNombRec: string
      dDirecRec: string
      cPaisRec: string
      gUbiRec: {
        dCodUbi: string
        dCorreg: string
        dDistr: string
        dProv: string
      }
      dTfnRec: string
      dCorElectRec: string
    }
  }
  gItem: Array<{
    dSecItem: string
    dDescProd: string
    dCodProd: string
    dCantCodInt: string
    dCodCPBSabr: string
    dCodCPBScmp: string
    gPrecios: {
      dPrUnit: string
      dPrUnitDesc: string
      dPrItem: string
      dValTotItem: string
    }
    gITBMSItem: {
      dTasaITBMS: string
      dValITBMS: string
    }
  }>
  gTot: {
    dTotNeto: string
    dTotITBMS: string
    dTotISC: number
    dTotGravado: string
    dTotDesc: string
    dVTot: string
    dTotRec: string
    iPzPag: number
    dNroItems: number
    dVTotItems: string
    gFormaPago: Array<{
      iFormaPago: string
      dVlrCuota: string
    }>
  }
  gExtra: {
    gCompanyCode: string
    isValidationsOn: boolean
    isTestingOn: boolean
    gNotification: {
      dChannels: Array<{
        dChannelName: string
        dReceivers: {
          dReceiversList: Array<{
            Email: string
            Name: string
          }>
        }
      }>
    }
  }
  dVerForm: string
}

export class DGIApiService {
  private static readonly CONFIG: DGIApiConfig = {
    baseUrl: 'https://qa-apim.aludra.cloud/mdl18/feRecepFEDGI',
    apiKey: 'hunrcx/s+cm9mdJXwa5JiOka/UDASNFlBvR20jGBeaR/4cnThWqQ14qQD8hZ9LOOVkunnq2eRjGVSeisB0/9I8l/XXi+KnMvUAt5Dlhof03Zr1ISZp8qdcUlpXYM6VUw1o54+sWMpiGvIsenT9quiIVa7mX3kov3SnzGEXdkKQkkHQsZXUKk8IulYm5rI0ski4X8NSXSNn4u/DlwBfJWxqDxTU2DeQOqSVnCI2hlsYc3amHREDkQs2T+B5KKo2azL6waPmxiyMGgePjQ2KhagLgnIztBJfSPdlr2vwZjpFGQ4d5dYCILBFM6YmI9yXE+LbwkdeOWX/XzJqrjo7ZwX7bhbURWIAGsl18kXOsopGk=',
    subscriptionKey: 'f718d6d8af9848008b8f6a6f516cb7ba',
    companyCode: 'HYPE',
    isTestMode: true
  }

  /**
   * 🏭 PASO 1: Convierte factura CRM a formato DGI
   */
  static invoiceToDGIPayload(invoice: Invoice, customerEmail?: string): DGIPayload {
    const now = new Date()
    const formattedDate = now.toISOString().slice(0, 19) + '-05:00'

    return {
      dGen: {
        iAmb: this.CONFIG.isTestMode ? 2 : 1, // 2=Test, 1=Producción
        iTpEmis: "01",
        iDoc: "01", 
        dNroDF: invoice.doc_number,
        dPtoFacDF: invoice.pos_code || "001",
        dFechaEm: formattedDate,
        dFechaSalida: formattedDate,
        iNatOp: "01",
        iTipoOp: "1",
        iDest: "1",
        iFormCAFE: "1", 
        iEntCAFE: "1",
        dEnvFE: "1",
        iTipoTranVenta: "2",
        gEmis: {
          dNombEm: invoice.emis_name || "ZETTERX SERVICIOS S.A.",
          dSucEm: invoice.emis_branch || "0001",
          dCoordEm: invoice.emis_coords || "8.992075,-79.517841",
          dDirecEm: invoice.emis_address || "AVENIDA PERU, PANAMA",
          gRucEmi: {
            dTipoRuc: invoice.emis_ruc_tipo || "2",
            dRuc: invoice.emis_ruc_num || "155646463-2-2017",
            dDV: invoice.emis_ruc_dv || "86"
          },
          gUbiEm: {
            dCodUbi: invoice.emis_ubi_code || "8-8-8",
            dCorreg: invoice.emis_correg || "PUEBLO NUEVO", 
            dDistr: invoice.emis_district || "PANAMA",
            dProv: invoice.emis_province || "PANAMA"
          },
          dTfnEm: "507-1234"
        },
        gDatRec: {
          iTipoRec: "02",
          dNombRec: invoice.rec_name || invoice.customer?.name || "Cliente",
          dDirecRec: invoice.rec_address || "Ciudad de Panama",
          cPaisRec: invoice.rec_country || "PA",
          gUbiRec: {
            dCodUbi: invoice.rec_ubi_code || "8-8-7",
            dCorreg: invoice.rec_correg || "BELLA VISTA",
            dDistr: invoice.rec_district || "PANAMA", 
            dProv: invoice.rec_province || "PANAMA"
          },
          dTfnRec: "507-5678",
          dCorElectRec: customerEmail || invoice.rec_email || invoice.customer?.email || "cliente@test.com"
        }
      },
      gItem: [{
        dSecItem: "001",
        dDescProd: invoice.work_order?.title || "Servicios ZetterX",
        dCodProd: "SERV-001",
        dCantCodInt: "1",
        dCodCPBSabr: "85",
        dCodCPBScmp: "8515", 
        gPrecios: {
          dPrUnit: "150.00",
          dPrUnitDesc: "0.00",
          dPrItem: "150.00",
          dValTotItem: "150.00"
        },
        gITBMSItem: {
          dTasaITBMS: "00",
          dValITBMS: "0.00"
        }
      }],
      gTot: {
        dTotNeto: "150.00",
        dTotITBMS: "0.00",
        dTotISC: 0.00,
        dTotGravado: "0.00",
        dTotDesc: "0.00",
        dVTot: "150.00",
        dTotRec: "150.00",
        iPzPag: 1,
        dNroItems: 1,
        dVTotItems: "150.00",
        gFormaPago: [{
          iFormaPago: "02",
          dVlrCuota: "150.00"
        }]
      },
      gExtra: {
        gCompanyCode: this.CONFIG.companyCode,
        isValidationsOn: true,
        isTestingOn: this.CONFIG.isTestMode,
        gNotification: {
          dChannels: [{
            dChannelName: "Email",
            dReceivers: {
              dReceiversList: [{
                Email: customerEmail || invoice.rec_email || invoice.customer?.email || "cliente@test.com",
                Name: invoice.rec_name || invoice.customer?.name || "Cliente"
              }]
            }
          }]
        }
      },
      dVerForm: "1.00"
    }
  }

  /**
   * 🚀 PASO 2: Envía factura a DGI usando tu CURL
   */
  static async sendInvoiceToDGI(invoice: Invoice, customerEmail?: string): Promise<any> {
    try {
      console.log(`📤 Enviando factura ${invoice.doc_number} a DGI...`)

      const payload = this.invoiceToDGIPayload(invoice, customerEmail)
      
      const response = await fetch(this.CONFIG.baseUrl, {
        method: 'POST',
        headers: {
          'api-key': this.CONFIG.apiKey,
          'ocp-apim-subscription-key': this.CONFIG.subscriptionKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`DGI API Error ${response.status}: ${errorText}`)
      }

      const dgiResponse = await response.json()
      
      console.log('✅ Respuesta DGI recibida:', {
        status: dgiResponse.Status?.Code,
        message: dgiResponse.Status?.Message
      })

      return dgiResponse

    } catch (error) {
      console.error('❌ Error enviando a DGI:', error)
      throw error
    }
  }

  /**
   * 🔄 PASO 3: Proceso completo - DGI + Email automático
   */
  static async processInvoiceWithDGI(
    invoiceId: string, 
    customerEmail?: string
  ): Promise<{
    success: boolean
    message: string
    dgiResponse?: any
    emailSent?: boolean
    cufe?: string
  }> {
    try {
      console.log(`🎯 Iniciando proceso completo para factura: ${invoiceId}`)

      // 1. Obtener factura de BD
      const { supabase } = await import('@/lib/supabase')
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
        throw new Error('Factura no encontrada')
      }

      // 2. Enviar a DGI
      const dgiResponse = await this.sendInvoiceToDGI(invoice, customerEmail)

      // 3. Procesar respuesta y enviar email automáticamente
      const emailResult = await InvoiceEmailService.processAndSendInvoice({
        dgiResponse,
        customerEmail,
        invoiceId: invoice.id
      })

      return {
        success: emailResult.success,
        message: emailResult.message,
        dgiResponse,
        emailSent: emailResult.emailSent,
        cufe: emailResult.cufe
      }

    } catch (error) {
      console.error('❌ Error en proceso completo:', error)
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }
    }
  }

  /**
   * 🧪 Método de prueba con datos mock
   */
  static async testDGIIntegration(testEmail: string = 'test@ejemplo.com'): Promise<void> {
    console.log('🧪 Probando integración DGI...')
    
    // Crear factura mock para prueba
    const mockInvoice: Partial<Invoice> = {
      id: 'test-invoice-id',
      doc_number: '5209504960',
      pos_code: '001',
      total_net: 150.00,
      total_itbms: 0.00,
      total_isc: 0.00,
      total_gravado: 0.00,
      total_discount: 0.00,
      total_amount: 150.00,
      total_received: 150.00,
      items_total: 150.00,
      num_items: 1,
      num_payments: 1,
      customer: {
        id: 'test-customer',
        name: 'Cliente Test',
        email: testEmail
      },
      work_order: {
        id: 'test-work-order',
        title: 'Instalación de Sistema de Seguridad'
      }
    }

    try {
      const dgiResponse = await this.sendInvoiceToDGI(mockInvoice as Invoice, testEmail)
      console.log('✅ Prueba DGI exitosa:', dgiResponse)
      
      // Procesar con sistema de email
      const emailResult = await InvoiceEmailService.processAndSendInvoice({
        dgiResponse,
        customerEmail: testEmail
      })
      
      console.log('📧 Resultado email:', emailResult)
      
    } catch (error) {
      console.error('❌ Error en prueba:', error)
    }
  }
}

// Exportar para uso en consola
if (typeof window !== 'undefined') {
  (window as any).DGIApiService = DGIApiService
}
