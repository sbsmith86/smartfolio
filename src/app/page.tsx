"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, FileText, User, Zap, Shield } from "lucide-react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <FileText className="h-8 w-8 text-green-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-purple-500 bg-clip-text text-transparent">
                SmartFolio
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-gray-300 hover:text-green-400 hover:bg-gray-800/50">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-black font-semibold shadow-lg shadow-green-400/25">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-12">
          <div className="space-y-6">
            <div className="relative">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight">
                The Intelligence-First
                <span className="block bg-gradient-to-r from-green-400 via-purple-500 to-orange-400 bg-clip-text text-transparent animate-pulse">
                  Professional Platform
                </span>
              </h1>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-green-400 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
            </div>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Transform your career documents into intelligent, conversational experiences.
              Employers skip the endless scrolling and simply ask:
              <span className="text-green-400 font-semibold">&ldquo;Who has the skills I need?&rdquo;</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-10 py-4 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-black font-bold shadow-2xl shadow-green-400/25 transform hover:scale-105 transition-all duration-200">
                Make Your Experience Discoverable
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="text-lg px-10 py-4 border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 font-semibold transform hover:scale-105 transition-all duration-200">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-300 group">
            <CardHeader>
              <div className="mx-auto bg-gradient-to-br from-green-400/20 to-green-600/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-8 w-8 text-green-400" />
              </div>
              <CardTitle className="text-white text-xl font-bold">Conversational Discovery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                Employers can ask natural questions about your experience. AI understands intent beyond keywords—finding culture fits, not just skill matches.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-300 group">
            <CardHeader>
              <div className="mx-auto bg-gradient-to-br from-purple-400/20 to-purple-600/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <User className="h-8 w-8 text-purple-400" />
              </div>
              <CardTitle className="text-white text-xl font-bold">Intelligent Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                Upload your resume, portfolio, and documents. AI creates a comprehensive, queryable knowledge base about your professional background.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-300 group">
            <CardHeader>
              <div className="mx-auto bg-gradient-to-br from-orange-400/20 to-orange-600/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-orange-400" />
              </div>
              <CardTitle className="text-white text-xl font-bold">Privacy Control</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                Choose what&apos;s public, what requires permission, and what stays private. All claims are linked to source documents and references.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-white mb-6">How It Works</h2>
            <p className="text-xl text-gray-300">Get discovered by the right employers in three steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="bg-gradient-to-r from-green-400 to-green-500 text-black w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-black shadow-lg shadow-green-400/25 group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Upload Everything</h3>
              <p className="text-gray-300 leading-relaxed">
                Resume, portfolio, LinkedIn data, GitHub repos, recommendations, and certifications.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-r from-purple-400 to-purple-500 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-black shadow-lg shadow-purple-400/25 group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Creates Your Living Profile</h3>
              <p className="text-gray-300 leading-relaxed">
                AI parses, structures, and enriches your professional data into a queryable knowledge base.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-black w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-black shadow-lg shadow-orange-400/25 group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Get Discovered</h3>
              <p className="text-gray-300 leading-relaxed">
                Employers find you through natural language search and explore your experience conversationally.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-purple-500/10 rounded-3xl blur-xl"></div>
          <div className="relative bg-gradient-to-r from-gray-900 to-black border border-gray-700 rounded-3xl p-16 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-r from-green-400 to-purple-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Ready to Be <span className="bg-gradient-to-r from-green-400 to-purple-500 bg-clip-text text-transparent">Discovered?</span>
              </h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join professionals who are getting found by the right employers through intelligent discovery.
              </p>
              <Link href="/auth/signup">
                <Button size="lg" className="text-xl px-12 py-6 bg-gradient-to-r from-green-400 to-purple-500 hover:from-green-500 hover:to-purple-600 text-black font-black shadow-2xl shadow-green-400/25 transform hover:scale-105 transition-all duration-300">
                  Make Your Experience Speak for Itself
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="relative">
                <FileText className="h-8 w-8 text-green-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-purple-500 bg-clip-text text-transparent">
                SmartFolio
              </span>
            </div>
            <p className="text-gray-500">
              © 2025 SmartFolio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
