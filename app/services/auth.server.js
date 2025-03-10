import { Authenticator } from "remix-auth";
import { GoogleStrategy } from "remix-auth-google";
import { sessionStorage } from "./session.server";
import { prisma } from "~/util/db.server";

// Create an authenticator instance with session expiration
export const authenticator = new Authenticator(sessionStorage, {
  sessionKey: "googleUser", // Specify a session key for better isolation
  sessionErrorKey: "googleError", // Key for storing errors
});

// Configure Google strategy with proper scopes
const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback",
    // Add proper scopes to ensure we can get user info
    scope: ["email", "profile", "openid"],
    // Only prompt when needed, not every time
    prompt: "select_account", // Changed from "consent" to "select_account"
    // Include access_type to get refresh token
    accessType: "offline",
  },
  async ({ accessToken, refreshToken, profile }) => {
    // Find or create the user in the database
    const email = profile.emails[0].value;
    
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create a new user if one doesn't exist
      user = await prisma.user.create({
        data: {
          email,
          name: profile.displayName || profile.name?.givenName,
          googleId: profile.id,
        },
      });
    } else if (!user.googleId) {
      // If user exists but doesn't have a googleId, update it
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.id },
      });
    }

    return user;
  }
);

// Register the strategy with the authenticator
authenticator.use(googleStrategy);

// Helper function to get the authenticated user from the request
export async function getUser(request) {
  try {
    return await authenticator.isAuthenticated(request);
  } catch {
    return null;
  }
}

// Middleware to require authentication for a route
export async function requireAuth(request) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/auth/google",
  });
  return user;
}
