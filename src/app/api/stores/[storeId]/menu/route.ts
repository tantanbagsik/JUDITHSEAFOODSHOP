import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Menu from '@/lib/models/Menu';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { items } = body;

    let menu = await Menu.findOne({ storeId: session.user.storeId });

    if (menu) {
      menu.items = items;
      await menu.save();
    } else {
      menu = await Menu.create({
        storeId: session.user.storeId,
        items,
      });
    }

    return NextResponse.json(menu);
  } catch (error: any) {
    console.error('Save menu error:', error);
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

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    await dbConnect();

    let menu = await Menu.findOne({ storeId });

    if (!menu) {
      menu = await Menu.create({
        storeId,
        items: [
          { id: 'home', label: 'Home', type: 'link', url: '/' },
          { id: 'products', label: 'Products', type: 'link', url: '/products' },
        ],
      });
    }

    return NextResponse.json(menu);
  } catch (error: any) {
    console.error('Get menu error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
