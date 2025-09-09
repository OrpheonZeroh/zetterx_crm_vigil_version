import { 
  DGIPayload, 
  DGIResponse, 
  DGIPayloadSchema, 
  DGIResponseSchema,
  Emitter,
  Customer,
  InvoiceItem
} from '@/types/dgi';

export class DGIClient {
  private readonly baseUrl = 'https://qa-apim.aludra.cloud/mdl18';
  private readonly endpoint = '/feRecepFEDGI';

  constructor(
    private readonly apiKey: string,
    private readonly subscriptionKey: string
  ) {}

  /**
   * Submits invoice to DGI PAC
   */
  async submitInvoice(payload: DGIPayload): Promise<DGIResponse> {
    try {
      // Validate payload structure
      const validatedPayload = DGIPayloadSchema.parse(payload);

      const response = await fetch(`${this.baseUrl}${this.endpoint}`, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'ocp-apim-subscription-key': this.subscriptionKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validatedPayload)
      });

      if (!response.ok) {
        throw new Error(`DGI API error: ${response.status} - ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // Validate response structure
      return DGIResponseSchema.parse(responseData);
    } catch (error) {
      console.error('Error submitting invoice to DGI:', error);
      throw error;
    }
  }

  /**
   * Builds DGI payload from invoice data
   */
  static buildPayload(
    emitter: Emitter,
    customer: Customer,
    items: InvoiceItem[],
    invoiceNumber: string,
    paymentMethods: Array<{ method_code: string; amount: number }>,
    notificationEmails?: Array<{ email: string; name: string }>
  ): DGIPayload {
    const now = new Date();
    const isoDateTime = now.toISOString();
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
    const itbmsTotal = items.reduce((sum, item) => {
      const rate = parseFloat(item.itbms_rate) / 100;
      return sum + (item.line_total * rate);
    }, 0);
    const total = subtotal + itbmsTotal;
    const totalReceived = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);

    const payload: DGIPayload = {
      dGen: {
        iAmb: emitter.iamb,
        iTpEmis: emitter.itpemis_default,
        iDoc: emitter.idoc_default,
        dNroDF: invoiceNumber,
        dPtoFacDF: emitter.pto_fac_default,
        dFechaEm: isoDateTime,
        dFechaSalida: isoDateTime,
        iNatOp: "01", // Venta
        iTipoOp: "1", // Operación interna
        iDest: "1", // Panamá
        iFormCAFE: "1", // Con CAFE
        iEntCAFE: "1", // Entidad autorizada
        dEnvFE: "1", // Envío automático
        iTipoTranVenta: "2", // Venta directa
        gEmis: {
          dNombEm: emitter.name,
          dSucEm: emitter.suc_em,
          dCoordEm: "8.992075,-79.517841", // Default Panama coordinates
          dDirecEm: emitter.address_line || "PANAMA",
          gRucEmi: {
            dTipoRuc: emitter.ruc_tipo,
            dRuc: emitter.ruc_numero,
            dDV: emitter.ruc_dv
          },
          gUbiEm: {
            dCodUbi: emitter.ubi_code || "8-8-8",
            dCorreg: "PANAMA",
            dDistr: "PANAMA",
            dProv: "PANAMA"
          },
          dTfnEm: emitter.phone
        },
        gDatRec: {
          iTipoRec: "02", // Persona jurídica o natural
          dNombRec: customer.name,
          dDirecRec: customer.address_line || "PANAMA",
          cPaisRec: "PA",
          gUbiRec: {
            dCodUbi: customer.ubi_code || "8-8-7",
            dCorreg: "PANAMA",
            dDistr: "PANAMA",
            dProv: "PANAMA"
          },
          dTfnRec: customer.phone,
          dCorElectRec: customer.email
        }
      },
      gItem: items.map((item, index) => ({
        dSecItem: (index + 1).toString().padStart(3, '0'),
        dDescProd: item.description,
        dCodProd: item.sku,
        dCantCodInt: item.qty.toString(),
        dCodCPBSabr: item.cpbs_abr || "85",
        dCodCPBScmp: item.cpbs_cmp || "8515",
        gPrecios: {
          dPrUnit: item.unit_price.toFixed(2),
          dPrUnitDesc: "0.00",
          dPrItem: item.line_total.toFixed(2),
          dValTotItem: item.line_total.toFixed(2)
        },
        gITBMSItem: {
          dTasaITBMS: item.itbms_rate,
          dValITBMS: ((item.line_total * parseFloat(item.itbms_rate)) / 100).toFixed(2)
        }
      })),
      gTot: {
        dTotNeto: subtotal.toFixed(2),
        dTotITBMS: itbmsTotal.toFixed(2),
        dTotISC: 0.00,
        dTotGravado: "0.00",
        dTotDesc: "0.00",
        dVTot: total.toFixed(2),
        dTotRec: totalReceived.toFixed(2),
        iPzPag: paymentMethods.length,
        dNroItems: items.length,
        dVTotItems: subtotal.toFixed(2),
        gFormaPago: paymentMethods.map(pm => ({
          iFormaPago: pm.method_code,
          dVlrCuota: pm.amount.toFixed(2)
        }))
      },
      gExtra: {
        gCompanyCode: emitter.company_code,
        isValidationsOn: true,
        isTestingOn: emitter.iamb === 2, // Test environment
        gNotification: notificationEmails ? {
          dChannels: [{
            dChannelName: "Email",
            dReceivers: {
              dReceiversList: notificationEmails.map(ne => ({
                Email: ne.email,
                Name: ne.name
              }))
            }
          }]
        } : undefined
      },
      dVerForm: "1.00"
    };

    return payload;
  }

  /**
   * Check if DGI response indicates success
   */
  static isSuccessResponse(response: DGIResponse): boolean {
    if (!response.Data || response.Data.length === 0) {
      return false;
    }

    const data = response.Data[0];
    const statusCode = data.gResProc?.dCodRes;
    
    // Common success codes from DGI
    const successCodes = ['0260', '0000', '200'];
    return successCodes.includes(statusCode);
  }

  /**
   * Extract error information from DGI response
   */
  static getErrorFromResponse(response: DGIResponse): string {
    if (response.Errors && response.Errors.length > 0) {
      return JSON.stringify(response.Errors);
    }

    if (response.Data && response.Data.length > 0) {
      const data = response.Data[0];
      if (data.gResProc?.dMsgRes) {
        return data.gResProc.dMsgRes;
      }
      if (data.gResProcLote?.dMsgResLote) {
        return data.gResProcLote.dMsgResLote;
      }
    }

    return response.Status?.Message || 'Unknown error from DGI';
  }

  /**
   * Extract CUFE and related info from successful DGI response
   */
  static extractSuccessData(response: DGIResponse): {
    cufe: string;
    urlCufe: string;
    xmlFE: string;
    xmlProtocolo?: string;
  } | null {
    if (!this.isSuccessResponse(response) || !response.Data?.length) {
      return null;
    }

    const data = response.Data[0];
    
    return {
      cufe: data.xProtFe?.[0]?.rProtFe?.dCufe || '',
      urlCufe: data.urlCufe || '',
      xmlFE: data.LoteFE?.[0]?.Xml || '',
      xmlProtocolo: data.xProtFe?.[0] ? JSON.stringify(data.xProtFe[0]) : undefined
    };
  }
}

/**
 * Factory function to create DGI client for an emitter
 */
export function createDGIClient(emitter: Emitter): DGIClient {
  return new DGIClient(emitter.pac_api_key, emitter.pac_subscription_key);
}
