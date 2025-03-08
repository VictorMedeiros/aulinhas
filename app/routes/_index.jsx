import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div>
      <h1>Welcome to Maaaaaaaaaaaaaaay App</h1>
      <nav>
        <Link to="/students">Students</Link>
        <Link to="/classes">Classes</Link>
        <Link to="/report">Report</Link>
      </nav>
    </div>
  );
}