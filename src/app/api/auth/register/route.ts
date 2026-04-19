import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Store from '@/lib/models/Store';
import { slugify } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, email, password, userType, storeName } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const isVendor = userType === 'vendor';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: isVendor ? 'vendor' : 'customer',
    });

    if (isVendor) {
      const defaultStoreName = storeName || `${name}'s Store`;
      const baseSlug = slugify(defaultStoreName);
      let slug = baseSlug;
      let counter = 1;

      while (await Store.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const store = await Store.create({
        name: defaultStoreName,
        slug,
        owner: user._id,
        description: `Welcome to ${defaultStoreName}`,
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

      await User.findByIdAndUpdate(user._id, {
        storeId: store._id,
      });

      return NextResponse.json(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: 'vendor',
            storeId: store._id,
            storeSlug: store.slug,
          },
          store: {
            id: store._id,
            name: store.name,
            slug: store.slug,
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: 'customer',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
