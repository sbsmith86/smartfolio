import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // If user is authenticated and tries to access auth pages, redirect to dashboard
    if (token && (pathname.startsWith("/auth/signin") || pathname.startsWith("/auth/signup"))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Allow the request to continue
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public paths that don't require authentication
        const publicPaths = ["/", "/auth/signin", "/auth/signup"];

        // If it's a public path, allow access
        if (publicPaths.includes(pathname)) {
          return true;
        }

        // For protected paths, require a valid token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - api/register (registration endpoint)
     * - api/github (GitHub import - public for demo)
     * - api/linkedin (LinkedIn import - public for demo)
     * - api/chat (Chat API - public for profile pages)
     * - api/profile (Profile API - public for profile pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|api/register|api/github|api/linkedin|api/chat|api/profile|_next/static|_next/image|favicon.ico|public).*)",
  ],
};