"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, FileText, Link, MessageSquare, LogOut, BrainCircuit, Database, Sparkles, Github, Linkedin, Users, Eye } from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Helper to get profile URL - uses ID as fallback if username not set
  const getProfileUrl = () => {
    return `/profile/${session?.user?.id || 'me'}`;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BrainCircuit className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">SmartFolio</h1>
                  <p className="text-sm text-gray-700 font-medium">Powered by Agentic Postgres</p>
                </div>
              </div>
              <span className="text-gray-400 text-2xl font-medium">•</span>
              <span className="text-gray-800 font-semibold text-xl">Your Professional Story</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">{session.user?.name}</span>
              </div>
              <Button variant="outline" onClick={handleSignOut} className="border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium px-6 py-2">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-yellow-100 via-amber-50 to-orange-100 rounded-2xl shadow-xl border border-amber-200 p-8">
            <div className="flex items-center mb-6">
              <Sparkles className="h-8 w-8 text-yellow-500 mr-4" />
              <h2 className="text-3xl font-bold text-gray-800">
                Welcome to your professional story, {session.user?.name?.split(" ")[0]}!
              </h2>
            </div>
            <p className="text-gray-700 text-lg font-medium mb-6 leading-relaxed">
              Consolidate all your career data into one intelligent, conversational profile. Let visitors explore your experience naturally instead of scanning static documents.
            </p>
            <div className="flex items-center text-lg text-gray-800 bg-white rounded-xl px-6 py-4 inline-flex border border-gray-200 shadow-sm">
              <Database className="h-6 w-6 mr-3" />
              <span className="font-semibold">Powered by Agentic Postgres for intelligent connections</span>
            </div>
          </div>

          {/* Data Sources - Quick Actions */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-800">Consolidate Your Career Data</h3>
              <Button
                onClick={() => router.push(getProfileUrl())}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold"
              >
                <Eye className="h-4 w-4 mr-2" />
                View My Profile
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card
                className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-gray-200 bg-white"
                onClick={() => router.push('/dashboard/documents')}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <FileText className="h-7 w-7 text-orange-600" />
                    <span className="font-semibold text-gray-800">Resumes & CVs</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 font-medium text-sm mb-4">
                    Upload your resume and portfolio documents for AI processing.
                  </p>
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/dashboard/documents');
                    }}
                  >
                    Upload Documents
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-gray-200 bg-white"
                onClick={() => router.push('/dashboard/testimonials')}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <Users className="h-7 w-7 text-green-600" />
                    <span className="font-semibold text-gray-800">Testimonials</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 font-medium text-sm mb-4">
                    Add recommendations and testimonials from colleagues.
                  </p>
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/dashboard/testimonials');
                    }}
                  >
                    Add Testimonial
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-gray-200 bg-white"
                onClick={() => router.push('/dashboard/import/github')}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <Github className="h-7 w-7 text-gray-800" />
                    <span className="font-semibold text-gray-800">GitHub & Projects</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 font-medium text-sm mb-4">
                    Connect your GitHub repos and project documentation.
                  </p>
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-gray-800 to-gray-600 hover:from-gray-900 hover:to-gray-700 text-white font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/dashboard/import/github');
                    }}
                  >
                    Import GitHub
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-gray-200 bg-white"
                onClick={() => router.push('/dashboard/import/linkedin')}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <Linkedin className="h-7 w-7 text-blue-600" />
                    <span className="font-semibold text-gray-800">LinkedIn Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 font-medium text-sm mb-4">
                    Import your LinkedIn experience and connections.
                  </p>
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/dashboard/import/linkedin');
                    }}
                  >
                    Import LinkedIn
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Conversational Profile Preview */}
          <Card className="border border-gray-200 bg-white shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <MessageSquare className="h-8 w-8 text-amber-600" />
                <span className="font-bold text-gray-800">Your Conversational Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-100 border border-amber-200 rounded-2xl p-12 mb-8 shadow-lg">
                  <BrainCircuit className="h-16 w-16 text-amber-600 mx-auto mb-6" />
                  <p className="text-gray-800 mb-4 font-bold text-xl">Your conversational profile is ready to be built!</p>
                  <p className="text-gray-700 text-lg mb-8 font-medium leading-relaxed">
                    Once you add your data, visitors can explore your experience through natural conversation instead of scanning static profiles.
                  </p>
                  <div className="bg-white rounded-xl p-6 text-left max-w-lg mx-auto border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-600 mb-2 font-medium">Example visitor question:</p>
                    <p className="text-gray-800 font-semibold text-lg">&ldquo;What experience does {session.user?.name?.split(" ")[0]} have with React?&rdquo;</p>
                  </div>
                </div>
                <Button
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xl px-10 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  onClick={() => router.push('/dashboard/documents')}
                >
                  <Sparkles className="mr-3 h-6 w-6" />
                  Start Building Your Story
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sharing & Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border border-gray-200 bg-white shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-gray-800 text-xl">
                  <Link className="h-7 w-7 text-yellow-600" />
                  <span className="font-bold">Share Your Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 font-medium text-sm mb-6">
                  Get a custom URL to share your conversational profile instead of multiple scattered links.
                </p>
                <div className="bg-yellow-100 rounded-xl p-4 text-lg text-gray-800 font-semibold mb-6 border border-yellow-300">
                  smartfolio.com/{session.user?.email?.split("@")[0]}
                </div>
                <Button variant="outline" className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium">
                  Customize Your URL
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-gray-800 text-xl">
                  <Database className="h-7 w-7 text-orange-600" />
                  <span className="font-bold">Smart Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 font-medium text-sm mb-6">
                  See how visitors explore your experience and what they&apos;re most interested in.
                </p>
                <div className="text-center py-6">
                  <p className="text-gray-600 font-medium">Analytics available after profile activation</p>
                </div>
                <Button variant="outline" className="w-full border border-gray-400 text-gray-600 font-medium" disabled>
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}