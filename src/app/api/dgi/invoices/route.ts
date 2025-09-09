import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbService } from '@/services/database';
import { inngest } from '@/lib/inngest';
import { CreateInvoiceRequest } from '@/types/dgi';

// Validation schema for create invoice request
const CreateInvoiceSchema = z.object({
  emitter_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  items: z.array(z.object({
    line_no: z.number().positive(),
    sku: z.string().optional(),
    description: z.string().min(1),
    qty: z.number().positive(),
    unit_price: z.number().positive(),
    itbms_rate: z.string().default('00'),
    cpbs_abr: z.string().optional(),
    cpbs_cmp: z.string().optional(),
    line_total: z.number().positive()
  })).min(1),
  payment_methods: z.array(z.object({
    method_code: z.string(),
    amount: z.number().positive()
  })).min(1),
  notification_emails: z.array(z.object({
    email: z.string().email(),
    name: z.string()
  })).optional(),
  idempotency_key: z.string().optional()
});

/**
 * POST /api/dgi/invoices
 * Create a new DGI invoice and trigger processing
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request data
    const validatedData = CreateInvoiceSchema.parse(body);
    
    // Check for duplicate request using idempotency key
    if (validatedData.idempotency_key) {
      const existing = await dbService.getInvoice(validatedData.idempotency_key);
      if (existing) {
        return NextResponse.json({
          success: true,
          invoice_id: existing.id,
          status: existing.status,
          message: 'Invoice already exists (idempotent request)'
        });
      }
    }
    
    // Create invoice in database
    const invoiceId = await dbService.createInvoice(validatedData);
    
    // Trigger DGI processing workflow
    await inngest.send({
      name: 'dgi/invoice.created',
      data: {
        invoiceId,
        emitterId: validatedData.emitter_id,
        idempotencyKey: validatedData.idempotency_key
      }
    });
    
    return NextResponse.json({
      success: true,
      invoice_id: invoiceId,
      message: 'Invoice created and processing started'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating invoice:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * GET /api/dgi/invoices?emitter_id=xxx&status=xxx&limit=10&offset=0
 * List invoices with filtering and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const emitterId = searchParams.get('emitter_id');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!emitterId) {
      return NextResponse.json({
        success: false,
        error: 'emitter_id is required'
      }, { status: 400 });
    }
    
    // This would implement the actual query - simplified for now
    // const invoices = await dbService.listInvoices(emitterId, status, limit, offset);
    
    return NextResponse.json({
      success: true,
      data: [],
      pagination: {
        limit,
        offset,
        total: 0
      }
    });
    
  } catch (error) {
    console.error('Error listing invoices:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
