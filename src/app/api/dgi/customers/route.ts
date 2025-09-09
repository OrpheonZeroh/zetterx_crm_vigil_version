import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbService } from '@/services/database';

const CreateCustomerSchema = z.object({
  emitter_id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address_line: z.string().optional(),
  ubi_code: z.string().optional(),
  tax_id: z.string().optional()
});

/**
 * POST /api/dgi/customers
 * Create a new customer
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CreateCustomerSchema.parse(body);
    
    // This would create the customer in the database
    // const customerId = await dbService.createCustomer(validatedData);
    
    return NextResponse.json({
      success: true,
      message: 'Customer created successfully',
      // customer_id: customerId
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating customer:', error);
    
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
 * GET /api/dgi/customers?emitter_id=xxx&search=xxx&limit=10&offset=0
 * List customers with filtering and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const emitterId = searchParams.get('emitter_id');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!emitterId) {
      return NextResponse.json({
        success: false,
        error: 'emitter_id is required'
      }, { status: 400 });
    }
    
    // This would list customers from the database
    // const customers = await dbService.listCustomers(emitterId, search, limit, offset);
    
    return NextResponse.json({
      success: true,
      data: [], // customers
      pagination: {
        limit,
        offset,
        total: 0
      }
    });
    
  } catch (error) {
    console.error('Error listing customers:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
