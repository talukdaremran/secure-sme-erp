import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section>
      <h1>Page Not Found</h1>
      <Link to="/dashboard">Go to dashboard</Link>
    </section>
  );
}

export default NotFoundPage;