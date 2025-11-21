"use client";

import { useDefaultUser } from "@/lib/useDefaultUser";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TestimonialFormData {
  recommenderName: string;
  recommenderTitle: string;
  recommenderCompany: string;
  relationship: string;
  content: string;
}

export default function TestimonialsPage() {
  const { data: session } = useDefaultUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<TestimonialFormData>({
    recommenderName: "",
    recommenderTitle: "",
    recommenderCompany: "",
    relationship: "",
    content: "",
  });

  // Redirect to login if not authenticated
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/testimonials/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add testimonial");
      }

      setSuccess(true);
      // Reset form
      setFormData({
        recommenderName: "",
        recommenderTitle: "",
        recommenderCompany: "",
        relationship: "",
        content: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard")}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Add Testimonial
        </h1>
        <p className="text-gray-600 mt-2">
          Manually add recommendations and testimonials to your profile
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Testimonial</CardTitle>
          <CardDescription>
            Enter details about the person who recommended you and their testimonial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recommender Name */}
            <div className="space-y-2">
              <Label htmlFor="recommenderName" className="required">
                Recommender Name *
              </Label>
              <Input
                id="recommenderName"
                name="recommenderName"
                type="text"
                placeholder="Jane Smith"
                value={formData.recommenderName}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            {/* Recommender Title */}
            <div className="space-y-2">
              <Label htmlFor="recommenderTitle">Job Title</Label>
              <Input
                id="recommenderTitle"
                name="recommenderTitle"
                type="text"
                placeholder="Senior Engineering Manager"
                value={formData.recommenderTitle}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            {/* Recommender Company */}
            <div className="space-y-2">
              <Label htmlFor="recommenderCompany">Company</Label>
              <Input
                id="recommenderCompany"
                name="recommenderCompany"
                type="text"
                placeholder="TechCorp Inc."
                value={formData.recommenderCompany}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            {/* Relationship */}
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Input
                id="relationship"
                name="relationship"
                type="text"
                placeholder="Manager, Colleague, Client, etc."
                value={formData.relationship}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500">
                e.g., "Manager", "Colleague", "Client", "Direct Report"
              </p>
            </div>

            {/* Testimonial Content */}
            <div className="space-y-2">
              <Label htmlFor="content" className="required">
                Testimonial *
              </Label>
              <Textarea
                id="content"
                name="content"
                placeholder="Enter the testimonial or recommendation text..."
                value={formData.content}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                rows={8}
                className="resize-y"
              />
              <p className="text-sm text-gray-500">
                {formData.content.length} characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">❌ {error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm font-medium">
                  ✅ Testimonial added successfully!
                </p>
                <p className="text-green-700 text-sm mt-1">
                  Your testimonial has been saved and will appear on your profile.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !formData.recommenderName || !formData.content}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Adding Testimonial...
                </>
              ) : (
                "Add Testimonial"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Only recommender name and testimonial text are required</li>
          <li>• Adding title, company, and relationship provides better context</li>
          <li>• Testimonials will be searchable via the AI chat assistant</li>
          <li>• You can add multiple testimonials from different people</li>
        </ul>
      </div>
    </div>
  );
}
