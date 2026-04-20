import { NextResponse } from 'next/server';
import { generateImportTemplate } from '@/utils/exportGenerator';
import { adminFirestore } from '@/db/firebase/firebaseAdmin';

/**
 * GET /api/products/template
 * Generates and returns a CSV template for product import.
 * Fetches the highest product number from Firestore to set correct starting numbers.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('type') as any;

    // Fetch highest product number from Firestore
    let nextNumber = 1;
    if (adminFirestore) {
      try {
        const snapshot = await adminFirestore
          .collection("products")
          .orderBy("productNumber", "desc")
          .limit(1)
          .get();
        if (!snapshot.empty) {
          const highest = snapshot.docs[0].data().productNumber;
          nextNumber = Number(highest) + 1;
          if (isNaN(nextNumber)) nextNumber = 1;
        }
      } catch {
        // ignore — use default starting number
      }
    }

    // Generate template with correct starting numbers
    const template = generateImportTemplate(productType, nextNumber);

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
