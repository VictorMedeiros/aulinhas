// app/root.jsx
import { Links, Link, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, Form, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import tailwindStylesUrl from "./tailwind.css?url";
import { getUser } from "./services/auth.server";
import { useState } from "react";
import Sidebar from "./components/Sidebar";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en" className="h-full bg-gray-100">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        {user ? (
          <div className="min-h-full flex">
            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col">
              {/* Mobile header with menu button */}
              <div className="md:hidden bg-white shadow p-4">
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              <main className="flex-1 overflow-auto">
                <Outlet />
              </main>
            </div>
          </div>
        ) : (
          <main>
            <Outlet />
          </main>
        )}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
