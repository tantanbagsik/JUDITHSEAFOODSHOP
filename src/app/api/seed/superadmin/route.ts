import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

const SUPER_ADMIN_CREDENTIALS = {
  email: 'superadmin@judithseafoods.com',
  password: 'SuperAdmin@2025!Secure',
  name: 'Super Administrator',
};

export async function POST() {
  try {
    await dbConnect();

    const existingUser = await User.findOne({ email: SUPER_ADMIN_CREDENTIALS.email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Super admin account already exists', user: { email: existingUser.email, role: existingUser.role } },
        { status: 400 }
      );
    }

    const user = await User.create({
      name: SUPER_ADMIN_CREDENTIALS.name,
      email: SUPER_ADMIN_CREDENTIALS.email.toLowerCase(),
      password: SUPER_ADMIN_CREDENTIALS.password,
      role: 'superadmin',
      emailVerified: new Date(),
    });

    return NextResponse.json(
      {
        message: 'Super admin account created successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create super admin error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
