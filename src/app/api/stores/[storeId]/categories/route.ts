import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Category from '@/lib/models/Category';
import Store from '@/lib/models/Store';
import { authOptions } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { name, description, image, parentId, order } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const slug = slugify(name);

    const existingCategory = await Category.findOne({
      storeId: session.user.storeId,
      slug,
    });

    if (existingCategory) {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 });
    }

    const category = await Category.create({
      storeId: session.user.storeId,
      name,
      slug,
      description,
      image,
      parentId,
      order: order || 0,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const parentId = searchParams.get('parentId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    await dbConnect();

    const query: any = { storeId };

    if (parentId === 'null') {
      query.parentId = null;
    } else if (parentId) {
      query.parentId = parentId;
    }

    const categories = await Category.find(query).sort({ order: 1, name: 1 });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
