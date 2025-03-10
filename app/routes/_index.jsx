import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getUser } from "~/services/auth.server";

export async function loader({ request }) {
  const user = await getUser(request);
  
  // If user is logged in, redirect to students page
  if (user) {
    return redirect("/students");
  }
  
  // Otherwise, render the landing page
  return json({});
}

export default function Index() {
  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to Aulinhas</h1>
        <p className="text-xl mb-8">Your personal teaching management system</p>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-lg mb-6">
            Manage your students, classes, and track your income with Aulinhas.
            Please log in to access your dashboard.
          </p>
          
          <Link 
            to="/auth/google" 
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-600 transition-colors"
          >
            Sign in with Google
          </Link>
        </div>
      </div>
    </div>
  );
}