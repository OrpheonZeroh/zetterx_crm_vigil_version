import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbService } from '@/services/database';

const CreateEmitterSchema = z.object({
  name: z.string().min(1),
  company_code: z.string().min(1).max(10),
  ruc_tipo: z.enum(['1', '2', '3']),
  ruc_numero: z.string().min(1).max(20),
  ruc_dv: z.string().min(1).max(2),
  suc_em: z.string().default('0001'),
  pto_fac_default: z.string().default('001'),
  iamb: z.number().int().min(1).max(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address_line: z.string().optional(),
  ubi_code: z.string().optional(),
  pac_api_key: z.string().min(1),
  pac_subscription_key: z.string().min(1)
});

/**
 * POST /api/dgi/emitters
 * Create a new emitter (company that issues invoices)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CreateEmitterSchema.parse(body);
    
    // Create the emitter in the database
    const emitterId = await dbService.createEmitter(validatedData);
    
    return NextResponse.json({
      success: true,
      message: 'Emitter created successfully',
      emitter_id: emitterId
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating emitter:', error);
    
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
 * GET /api/dgi/emitters
 * List all active emitters
 */
export async function GET(req: NextRequest) {
  try {
    // This would list emitters from the database
    // const emitters = await dbService.listEmitters();
    
    return NextResponse.json({
      success: true,
      data: [] // emitters
    });
    
  } catch (error) {
    console.error('Error listing emitters:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
