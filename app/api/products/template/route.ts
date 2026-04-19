import { NextResponse } from 'next/server';
import { generateImportTemplate } from '@/utils/exportGenerator';

/**
 * GET /api/products/template
 * Generates and returns a CSV template for product import
 * @param request - Next.js request object
 * @returns CSV file response with import template
 */
export async function GET(request: Request) {
  try {
    // Get product type from query params if provided
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('type') as any;
    
    // Generate template
    const template = generateImportTemplate(productType);
    
    // Return as CSV file with type-specific filename
    const typeSuffix = productType ? `_${productType.toLowerCase()}` : '';
    return new NextResponse(template, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="product_import_template${typeSuffix}.csv"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}