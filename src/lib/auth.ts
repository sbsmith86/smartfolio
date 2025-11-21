import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow sign-in for all providers by default
      if (!account || account.provider !== "google") {
        return true;
      }

      try {
        console.log('Google OAuth sign in attempt:', {
          email: user.email,
          userId: user.id,
          profile: profile
        });

        if (!user.email) {
          console.error('No email provided by Google');
          return false;
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        const googleProfile = profile as { given_name?: string; family_name?: string };
        const firstName = googleProfile?.given_name || user.name?.split(' ')[0] || 'User';
        const lastName = googleProfile?.family_name || user.name?.split(' ').slice(1).join(' ') || 'Name';

        if (!existingUser) {
          // Create new user for Google OAuth
          console.log('Creating new user for Google OAuth:', user.email);
          await prisma.user.create({
            data: {
              email: user.email,
              firstName,
              lastName,
              profilePictureUrl: user.image || null,
              googleId: account.providerAccountId,
            },
          });
          console.log('Successfully created new Google user');
        } else if (!existingUser.googleId) {
          // Link Google account to existing user
          console.log('Linking Google account to existing user:', user.email);
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              googleId: account.providerAccountId,
              profilePictureUrl: user.image || existingUser.profilePictureUrl,
            },
          });
          console.log('Successfully linked Google account');
        } else {
          console.log('Existing Google user signing in:', user.email);
        }

        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        // Allow sign-in to proceed even if database operations fail
        // This prevents being locked out if there's a temporary DB issue
        return true;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        try {
          // For credentials provider, user object has the data we need
          const userWithNames = user as { firstName?: string; lastName?: string };
          if (userWithNames.firstName) {
            token.id = user.id;
            token.firstName = userWithNames.firstName;
            token.lastName = userWithNames.lastName;
            token.email = user.email!;
          } else {
            // For Google OAuth, fetch from database
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email! },
            });

            if (dbUser) {
              token.id = dbUser.id;
              token.firstName = dbUser.firstName;
              token.lastName = dbUser.lastName;
              token.email = dbUser.email;
            } else {
              console.error('User not found in database:', user.email);
              // Set basic info from OAuth provider
              token.id = user.id;
              token.email = user.email!;
              token.firstName = user.name?.split(' ')[0] || 'User';
              token.lastName = user.name?.split(' ').slice(1).join(' ') || 'Name';
            }
          }
        } catch (error) {
          console.error('JWT callback error:', error);
          // Fallback to basic user info
          token.id = user.id;
          token.email = user.email!;
          token.firstName = user.name?.split(' ')[0] || 'User';
          token.lastName = user.name?.split(' ').slice(1).join(' ') || 'Name';
        }
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (token && token.id) {
          session.user.id = token.id as string;
          session.user.firstName = (token.firstName as string) || 'User';
          session.user.lastName = (token.lastName as string) || 'Name';
          session.user.email = (token.email as string) || session.user.email;
          session.user.name = `${token.firstName || 'User'} ${token.lastName || 'Name'}`.trim();
        }
      } catch (error) {
        console.error('Session callback error:', error);
      }
      return session;
    },
  },
};