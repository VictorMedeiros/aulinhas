import { createCookieSessionStorage } from "@remix-run/node";

// Create a session storage that uses cookies
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__aulinhas_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET || "s3cr3t"], // Use environment variable in production
    secure: process.env.NODE_ENV === "production",
  },
});

// Helper function to create a new session
export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

// Helper to commit session and get the response headers
export async function commitSession(session: any) {
  return sessionStorage.commitSession(session);
}

// Helper to destroy session and get the response headers
export async function destroySession(session: any) {
  return sessionStorage.destroySession(session);
}
