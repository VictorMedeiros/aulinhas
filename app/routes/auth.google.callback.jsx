import { authenticator } from "~/services/auth.server";

export async function loader({ request }) {
  // Handle the callback from Google OAuth
  return authenticator.authenticate("google", request, {
    successRedirect: "/students",
    failureRedirect: "/",
  });
}
