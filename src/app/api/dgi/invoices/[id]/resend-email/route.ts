import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/services/database';
import { inngest } from '@/lib/inngest';
import { DocumentStatus } from '@/types/dgi';

/**
 * POST /api/dgi/invoices/[id]/resend-email
 * Resend email for an authorized invoice
 */
export async function POST(
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
    
    // Can only resend email for authorized invoices
    if (invoice.status !== DocumentStatus.AUTHORIZED) {
      return NextResponse.json({
        success: false,
        error: 'Can only resend email for authorized invoices'
      }, { status: 400 });
    }
    
    if (!invoice.cufe || !invoice.url_cufe) {
      return NextResponse.json({
        success: false,
        error: 'Invoice missing CUFE data'
      }, { status: 400 });
    }
    
    // Trigger email sending workflow
    await inngest.send({
      name: 'dgi/invoice.email.send',
      data: {
        invoiceId,
        cufe: invoice.cufe,
        urlCufe: invoice.url_cufe
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Email resend triggered successfully'
    });
    
  } catch (error) {
    console.error('Error resending email:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
