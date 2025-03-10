import { redirect } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export async function loader({ request }) {
  // Start the Google OAuth flow
  // Using 'select_account' to let users choose an account but not require consent every time
  const url = new URL(request.url);
  
  // Don't set any prompt parameter by default to use the strategy's default
  // Let it prompt only when needed for new permissions
  
  // Create a new request with the updated URL
  const newRequest = new Request(url.toString(), {
    headers: request.headers,
    method: request.method,
  });
  
  return authenticator.authenticate("google", newRequest, {
    successRedirect: "/students",
    failureRedirect: "/",
  });
}

export function action() {
  return redirect("/auth/google");
}
