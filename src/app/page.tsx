"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Github, Linkedin, MessageSquare, Zap, Database,
  ArrowRight, CheckCircle, Sparkles, BrainCircuit, Users
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [currentExample, setCurrentExample] = useState(0);

  const conversationExamples = [
    "Tell me about Sarah's experience with distributed systems",
    "What machine learning projects has John worked on?",
    "How did Maria lead her team through the product redesign?",
    "What frameworks does Alex prefer for backend development?"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % conversationExamples.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationExamples.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-amber-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BrainCircuit className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  SmartFolio
                </h1>
                <p className="text-xs text-gray-600">Powered by Agentic Postgres</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 font-semibold">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-8 bg-yellow-100 text-amber-800 border-yellow-200 shadow-sm">
            <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
            Your Complete Professional Story, Conversationally
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-8 leading-tight tracking-tight">
            Stop Scattering Your
            <span className="block bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
              Career Story
            </span>
          </h1>

          <div className="max-w-4xl mx-auto mb-12">
            <p className="text-xl text-gray-700 mb-8 leading-relaxed font-medium">
              Upload your resume, connect GitHub & LinkedIn, add project docs and testimonials.
            </p>
            <p className="text-2xl text-gray-700 font-semibold leading-relaxed">
              SmartFolio creates one intelligent profile where people can explore your professional
              journey through natural conversation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-10 py-4 text-lg font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200">
                <FileText className="mr-3 h-5 w-5" />
                Create Your SmartFolio
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border border-gray-600 text-gray-700 hover:bg-gray-50 hover:border-gray-700 px-10 py-4 text-lg font-semibold transition-all duration-200">
              <MessageSquare className="mr-3 h-5 w-5" />
              See Example Conversation
            </Button>
          </div>

          {/* Live Conversation Example */}
          <Card className="max-w-3xl mx-auto border border-gray-200 bg-white shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-800 flex items-center justify-center font-semibold">
                <MessageSquare className="h-5 w-5 mr-3 text-amber-500" />
                Instead of scanning static profiles, visitors ask:
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-6 border border-amber-200 min-h-[80px] flex items-center justify-center">
                <p className="text-gray-800 font-medium text-xl transition-all duration-500 text-center">
                  &ldquo;{conversationExamples[currentExample]}&rdquo;
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Sources Section */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Unify All Your Professional Data
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
              SmartFolio intelligently connects information from all your sources into one conversational experience
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { icon: FileText, label: "Resumes & CVs", color: "bg-orange-100 text-orange-700 border-orange-200" },
              { icon: Github, label: "GitHub Repos", color: "bg-gray-100 text-gray-800 border-gray-300" },
              { icon: Linkedin, label: "LinkedIn Profile", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
              { icon: Users, label: "Testimonials", color: "bg-amber-100 text-amber-700 border-amber-200" }
            ].map((source, index) => (
              <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 hover:border-amber-300">
                <CardContent className="pt-8 pb-6">
                  <div className={`w-16 h-16 ${source.color} rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-sm`}>
                    <source.icon className="h-8 w-8" />
                  </div>
                  <p className="font-semibold text-gray-800 text-lg">{source.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Agentic Postgres Highlight */}
          <Card className="bg-gradient-to-r from-yellow-100 via-amber-50 to-orange-100 border border-amber-200 shadow-xl">
            <CardContent className="p-12">
              <div className="flex items-center justify-center mb-8">
                <Database className="h-8 w-8 text-gray-700 mr-4" />
                <h3 className="text-3xl font-bold text-gray-800">Powered by Agentic Postgres</h3>
                <Zap className="h-6 w-6 text-yellow-500 ml-4" />
              </div>
              <p className="text-center text-gray-700 text-xl mb-10 max-w-4xl mx-auto font-medium leading-relaxed">
                Tiger MCP enables direct AI-to-database communication, creating intelligent connections
                between your projects, skills, and experiences for contextually perfect responses.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-white rounded-2xl p-6 mb-4 border border-gray-200 shadow-md">
                    <BrainCircuit className="h-12 w-12 text-amber-600 mx-auto" />
                  </div>
                  <p className="font-semibold text-gray-800 text-lg">Smart Connections</p>
                  <p className="text-gray-600 font-medium">AI understands relationships in your data</p>
                </div>
                <div className="text-center">
                  <div className="bg-white rounded-2xl p-6 mb-4 border border-gray-200 shadow-md">
                    <Zap className="h-12 w-12 text-yellow-500 mx-auto" />
                  </div>
                  <p className="font-semibold text-gray-800 text-lg">Instant Responses</p>
                  <p className="text-gray-600 font-medium">Sub-second query processing</p>
                </div>
                <div className="text-center">
                  <div className="bg-white rounded-2xl p-6 mb-4 border border-gray-200 shadow-md">
                    <Sparkles className="h-12 w-12 text-orange-500 mx-auto" />
                  </div>
                  <p className="font-semibold text-gray-800 text-lg">Contextual Intelligence</p>
                  <p className="text-gray-600 font-medium">Responses adapt to visitor interest</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-gray-800 mb-8 leading-tight">
                Your Professional Story,
                <span className="block bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Intelligently Connected
                </span>
              </h2>
              <div className="space-y-6">
                {[
                  "Stop updating profiles across multiple platforms",
                  "Let visitors explore your experience conversationally",
                  "AI connects your projects, skills, and achievements",
                  "Share one link instead of scattered information",
                  "Get insights on how people discover your expertise"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <CheckCircle className="h-6 w-6 text-yellow-500 mt-1 flex-shrink-0" />
                    <p className="text-gray-700 font-medium text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-white border border-gray-200 shadow-xl">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-700 font-medium">Visitor exploring your profile</span>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border border-amber-200">
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-2xl rounded-br-sm max-w-xs font-medium">
                          What experience does Sarah have with React?
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-white px-6 py-3 rounded-2xl rounded-bl-sm max-w-sm border border-gray-200 shadow-sm">
                          <p className="text-gray-700 font-medium">
                            Sarah has extensive React experience! She built the frontend for EcoTrack
                            (2023) using React 18 with TypeScript, led the migration of LegalFlow&apos;s
                            interface from Vue to React (2022), and contributed to several open-source
                            React components. Would you like details about any specific project?
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-700 font-medium flex items-center justify-center">
                      <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
                      Powered by intelligent data connections
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 py-24">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-bold text-white mb-8 leading-tight">
            Ready to Create Your
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Conversational Profile?
            </span>
          </h2>
          <p className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            Join professionals who are making their career stories more discoverable and engaging
            through intelligent conversation.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-gray-900 px-12 py-6 text-xl font-semibold shadow-xl shadow-yellow-400/25 hover:shadow-yellow-400/40 transform hover:scale-105 transition-all duration-300">
              <FileText className="mr-3 h-7 w-7" />
              Start Building Your SmartFolio
              <ArrowRight className="ml-3 h-7 w-7" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-6 md:mb-0">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BrainCircuit className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="font-bold text-2xl text-gray-800">SmartFolio</p>
                <p className="text-sm text-gray-600 font-medium">Powered by Agentic Postgres</p>
              </div>
            </div>
            <p className="text-gray-700 font-medium text-lg">
              © 2025 SmartFolio. Your professional story, intelligently connected.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
