import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Video from '@/lib/models/Video';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await params;

    if (session.user.storeId !== storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const videos = await Video.find({ storeId: new mongoose.Types.ObjectId(storeId) })
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json(videos);
  } catch (error) {
    console.error('Get videos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await params;

    if (session.user.storeId !== storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { url, title, description, thumbnail, duration, type } = body;

    if (!url || !title) {
      return NextResponse.json({ error: 'URL and title are required' }, { status: 400 });
    }

    await dbConnect();
    const video = await Video.create({
      storeId: new mongoose.Types.ObjectId(storeId),
      url,
      title,
      description,
      thumbnail,
      duration,
      type: type || 'url',
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error('Create video error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await params;
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (session.user.storeId !== storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    await dbConnect();
    await Video.findOneAndDelete({ 
      _id: new mongoose.Types.ObjectId(videoId),
      storeId: new mongoose.Types.ObjectId(storeId)
    });

    return NextResponse.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
