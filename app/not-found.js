import Link from "next/link";

export default function NotFound() {
  return (
    <div className="auth-main" style={{ minHeight: "100vh" }}>
      <div className="auth-card">
        <h1 className="page-title">Page not found</h1>
        <p className="page-sub">The page you are looking for does not exist.</p>
        <Link href="/dashboard" className="btn btn-primary">Go to dashboard</Link>
      </div>
    </div>
  );
}
