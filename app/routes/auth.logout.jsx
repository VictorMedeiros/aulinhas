import { redirect } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export async function action({ request }) {
  // Log the user out from our application
  return authenticator.logout(request, { redirectTo: "/" });
}

export async function loader() {
  return redirect("/");
}
