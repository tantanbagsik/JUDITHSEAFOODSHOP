import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Store from '@/lib/models/Store';
import User from '@/lib/models/User';
import { authOptions } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 });
    }

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;

    while (await Store.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const store = await Store.create({
      name,
      slug,
      description,
      owner: session.user.id,
      subscription: {
        plan: 'free',
        status: 'active',
      },
      isActive: true,
      isApproved: true,
    });

    await User.findByIdAndUpdate(session.user.id, {
      role: 'vendor',
      storeId: store._id,
    });

    return NextResponse.json(store, { status: 201 });
  } catch (error: any) {
    console.error('Create store error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('owner');

    const query: any = {};
    if (ownerId) {
      query.owner = ownerId;
    } else {
      query.owner = session.user.id;
    }

    const stores = await Store.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json(stores);
  } catch (error: any) {
    console.error('Get stores error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
