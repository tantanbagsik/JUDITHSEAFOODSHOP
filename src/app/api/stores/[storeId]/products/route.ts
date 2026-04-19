import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';
import Store from '@/lib/models/Store';
import User from '@/lib/models/User';
import { authOptions } from '@/lib/auth';
import { slugify } from '@/lib/utils';

async function ensureStoreExists(userId: string, userName: string): Promise<typeof Store.prototype> {
  const user = await User.findById(userId);
  
  if (user?.storeId) {
    const store = await Store.findById(user.storeId);
    if (store) {
      return store;
    }
  }

  const baseSlug = slugify(`${userName}'s Store`);
  let slug = baseSlug;
  let counter = 1;

  while (await Store.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const store = await Store.create({
    name: `${userName}'s Store`,
    slug,
    owner: userId,
    description: `Welcome to ${userName}'s Store`,
    subscription: {
      plan: 'free',
      status: 'active',
    },
    settings: {
      currency: 'USD',
      timezone: 'UTC',
      shippingFee: 0,
      freeShippingThreshold: 0,
      taxRate: 0,
    },
    isActive: true,
    isApproved: true,
  });

  await User.findByIdAndUpdate(userId, {
    role: 'vendor',
    storeId: store._id,
  });

  return store;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let store = await Store.findById(session.user.storeId);
    
    if (!store) {
      store = await ensureStoreExists(session.user.id, session.user.name || 'User');
    }

    if (!store || !store.isActive) {
      return NextResponse.json({ error: 'Store not found or inactive' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      sku,
      price,
      comparePrice,
      cost,
      images,
      videos,
      categoryId,
      tags,
      inventory,
      isActive,
      isFeatured,
      variants,
      attributes,
      weight,
      dimensions,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const productData: any = {
      storeId: store._id,
      name,
      description,
      sku,
      price,
      comparePrice,
      cost,
      images: images || [],
      videos: videos || [],
      tags: tags || [],
      inventory: inventory || 0,
      isActive: isActive ?? true,
      isFeatured: isFeatured ?? false,
      variants: variants || [],
      attributes: attributes || {},
      weight,
      dimensions,
    };

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      productData.categoryId = categoryId;
    }

    const product = await Product.create(productData);

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const categoryId = searchParams.get('categoryId');
    const featured = searchParams.get('featured');
    const active = searchParams.get('active');
    const search = searchParams.get('search');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    await dbConnect();

    const query: any = { storeId };

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (active !== null) {
      query.isActive = active === 'true';
    }

    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
