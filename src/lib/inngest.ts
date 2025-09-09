import { Inngest } from 'inngest';

// Configuración del cliente Inngest
export const inngest = new Inngest({
  id: 'zetterx-dgi-service',
  name: 'ZetterX DGI Integration Service',
});

// Tipos para los eventos del state machine
export interface DGIInvoiceCreatedEvent {
  name: 'dgi/invoice.created';
  data: {
    invoiceId: string;
    emitterId: string;
    idempotencyKey?: string;
  };
}

export interface DGIInvoicePayloadPreparedEvent {
  name: 'dgi/invoice.payload-prepared';
  data: {
    invoiceId: string;
    payload: any;
  };
}

export interface DGIInvoiceSubmittedEvent {
  name: 'dgi/invoice.submitted';
  data: {
    invoiceId: string;
    apiCallId: string;
  };
}

export interface DGIInvoiceAuthorizedEvent {
  name: 'dgi/invoice.authorized';
  data: {
    invoiceId: string;
    cufe: string;
    urlCufe: string;
    xmlResponse: string;
  };
}

export interface DGIInvoiceRejectedEvent {
  name: 'dgi/invoice.rejected';
  data: {
    invoiceId: string;
    error: string;
    errorCode?: string;
  };
}

export interface DGIInvoiceEmailSentEvent {
  name: 'dgi/invoice.email-sent';
  data: {
    invoiceId: string;
    emailId: string;
    recipient: string;
  };
}

// Union type para todos los eventos
export type DGIEvents = 
  | DGIInvoiceCreatedEvent
  | DGIInvoicePayloadPreparedEvent
  | DGIInvoiceSubmittedEvent
  | DGIInvoiceAuthorizedEvent
  | DGIInvoiceRejectedEvent
  | DGIInvoiceEmailSentEvent;
