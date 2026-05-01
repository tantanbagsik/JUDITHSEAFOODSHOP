import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Store from '@/lib/models/Store';
import User from '@/lib/models/User';
import { authOptions } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status === 'pending') {
      query.isApproved = false;
    } else if (status === 'approved') {
      query.isApproved = true;
    }

    const stores = await Store.find(query)
      .populate('owner', 'name email phone role')
      .sort({ createdAt: -1 });

    return NextResponse.json(stores);
  } catch (error: any) {
    console.error('Admin get stores error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { name, description, ownerEmail } = body;

    if (!name) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 });
    }

    let owner;
    if (ownerEmail) {
      owner = await User.findOne({ email: ownerEmail });
      if (!owner) {
        return NextResponse.json({ error: 'User with that email not found' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: 'Owner email is required' }, { status: 400 });
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
      owner: owner._id,
      subscription: {
        plan: body.subscription?.plan || 'free',
        status: body.subscription?.status || 'active',
      },
      settings: body.settings || {},
      isActive: body.isActive !== undefined ? body.isActive : true,
      isApproved: body.isApproved !== undefined ? body.isApproved : false,
    });

    if (owner.role !== 'vendor') {
      await User.findByIdAndUpdate(owner._id, {
        role: 'vendor',
        storeId: store._id,
      });
    }

    const populatedStore = await Store.findById(store._id)
      .populate('owner', 'name email phone role');

    return NextResponse.json(populatedStore, { status: 201 });
  } catch (error: any) {
    console.error('Admin create store error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { storeId, ...updateData } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const store = await Store.findById(storeId);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const allowedUpdates: any = {};
    
    if (updateData.name !== undefined) allowedUpdates.name = updateData.name;
    if (updateData.description !== undefined) allowedUpdates.description = updateData.description;
    if (updateData.logo !== undefined) allowedUpdates.logo = updateData.logo;
    if (updateData.banner !== undefined) allowedUpdates.banner = updateData.banner;
    if (updateData.isActive !== undefined) allowedUpdates.isActive = updateData.isActive;
    if (updateData.isApproved !== undefined) allowedUpdates.isApproved = updateData.isApproved;
    if (updateData.customDomain !== undefined) allowedUpdates.customDomain = updateData.customDomain;
    
    if (updateData.subscription) {
      const currentSubscription = (store.subscription as any)?.toObject?.() || store.subscription;
      allowedUpdates.subscription = {
        ...currentSubscription,
        ...updateData.subscription,
      };
    }
    
    if (updateData.settings) {
      const currentSettings = (store.settings as any)?.toObject?.() || store.settings;
      allowedUpdates.settings = {
        ...currentSettings,
        ...updateData.settings,
      };
    }

    if (updateData.name && !updateData.slug) {
      allowedUpdates.slug = slugify(updateData.name);
    } else if (updateData.slug) {
      allowedUpdates.slug = slugify(updateData.slug);
    }

    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      { $set: allowedUpdates },
      { new: true }
    ).populate('owner', 'name email phone role');

    return NextResponse.json(updatedStore);
  } catch (error: any) {
    console.error('Admin update store error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    await dbConnect();

    const store = await Store.findById(storeId);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    await Store.findByIdAndDelete(storeId);

    await User.findByIdAndUpdate(store.owner, {
      $unset: { storeId: 1 },
    });

    return NextResponse.json({ message: 'Store deleted successfully' });
  } catch (error: any) {
    console.error('Admin delete store error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
