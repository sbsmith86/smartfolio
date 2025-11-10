"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EditModal from "@/components/EditModal";
import CandidateChat from "@/components/CandidateChat";
import TechExplanationPanel from "@/components/TechExplanationPanel";
import StatusBadge from "@/components/StatusBadge";
import Image from "next/image";
import {
  Loader2,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Link as LinkIcon,
  MessageSquare,
  Edit2,
  Calendar,
  ExternalLink,
  BrainCircuit,
  Eye,
  Settings,
} from "lucide-react";

interface ProfileData {
  user: {
    id: string;
    username: string | null;
    firstName: string;
    lastName: string;
    fullName: string;
    location: string | null;
    bio: string | null;
    profilePictureUrl: string | null;
  };
  experiences: Array<{
    id: string;
    company: string;
    position: string;
    description?: string;
    startDate: string;
    endDate?: string | null;
    location?: string;
    achievements?: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate: string;
    endDate?: string | null;
    gpa?: number | null;
    description?: string;
  }>;
  skills: Array<{
    id: string;
    name: string;
    category: string;
    proficiency?: string | null;
  }>;
  skillsByCategory: Record<string, Array<{
    id: string;
    name: string;
    category: string;
    proficiency?: string | null;
  }>>;
  documents: Array<{
    id: string;
    fileName: string;
    documentType: string;
    createdAt: string;
  }>;
  testimonials: Array<{
    id: string;
    recommenderName: string;
    recommenderTitle?: string;
    recommenderCompany?: string;
    relationship?: string;
    content: string;
    createdAt: string;
  }>;
  links: Array<{
    id: string;
    linkType: string;
    url: string;
    title?: string;
  }>;
  stats: {
    experienceYears: number;
    totalSkills: number;
    testimonialsCount: number;
    projectsCount: number;
  };
  meta: {
    experienceCalculation: string;
    oldestExperienceDate: string | null;
  };
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    type: "experience" | "education" | "skill";
    id: string;
    data: ProfileData["experiences"][0] | ProfileData["education"][0] | ProfileData["skills"][0];
  } | null>(null);

  useEffect(() => {
    params.then(({ username }) => setUsername(username));
  }, [params]);

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    try {
      const response = await fetch(`/api/profile/${username}`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setProfile(data);
      setIsOwnProfile(session?.user?.id === data.user.id);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [username, session]);

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username, fetchProfile]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-gray-600 mb-6">This profile doesn&apos;t exist or is private.</p>
        <Button onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );
  }

  const { user, experiences, education, skills, skillsByCategory, testimonials, links, stats } = profile;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* SmartFolio Header - Only shown when viewing own profile */}
      {isOwnProfile && (
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
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-800 font-semibold text-xl">Public Profile Preview</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={() => router.push("/dashboard")} className="border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium px-6 py-2">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard/settings")} className="border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium px-6 py-2">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Profile Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              {user.profilePictureUrl ? (
                <Image
                  src={user.profilePictureUrl}
                  alt={user.fullName}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{user.fullName}</h1>
                {user.location && (
                  <p className="text-gray-600 flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </p>
                )}
                {user.bio && <p className="text-gray-700 max-w-2xl">{user.bio}</p>}

                {/* Stats */}
                <div className="flex gap-6">
                  <div className="text-center" title="Based on listed positions">
                    <div className="text-2xl font-bold text-blue-600">{stats.experienceYears}</div>
                    <div className="text-xs text-gray-600">Years Exp</div>
                    <div className="text-xs text-gray-500 mt-1">
                      (Listed roles)
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalSkills}</div>
                    <div className="text-xs text-gray-600">Skills</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.testimonialsCount}</div>
                    <div className="text-xs text-gray-600">Testimonials</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* External Links */}
          {links.length > 0 && (
            <div className="flex gap-3 mt-6">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                  <LinkIcon className="h-4 w-4" />
                  {link.title || link.linkType}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Professional Experience (from Resume) */}
            <section id="experience-section">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Professional Experience
                  <Badge variant="outline" className="ml-2 text-xs">
                    📄 From Resume
                  </Badge>
                  <StatusBadge status="active" />
                </h2>
              </div>

              {experiences.filter(exp => exp.company !== 'GitHub').length === 0 ? (
                <p className="text-gray-500">No professional experience added yet</p>
              ) : (
                <div className="space-y-6">
                  {experiences
                    .filter(exp => exp.company !== 'GitHub')
                    .map((exp) => (
                    <Card key={exp.id} id={exp.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-xl">{exp.position}</h3>
                            <p className="text-lg text-gray-700">{exp.company}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : "Present"}
                              {exp.location && ` • ${exp.location}`}
                            </div>
                            {exp.description && (
                              <p className="mt-3 text-gray-700">{exp.description}</p>
                            )}
                            {exp.achievements && exp.achievements.length > 0 && (
                              <ul className="mt-3 space-y-1">
                                {exp.achievements.map((achievement, idx) => (
                                  <li key={idx} className="text-gray-700 flex items-start gap-2">
                                    <span className="text-blue-600 mt-1">•</span>
                                    <span>{achievement}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          {isOwnProfile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem({ type: "experience", id: exp.id, data: exp })}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* GitHub Projects */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BrainCircuit className="h-6 w-6 text-purple-600" />
                  Open Source Projects
                  <Badge variant="outline" className="ml-2 text-xs bg-purple-50">
                    💻 From GitHub
                  </Badge>
                  <StatusBadge status="demo" />
                </h2>
              </div>

              {experiences.filter(exp => exp.company === 'GitHub').length === 0 ? (
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-6">
                    <p className="text-gray-600">No GitHub projects imported yet</p>
                    {isOwnProfile && (
                      <p className="text-sm text-gray-500 mt-2">
                        Visit your dashboard to import projects from your GitHub profile
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {experiences
                    .filter(exp => exp.company === 'GitHub')
                    .map((project) => (
                    <Card key={project.id} id={project.id} className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{project.position}</h3>
                              <Badge variant="secondary" className="text-xs">
                                💻 GitHub
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                              <Calendar className="h-4 w-4" />
                              {formatDate(project.startDate)}
                              {project.endDate && ` - ${formatDate(project.endDate)}`}
                            </div>
                            {project.description && (
                              <p className="mt-2 text-sm text-gray-700 line-clamp-4">{project.description}</p>
                            )}
                            {/* Extract GitHub URL from description if present */}
                            <a
                              href={`https://github.com/sbsmith86/${project.position}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-3 text-sm text-purple-600 hover:text-purple-800"
                            >
                              View on GitHub
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Education */}
            <section id="education-section">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                  Education
                  <StatusBadge status="active" />
                </h2>
              </div>

              {education.length === 0 ? (
                <p className="text-gray-500">No education added yet</p>
              ) : (
                <div className="space-y-6">
                  {education.map((edu) => (
                    <Card key={edu.id} id={edu.id} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-xl">{edu.degree}</h3>
                            <p className="text-lg text-gray-700">{edu.institution}</p>
                            {edu.fieldOfStudy && (
                              <p className="text-gray-600">{edu.fieldOfStudy}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : "Present"}
                              {edu.gpa && ` • GPA: ${edu.gpa}`}
                            </div>
                            {edu.description && (
                              <p className="mt-3 text-gray-700">{edu.description}</p>
                            )}
                          </div>
                          {isOwnProfile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem({ type: "education", id: edu.id, data: edu })}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Testimonials */}
            {testimonials.length > 0 && (
              <section id="testimonials-section">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                    Testimonials
                    <StatusBadge status="demo" />
                  </h2>
                </div>

                <div className="space-y-6">
                  {testimonials.map((testimonial) => (
                    <Card key={testimonial.id} id={testimonial.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-6">
                        <p className="text-gray-700 italic mb-4">&ldquo;{testimonial.content}&rdquo;</p>
                        <div>
                          <p className="font-semibold">{testimonial.recommenderName}</p>
                          {testimonial.recommenderTitle && (
                            <p className="text-sm text-gray-600">
                              {testimonial.recommenderTitle}
                              {testimonial.recommenderCompany && ` at ${testimonial.recommenderCompany}`}
                            </p>
                          )}
                          {testimonial.relationship && (
                            <p className="text-xs text-gray-500 mt-1">
                              Relationship: {testimonial.relationship}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Chat Component */}
            <div className="h-[600px]">
              <CandidateChat
                userId={user.id}
                candidateName={user.fullName}
              />
            </div>

            {/* Technology Explanation Panel */}
            <TechExplanationPanel />

            {/* Skills */}
            <Card id="skills-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Skills
                  <StatusBadge status="active" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skills.length === 0 ? (
                  <p className="text-gray-500 text-sm">No skills added yet</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                      <div key={category}>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2 capitalize">
                          {category}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {categorySkills.map((skill) => (
                            <div key={skill.id} id={skill.id} className="relative group">
                              <Badge variant="secondary" className="cursor-pointer">
                                {skill.name}
                              </Badge>
                              {isOwnProfile && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                  onClick={() => setEditingItem({ type: "skill", id: skill.id, data: skill })}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            {isOwnProfile && profile.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {profile.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate">{doc.fileName}</span>
                        <Badge variant="outline" className="text-xs">
                          {doc.documentType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditModal
          type={editingItem.type}
          item={editingItem.data}
          onClose={() => setEditingItem(null)}
          onSave={fetchProfile}
        />
      )}
    </div>
  );
}
