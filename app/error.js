"use client";

export default function ErrorPage({ reset }) {
  return (
    <div className="auth-main" style={{ minHeight: "100vh" }}>
      <div className="auth-card">
        <h1 className="page-title">Something went wrong</h1>
        <p className="page-sub">The page could not load. Try again, and if it keeps happening, reload the app.</p>
        <button className="btn btn-primary" onClick={reset}>Try again</button>
      </div>
    </div>
  );
}
