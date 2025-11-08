import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { document, documentCategory, user } from '@/drizzle/schema';
import { eq, desc, and, or, like, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET - Fetch documents with filters
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || 'ACTIVE';
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    // Build query conditions
    const conditions = [eq(document.status, status)];

    if (categoryId) {
      conditions.push(eq(document.categoryId, categoryId));
    }

    if (search) {
      conditions.push(
        or(
          like(document.title, `%${search}%`),
          like(document.description, `%${search}%`),
          like(document.documentCode, `%${search}%`)
        )!
      );
    }

    // Fetch documents with category and uploader info
    const documents = await db
      .select({
        id: document.id,
        documentCode: document.documentCode,
        categoryId: document.categoryId,
        categoryName: documentCategory.name,
        title: document.title,
        description: document.description,
        fileUrl: document.fileUrl,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        version: document.version,
        tags: document.tags,
        status: document.status,
        relatedEntityType: document.relatedEntityType,
        relatedEntityId: document.relatedEntityId,
        uploadedByUserId: document.uploadedByUserId,
        uploaderName: user.name,
        uploaderEmail: user.email,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      })
      .from(document)
      .leftJoin(documentCategory, eq(document.categoryId, documentCategory.id))
      .leftJoin(user, eq(document.uploadedByUserId, user.id))
      .where(and(...conditions))
      .orderBy(desc(document.createdAt));

    // Fetch all categories for filter
    const categories = await db
      .select({
        id: documentCategory.id,
        name: documentCategory.name,
        code: documentCategory.code,
      })
      .from(documentCategory)
      .where(eq(documentCategory.isActive, true));

    return NextResponse.json({
      success: true,
      data: documents,
      categories,
    });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
