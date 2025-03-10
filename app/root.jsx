// app/root.jsx
import { Links, Link, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, Form, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import tailwindStylesUrl from "./tailwind.css?url";
import { getUser } from "./services/auth.server";

export const meta = () => [
  { charset: "utf-8" },
  { title: "Aulinhas" },
  { viewport: "width=device-width,initial-scale=1" },
];

export const links = () => {
  return [{ rel: "stylesheet", href: tailwindStylesUrl }];
};

export const loader = async ({ request }) => {
  const user = await getUser(request);
  return json({ user });
};

export default function App() {
  const { user } = useLoaderData();

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-100 text-gray-900">
        <Navbar user={user} />
        <main className="container mx-auto p-4">
          <Outlet />
        </main>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

function Navbar({ user }) {
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <a href="/" className="text-xl font-bold">
          Aulinhas
        </a>
        <div className="flex items-center">
          {user ? (
            <>
              <div className="flex items-center mr-4">
                <Link to="/students" className="px-3 hover:underline">
                  Students
                </Link>
                <Link to="/classes" className="px-3 hover:underline">
                  Classes
                </Link>
                <Link to="/report" className="px-3 hover:underline">
                  Report
                </Link>
              </div>
              <div className="flex items-center">
                <span className="mr-2 text-sm">{user.email}</span>
                <Form method="post" action="/auth/logout">
                  <button 
                    type="submit" 
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                    title="Sign out completely from Google and Aulinhas"
                  >
                    Sign Out
                  </button>
                </Form>
              </div>
            </>
          ) : (
            <Link to="/auth/google" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
              Sign in with Google
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
