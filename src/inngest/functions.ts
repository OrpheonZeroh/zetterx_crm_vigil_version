import { inngest } from '@/lib/inngest';
import { DocumentStatus, EmailStatus } from '@/types/dgi';
import { dbService } from '@/services/database';
import { createDGIClient, DGIClient } from '@/services/dgi-client';
import { emailService } from '@/services/email';

/**
 * Main DGI Invoice Processing State Machine
 * Handles the complete flow: RECEIVED -> PREPARING -> SENDING_TO_PAC -> AUTHORIZED/REJECTED -> EMAIL
 */
export const processInvoice = inngest.createFunction(
  {
    id: 'process-dgi-invoice',
    name: 'Process DGI Invoice',
    retries: 3,
    concurrency: {
      limit: 10,
      key: 'event.data.emitterId'
    }
  },
  { event: 'dgi/invoice.created' },
  async ({ event, step }) => {
    const { invoiceId, emitterId } = event.data;
    
    // Step 1: Validate and prepare invoice data
    const invoiceData = await step.run('prepare-invoice-data', async () => {
      console.log(`Processing invoice ${invoiceId} for emitter ${emitterId}`);
      
      // Update status to PREPARING
      await dbService.updateInvoiceStatus(invoiceId, DocumentStatus.PREPARING);
      
      // Get complete invoice data
      const invoice = await dbService.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }
      
      const [emitter, customer, items] = await Promise.all([
        dbService.getEmitter(emitterId),
        dbService.getCustomer(invoice.customer_id),
        dbService.getInvoiceItems(invoiceId)
      ]);
      
      if (!emitter || !customer) {
        throw new Error('Missing emitter or customer data');
      }
      
      if (!items || items.length === 0) {
        throw new Error('No invoice items found');
      }
      
      return {
        invoice,
        emitter,
        customer,
        items
      };
    });
    
    // Step 2: Build DGI payload
    const dgiPayload = await step.run('build-dgi-payload', async () => {
      const { invoice, emitter, customer, items } = invoiceData;
      
      // Default payment method (should come from invoice data in real implementation)
      const paymentMethods = [{ method_code: '02', amount: invoice.total_amount }];
      
      // Build notification emails (customer + optional CCs)
      const notificationEmails = [{
        email: customer.email,
        name: customer.name
      }];
      
      const payload = DGIClient.buildPayload(
        emitter,
        customer,
        items,
        invoice.d_nrodf,
        paymentMethods,
        notificationEmails
      );
      
      return payload;
    });
    
    // Step 3: Submit to DGI with retry logic
    const dgiResponse = await step.run('submit-to-dgi', async () => {
      const { emitter } = invoiceData;
      
      // Update status to SENDING_TO_PAC
      await dbService.updateInvoiceStatus(invoiceId, DocumentStatus.SENDING_TO_PAC);
      
      // Create API call record
      const apiCallId = await dbService.createApiCall(
        invoiceId,
        '/mdl18/feRecepFEDGI',
        dgiPayload,
        emitter.company_code
      );
      
      try {
        const dgiClient = createDGIClient(emitter);
        const response = await dgiClient.submitInvoice(dgiPayload);
        
        // Update API call with success
        await dbService.updateApiCall(apiCallId, response, 200, 'success');
        
        return { response, apiCallId };
      } catch (error) {
        // Update API call with error
        await dbService.updateApiCall(
          apiCallId, 
          { error: error instanceof Error ? error.message : 'Unknown error' },
          error instanceof Error && 'status' in error ? (error as any).status : 500,
          'error'
        );
        throw error;
      }
    });
    
    // Step 4: Process DGI response
    const processingResult = await step.run('process-dgi-response', async () => {
      const { response } = dgiResponse;
      
      if (DGIClient.isSuccessResponse(response)) {
        const successData = DGIClient.extractSuccessData(response);
        
        if (successData) {
          // Update invoice with authorization data
          await dbService.updateInvoiceStatus(invoiceId, DocumentStatus.AUTHORIZED, {
            cufe: successData.cufe,
            url_cufe: successData.urlCufe,
            xml_response: JSON.stringify(response),
            xml_fe: successData.xmlFE
          });
          
          return {
            success: true,
            cufe: successData.cufe,
            urlCufe: successData.urlCufe,
            xmlFE: successData.xmlFE
          };
        }
      }
      
      // Handle rejection/error
      const errorMessage = DGIClient.getErrorFromResponse(response);
      await dbService.updateInvoiceStatus(invoiceId, DocumentStatus.REJECTED);
      
      // Send error notification to support
      await emailService.sendErrorNotification(invoiceId, errorMessage, {
        response,
        payload: dgiPayload
      });
      
      return {
        success: false,
        error: errorMessage
      };
    });
    
    // Step 5: Send email notification (only if authorized)
    if (processingResult.success && 'cufe' in processingResult && 'urlCufe' in processingResult) {
      await step.sendEvent('send-invoice-email', {
        name: 'dgi/invoice.email.send',
        data: {
          invoiceId,
          cufe: processingResult.cufe,
          urlCufe: processingResult.urlCufe
        }
      });
    }
    
    return processingResult;
  }
);

/**
 * Email sending function with retry logic
 */
export const sendInvoiceEmail = inngest.createFunction(
  {
    id: 'send-invoice-email',
    name: 'Send Invoice Email',
    retries: 5,
    concurrency: {
      limit: 20
    }
  },
  { event: 'dgi/invoice.email.send' },
  async ({ event, step }) => {
    const { invoiceId, cufe, urlCufe } = event.data;
    
    const result = await step.run('send-email', async () => {
      // Get invoice and customer data
      const [invoice, customer] = await Promise.all([
        dbService.getInvoice(invoiceId),
        dbService.getInvoice(invoiceId).then(inv => 
          inv ? dbService.getCustomer(inv.customer_id) : null
        )
      ]);
      
      if (!invoice || !customer) {
        throw new Error('Invoice or customer not found');
      }
      
      // Create email log
      const emailId = await dbService.createEmailLog(
        invoiceId,
        customer.email,
        `Factura Electrónica ${invoice.d_nrodf} - Autorizada por DGI`
      );
      
      try {
        // Send email
        const emailResult = await emailService.sendInvoiceEmail(
          customer.email,
          `Factura Electrónica ${invoice.d_nrodf} - Autorizada por DGI`,
          customer.name,
          invoice.d_nrodf,
          cufe,
          urlCufe
          // TODO: Add PDF and XML attachments here
        );
        
        if (emailResult.success) {
          // Update statuses
          await Promise.all([
            dbService.updateInvoiceEmailStatus(invoiceId, EmailStatus.SENT),
            dbService.updateEmailLog(emailId, EmailStatus.SENT, emailResult.messageId)
          ]);
          
          return { success: true, emailId, messageId: emailResult.messageId };
        } else {
          // Update with failure
          await Promise.all([
            dbService.updateInvoiceEmailStatus(invoiceId, EmailStatus.FAILED),
            dbService.updateEmailLog(emailId, EmailStatus.FAILED, undefined, emailResult.error)
          ]);
          
          throw new Error(emailResult.error || 'Email sending failed');
        }
      } catch (error) {
        // Update with retry status
        await dbService.updateEmailLog(
          emailId, 
          EmailStatus.RETRYING, 
          undefined, 
          error instanceof Error ? error.message : 'Unknown error'
        );
        throw error;
      }
    });
    
    return result;
  }
);

/**
 * Cleanup and monitoring functions
 */

// Monitor stuck invoices and retry
export const retryStuckInvoices = inngest.createFunction(
  {
    id: 'retry-stuck-invoices',
    name: 'Retry Stuck Invoices'
  },
  { cron: '*/15 * * * *' }, // Every 15 minutes
  async ({ step }) => {
    await step.run('find-and-retry-stuck-invoices', async () => {
      // This would query for invoices stuck in SENDING_TO_PAC or PREPARING for too long
      // and trigger retries. Implementation depends on your specific requirements.
      console.log('Checking for stuck invoices...');
      
      // TODO: Implement stuck invoice detection and retry logic
      return { checked: true };
    });
  }
);

// Retry failed emails
export const retryFailedEmails = inngest.createFunction(
  {
    id: 'retry-failed-emails',
    name: 'Retry Failed Emails'
  },
  { cron: '0 */2 * * *' }, // Every 2 hours
  async ({ step }) => {
    await step.run('retry-failed-emails', async () => {
      // Query for invoices with AUTHORIZED status but FAILED email status
      // and retry sending emails
      console.log('Retrying failed emails...');
      
      // TODO: Implement failed email retry logic
      return { retried: true };
    });
  }
);

// Export all functions
export const functions = [
  processInvoice,
  sendInvoiceEmail,
  retryStuckInvoices,
  retryFailedEmails
];
