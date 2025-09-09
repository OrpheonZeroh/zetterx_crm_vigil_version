import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbService } from '@/services/database';

const CreateProductSchema = z.object({
  emitter_id: z.string().uuid(),
  sku: z.string().min(1),
  description: z.string().min(1),
  cpbs_abr: z.string().optional(),
  cpbs_cmp: z.string().optional(),
  unit_price: z.number().positive(),
  tax_rate: z.string().default('00')
});

/**
 * POST /api/dgi/products
 * Create a new product/service
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CreateProductSchema.parse(body);
    
    // This would create the product in the database
    // const productId = await dbService.createProduct(validatedData);
    
    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      // product_id: productId
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating product:', error);
    
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
 * GET /api/dgi/products?emitter_id=xxx&search=xxx&limit=10&offset=0
 * List products with filtering and pagination
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
    
    // This would list products from the database
    // const products = await dbService.listProducts(emitterId, search, limit, offset);
    
    return NextResponse.json({
      success: true,
      data: [], // products
      pagination: {
        limit,
        offset,
        total: 0
      }
    });
    
  } catch (error) {
    console.error('Error listing products:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
