import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import dbConnect from './db';
import User from './models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email }).select('+password');

        if (!user || !user.isActive) {
          throw new Error('Invalid credentials');
        }

        const isValid = await user.comparePassword(credentials.password);

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          storeId: user.storeId?.toString(),
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        await dbConnect();
        
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          const newUser = await User.create({
            name: user.name || 'User',
            email: user.email || '',
            avatar: (user.image || (profile as any)?.picture || (profile as any)?.avatar || (profile as any)?.picture?.data?.url || undefined) as string | undefined,
            role: 'customer',
            isActive: true,
            authProvider: account.provider,
          });
          user.id = newUser._id.toString();
          user.role = 'customer';
          user.storeId = undefined;
        } else {
          user.id = existingUser._id.toString();
          user.role = existingUser.role;
          user.storeId = existingUser.storeId?.toString();
          user.image = existingUser.avatar;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as string;
        token.storeId = user.storeId;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.storeId = token.storeId as string | undefined;
        (session.user as any).image = token.image as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
