import { z } from 'zod';

// Enums para estados de documentos
export enum DocumentStatus {
  RECEIVED = 'RECEIVED',
  PREPARING = 'PREPARING',
  SENDING_TO_PAC = 'SENDING_TO_PAC',
  AUTHORIZED = 'AUTHORIZED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR'
}

export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING'
}

export enum DocumentType {
  INVOICE = 'invoice',
  IMPORT_INVOICE = 'import_invoice',
  EXPORT_INVOICE = 'export_invoice',
  CREDIT_NOTE = 'credit_note',
  DEBIT_NOTE = 'debit_note',
  ZONE_FRANCA = 'zone_franca',
  REEMBOLSO = 'reembolso',
  FOREIGN_INVOICE = 'foreign_invoice'
}

// Schemas de validación para DGI
export const DGIItemSchema = z.object({
  dSecItem: z.string(),
  dDescProd: z.string(),
  dCodProd: z.string().optional(),
  dCantCodInt: z.string(),
  dCodCPBSabr: z.string().optional(),
  dCodCPBScmp: z.string().optional(),
  gPrecios: z.object({
    dPrUnit: z.string(),
    dPrUnitDesc: z.string().default('0.00'),
    dPrItem: z.string(),
    dValTotItem: z.string()
  }),
  gITBMSItem: z.object({
    dTasaITBMS: z.string().default('00'),
    dValITBMS: z.string().default('0.00')
  })
});

export const DGITotalsSchema = z.object({
  dTotNeto: z.string(),
  dTotITBMS: z.string(),
  dTotISC: z.number().default(0),
  dTotGravado: z.string(),
  dTotDesc: z.string(),
  dVTot: z.string(),
  dTotRec: z.string(),
  iPzPag: z.number(),
  dNroItems: z.number(),
  dVTotItems: z.string(),
  gFormaPago: z.array(z.object({
    iFormaPago: z.string(),
    dVlrCuota: z.string()
  }))
});

export const DGIPayloadSchema = z.object({
  dGen: z.object({
    iAmb: z.number(),
    iTpEmis: z.string(),
    iDoc: z.string(),
    dNroDF: z.string(),
    dPtoFacDF: z.string(),
    dFechaEm: z.string(),
    dFechaSalida: z.string().optional(),
    iNatOp: z.string(),
    iTipoOp: z.string(),
    iDest: z.string(),
    iFormCAFE: z.string(),
    iEntCAFE: z.string(),
    dEnvFE: z.string(),
    iTipoTranVenta: z.string(),
    gEmis: z.object({
      dNombEm: z.string(),
      dSucEm: z.string(),
      dCoordEm: z.string().optional(),
      dDirecEm: z.string(),
      gRucEmi: z.object({
        dTipoRuc: z.string(),
        dRuc: z.string(),
        dDV: z.string()
      }),
      gUbiEm: z.object({
        dCodUbi: z.string(),
        dCorreg: z.string(),
        dDistr: z.string(),
        dProv: z.string()
      }),
      dTfnEm: z.string().optional()
    }),
    gDatRec: z.object({
      iTipoRec: z.string(),
      dNombRec: z.string(),
      dDirecRec: z.string(),
      cPaisRec: z.string().default('PA'),
      gUbiRec: z.object({
        dCodUbi: z.string(),
        dCorreg: z.string(),
        dDistr: z.string(),
        dProv: z.string()
      }),
      dTfnRec: z.string().optional(),
      dCorElectRec: z.string().optional()
    })
  }),
  gItem: z.array(DGIItemSchema),
  gTot: DGITotalsSchema,
  gExtra: z.object({
    gCompanyCode: z.string(),
    isValidationsOn: z.boolean().default(true),
    isTestingOn: z.boolean().default(false),
    gNotification: z.object({
      dChannels: z.array(z.object({
        dChannelName: z.string(),
        dReceivers: z.object({
          dReceiversList: z.array(z.object({
            Email: z.string().email(),
            Name: z.string()
          }))
        })
      }))
    }).optional()
  }),
  dVerForm: z.string().default('1.00')
});

export const DGIResponseSchema = z.object({
  Data: z.array(z.object({
    LoteFE: z.array(z.object({
      Xml: z.string()
    })),
    xResRucDV: z.object({
      rResRucDV: z.any().nullable()
    }),
    gResRucDV: z.object({}),
    gResProcLote: z.object({
      dCodResLote: z.string().nullable(),
      dMsgResLote: z.string().nullable()
    }),
    gResProc: z.object({
      dCodRes: z.string(),
      dMsgRes: z.string()
    }),
    gResProcList: z.array(z.any()),
    xProtFe: z.array(z.object({
      rProtFe: z.object({
        dVerForm: z.string(),
        dCufe: z.string(),
        gInfProt: z.object({
          dId: z.string(),
          iAmb: z.string(),
          dVerApl: z.string(),
          dCUFE: z.string(),
          dFecProc: z.string(),
          dProtAut: z.string(),
          dDigVal: z.string(),
          gResProc: z.object({
            dCodRes: z.string(),
            dMsgRes: z.string()
          })
        })
      })
    })),
    urlCufe: z.string(),
    urlCufeAlternative: z.string(),
    xmlIn: z.any().nullable(),
    sendFail: z.boolean()
  })),
  Status: z.object({
    Code: z.string(),
    Message: z.string()
  }),
  Info: z.object({
    Datetime: z.string(),
    AcceptedUser: z.boolean()
  }),
  Errors: z.any().nullable()
});

// Tipos TypeScript derivados
export type DGIPayload = z.infer<typeof DGIPayloadSchema>;
export type DGIResponse = z.infer<typeof DGIResponseSchema>;
export type DGIItem = z.infer<typeof DGIItemSchema>;
export type DGITotals = z.infer<typeof DGITotalsSchema>;

// Interfaces para la base de datos
export interface Emitter {
  id: string;
  name: string;
  company_code: string;
  ruc_tipo: string;
  ruc_numero: string;
  ruc_dv: string;
  suc_em: string;
  pto_fac_default: string;
  iamb: number;
  itpemis_default: string;
  idoc_default: string;
  email: string;
  phone?: string;
  address_line?: string;
  ubi_code?: string;
  pac_api_key: string;
  pac_subscription_key: string;
  is_active: boolean;
}

export interface Customer {
  id: string;
  emitter_id: string;
  name: string;
  email: string;
  phone?: string;
  address_line?: string;
  ubi_code?: string;
  tax_id?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  emitter_id: string;
  sku: string;
  description: string;
  cpbs_abr?: string;
  cpbs_cmp?: string;
  unit_price: number;
  tax_rate: string;
  is_active: boolean;
}

export interface Invoice {
  id: string;
  emitter_id: string;
  series_id: string;
  customer_id: string;
  doc_kind: DocumentType;
  d_nrodf: string;
  d_ptofacdf: string;
  status: DocumentStatus;
  email_status: EmailStatus;
  cufe?: string;
  url_cufe?: string;
  xml_response?: string;
  xml_fe?: string;
  subtotal: number;
  itbms_amount: number;
  total_amount: number;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  line_no: number;
  sku?: string;
  description: string;
  qty: number;
  unit_price: number;
  itbms_rate: string;
  cpbs_abr?: string;
  cpbs_cmp?: string;
  line_total: number;
}

// Request/Response types para la API
export interface CreateInvoiceRequest {
  emitter_id: string;
  customer_id: string;
  items: Omit<InvoiceItem, 'id' | 'invoice_id'>[];
  payment_methods: Array<{
    method_code: string;
    amount: number;
  }>;
  notification_emails?: Array<{
    email: string;
    name: string;
  }>;
  idempotency_key?: string;
}

export interface InvoiceStatusResponse {
  id: string;
  status: DocumentStatus;
  email_status: EmailStatus;
  cufe?: string;
  url_cufe?: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
}
