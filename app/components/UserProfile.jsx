import { Form } from "@remix-run/react";

export default function UserProfile({ user }) {
  if (!user) return null;

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center">
        <div className="flex-grow">
          <h2 className="text-2xl font-bold">{user.name || 'User'}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>
        <Form method="post" action="/auth/logout">
          <button 
            type="submit" 
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors"
          >
            Logout
          </button>
        </Form>
      </div>
    </div>
  );
}
