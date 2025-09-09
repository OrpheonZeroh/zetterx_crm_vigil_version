import { createClient } from '@supabase/supabase-js';
import { 
  DocumentStatus, 
  EmailStatus, 
  Emitter, 
  Customer, 
  Product, 
  Invoice, 
  InvoiceItem,
  CreateInvoiceRequest 
} from '@/types/dgi';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class DatabaseService {
  
  // =========== EMITTER OPERATIONS ===========
  async getEmitter(emitterId: string): Promise<Emitter | null> {
    const { data, error } = await supabase
      .from('emitters')
      .select('*')
      .eq('id', emitterId)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('Error fetching emitter:', error);
      return null;
    }
    
    return data;
  }

  async getEmitterByCompanyCode(companyCode: string): Promise<Emitter | null> {
    const { data, error } = await supabase
      .from('emitters')
      .select('*')
      .eq('company_code', companyCode)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('Error fetching emitter by company code:', error);
      return null;
    }
    
    return data;
  }

  async createEmitter(emitterData: any): Promise<string> {
    const emitterId = uuidv4();
    
    const { data, error } = await supabase
      .from('emitters')
      .insert({
        id: emitterId,
        ...emitterData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating emitter:', error);
      throw new Error(`Failed to create emitter: ${error.message}`);
    }
    
    return data.id;
  }

  // =========== CUSTOMER OPERATIONS ===========
  async getCustomer(customerId: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
    
    return data;
  }

  async createCustomer(customerData: any): Promise<string> {
    const customerId = uuidv4();
    
    const { data, error } = await supabase
      .from('customers')
      .insert({
        id: customerId,
        ...customerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
    
    return data.id;
  }

  // =========== PRODUCT OPERATIONS ===========
  async getProductBySku(emitterId: string, sku: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('emitter_id', emitterId)
      .eq('sku', sku)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    
    return data;
  }

  // =========== INVOICE OPERATIONS ===========
  async createInvoice(request: CreateInvoiceRequest): Promise<string> {
    const invoiceId = uuidv4();
    
    // Get emitter and customer data
    const [emitter, customer] = await Promise.all([
      this.getEmitter(request.emitter_id),
      this.getCustomer(request.customer_id)
    ]);

    if (!emitter || !customer) {
      throw new Error('Emitter or customer not found');
    }

    // Get or create series for this emitter and document type
    const series = await this.getOrCreateSeries(emitter.id, 'invoice', emitter.pto_fac_default);
    
    // Generate document number (10 digits)
    const docNumber = this.generateDocumentNumber(series.next_number);

    // Start transaction
    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        id: invoiceId,
        emitter_id: request.emitter_id,
        series_id: series.id,
        customer_id: request.customer_id,
        doc_kind: 'invoice',
        d_nrodf: docNumber,
        d_ptofacdf: emitter.pto_fac_default,
        status: DocumentStatus.RECEIVED,
        email_status: EmailStatus.PENDING,
        iamb: emitter.iamb,
        itpemis: emitter.itpemis_default,
        idoc: emitter.idoc_default,
        subtotal: 0,
        itbms_amount: 0,
        total_amount: 0,
        idempotency_key: request.idempotency_key
      });

    if (invoiceError) {
      throw new Error(`Failed to create invoice: ${invoiceError.message}`);
    }

    // Insert invoice items
    const itemsData = request.items.map((item, index) => ({
      id: uuidv4(),
      invoice_id: invoiceId,
      line_no: index + 1,
      sku: item.sku,
      description: item.description,
      qty: item.qty,
      unit_price: item.unit_price,
      itbms_rate: item.itbms_rate,
      cpbs_abr: item.cpbs_abr,
      cpbs_cmp: item.cpbs_cmp,
      line_total: item.line_total
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsData);

    if (itemsError) {
      throw new Error(`Failed to create invoice items: ${itemsError.message}`);
    }

    // Calculate totals
    const subtotal = request.items.reduce((sum, item) => sum + item.line_total, 0);
    const itbmsAmount = request.items.reduce((sum, item) => {
      const rate = parseFloat(item.itbms_rate) / 100;
      return sum + (item.line_total * rate);
    }, 0);
    const totalAmount = subtotal + itbmsAmount;

    // Update invoice totals
    await supabase
      .from('invoices')
      .update({
        subtotal,
        itbms_amount: itbmsAmount,
        total_amount: totalAmount
      })
      .eq('id', invoiceId);

    // Update series next number
    await supabase
      .from('emitter_series')
      .update({ next_number: series.next_number + 1 })
      .eq('id', series.id);

    return invoiceId;
  }

  async updateInvoiceStatus(
    invoiceId: string, 
    status: DocumentStatus, 
    updates?: Partial<Invoice>
  ): Promise<void> {
    const updateData = { status, ...updates };
    
    const { error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId);

    if (error) {
      throw new Error(`Failed to update invoice status: ${error.message}`);
    }
  }

  async updateInvoiceEmailStatus(
    invoiceId: string, 
    emailStatus: EmailStatus
  ): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .update({ email_status: emailStatus })
      .eq('id', invoiceId);

    if (error) {
      throw new Error(`Failed to update invoice email status: ${error.message}`);
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        emitter:emitters(*),
        customer:customers(*),
        items:invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single();
    
    if (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
    
    return data;
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('line_no');
    
    if (error) {
      console.error('Error fetching invoice items:', error);
      return [];
    }
    
    return data;
  }

  // =========== API CALLS TRACKING ===========
  async createApiCall(
    invoiceId: string,
    endpoint: string,
    payload: any,
    credentialId?: string
  ): Promise<string> {
    const apiCallId = uuidv4();
    
    const { error } = await supabase
      .from('invoice_api_calls')
      .insert({
        id: apiCallId,
        invoice_id: invoiceId,
        endpoint,
        method: 'POST',
        used_credential: credentialId,
        request_payload: payload,
        status: 'pending'
      });

    if (error) {
      throw new Error(`Failed to create API call record: ${error.message}`);
    }

    return apiCallId;
  }

  async updateApiCall(
    apiCallId: string,
    response: any,
    httpStatus: number,
    status: 'success' | 'error'
  ): Promise<void> {
    const { error } = await supabase
      .from('invoice_api_calls')
      .update({
        response_payload: response,
        http_status: httpStatus,
        status
      })
      .eq('id', apiCallId);

    if (error) {
      throw new Error(`Failed to update API call record: ${error.message}`);
    }
  }

  // =========== EMAIL LOGS ===========
  async createEmailLog(
    invoiceId: string,
    toEmail: string,
    subject: string,
    ccEmails?: string[]
  ): Promise<string> {
    const emailId = uuidv4();
    
    const { error } = await supabase
      .from('email_logs')
      .insert({
        id: emailId,
        invoice_id: invoiceId,
        to_email: toEmail,
        cc_emails: ccEmails,
        subject,
        status: EmailStatus.PENDING,
        attempts: 0
      });

    if (error) {
      throw new Error(`Failed to create email log: ${error.message}`);
    }

    return emailId;
  }

  async updateEmailLog(
    emailId: string,
    status: EmailStatus,
    providerId?: string,
    errorMsg?: string
  ): Promise<void> {
    const updateData: any = { status };
    
    if (providerId) updateData.provider_id = providerId;
    if (errorMsg) updateData.error_msg = errorMsg;
    if (status === EmailStatus.SENT) updateData.sent_at = new Date().toISOString();
    
    // Increment attempts for failed status
    if (status === EmailStatus.FAILED || status === EmailStatus.RETRYING) {
      const { data: current } = await supabase
        .from('email_logs')
        .select('attempts')
        .eq('id', emailId)
        .single();
      
      updateData.attempts = (current?.attempts || 0) + 1;
    }

    const { error } = await supabase
      .from('email_logs')
      .update(updateData)
      .eq('id', emailId);

    if (error) {
      throw new Error(`Failed to update email log: ${error.message}`);
    }
  }

  // =========== HELPER METHODS ===========
  private async getOrCreateSeries(emitterId: string, docKind: string, ptoFacDf: string) {
    // Try to get existing series
    const { data: existingSeries } = await supabase
      .from('emitter_series')
      .select('*')
      .eq('emitter_id', emitterId)
      .eq('doc_kind', docKind)
      .eq('pto_fac_df', ptoFacDf)
      .eq('is_active', true)
      .single();

    if (existingSeries) {
      return existingSeries;
    }

    // Create new series
    const seriesId = uuidv4();
    const { data: newSeries, error } = await supabase
      .from('emitter_series')
      .insert({
        id: seriesId,
        emitter_id: emitterId,
        pto_fac_df: ptoFacDf,
        doc_kind: docKind,
        next_number: 1,
        issued_count: 0,
        authorized_count: 0,
        rejected_count: 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create series: ${error.message}`);
    }

    return newSeries;
  }

  private generateDocumentNumber(nextNumber: number): string {
    return nextNumber.toString().padStart(10, '0');
  }
}

export const dbService = new DatabaseService();
