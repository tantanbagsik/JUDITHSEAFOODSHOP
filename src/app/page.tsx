'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Store, Zap, Shield, BarChart3, ArrowRight } from 'lucide-react';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  const features = [
    {
      icon: Store,
      title: 'One-Click Store Creation',
      description: 'Launch your online store in seconds with our instant setup process.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built on Next.js for optimal performance and SEO.',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with automated backups.',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track sales, customers, and growth in real-time.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Judith Foods</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="/shop" className="text-gray-600 hover:text-gray-900">Shop</Link>
              {session ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign In</Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Build Your Online Store
                <span className="text-blue-600"> in Seconds</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                The fastest way to create and manage your ecommerce business. 
                No coding required - just start selling.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {session ? (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                ) : (
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                )}
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Everything You Need</h2>
              <p className="mt-4 text-xl text-gray-600">
                Powerful features to grow your business
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="p-6 bg-white border rounded-lg hover:shadow-lg transition-shadow">
                  <feature.icon className="h-10 w-10 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Ready to Get Started?</h2>
              <p className="mt-4 text-xl text-gray-600 mb-8">
                Join thousands of merchants selling online
              </p>
              {!session && (
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Create Your Store Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Store className="h-6 w-6" />
              <span className="ml-2 text-lg font-bold">Judith Foods</span>
            </div>
            <p className="text-gray-400">© 2026 Judith Foods. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
