// app/root.tsx
import type { MetaFunction, LinksFunction } from "@remix-run/node";
import {
  Links,
  Link,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import tailwindStylesUrl from "./tailwind.css?url";

export const meta: MetaFunction = () => [
  { charset: "utf-8" },
  { title: "Aulinhas" },
  { viewport: "width=device-width,initial-scale=1" },
];

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: tailwindStylesUrl }];
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-100 text-gray-900">
        <Navbar />
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

function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <a href="/" className="text-xl font-bold">
          Aulinhas
        </a>
        <div>
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
      </div>
    </nav>
  );
}
