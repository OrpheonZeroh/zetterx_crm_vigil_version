import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/services/database';
import { InvoiceStatusResponse } from '@/types/dgi';

/**
 * GET /api/dgi/invoices/[id]
 * Get invoice status and details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    
    if (!invoiceId) {
      return NextResponse.json({
        success: false,
        error: 'Invoice ID is required'
      }, { status: 400 });
    }
    
    const invoice = await dbService.getInvoice(invoiceId);
    
    if (!invoice) {
      return NextResponse.json({
        success: false,
        error: 'Invoice not found'
      }, { status: 404 });
    }
    
    // Get latest API call for error details if needed
    let errorMessage: string | undefined;
    if (invoice.status === 'REJECTED' || invoice.status === 'ERROR') {
      // This would query the latest API call to get error details
      // errorMessage = await dbService.getLatestApiCallError(invoiceId);
    }
    
    const response: InvoiceStatusResponse = {
      id: invoice.id,
      status: invoice.status,
      email_status: invoice.email_status,
      cufe: invoice.cufe,
      url_cufe: invoice.url_cufe,
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
      error_message: errorMessage
    };
    
    return NextResponse.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('Error getting invoice status:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/dgi/invoices/[id]
 * Cancel an invoice (only if not yet submitted to DGI)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    
    const invoice = await dbService.getInvoice(invoiceId);
    
    if (!invoice) {
      return NextResponse.json({
        success: false,
        error: 'Invoice not found'
      }, { status: 404 });
    }
    
    // Can only cancel invoices that haven't been submitted to DGI
    if (!['RECEIVED', 'PREPARING'].includes(invoice.status)) {
      return NextResponse.json({
        success: false,
        error: 'Cannot cancel invoice that has been submitted to DGI'
      }, { status: 400 });
    }
    
    // Update status to cancelled (would need to add CANCELLED to enum)
    await dbService.updateInvoiceStatus(invoiceId, 'ERROR' as any); // Using ERROR as placeholder
    
    return NextResponse.json({
      success: true,
      message: 'Invoice cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
