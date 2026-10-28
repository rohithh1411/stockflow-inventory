"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import AuthSide from "@/components/AuthSide";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", confirm: "", orgName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password, orgName: form.orgName }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <AuthSide />
      <div className="auth-main">
        <div className="auth-card">
          <h1 className="page-title">Create your account</h1>
          <p className="page-sub">Set up your store and start tracking stock.</p>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={onSubmit}>
            <label className="field">Organization name
              <input className="input" value={form.orgName} onChange={set("orgName")} required />
            </label>
            <label className="field">Email
              <input className="input" type="email" value={form.email} onChange={set("email")} required />
            </label>
            <label className="field">Password
              <span className="hint">At least 8 characters</span>
              <input className="input" type="password" value={form.password} onChange={set("password")} required />
            </label>
            <label className="field">Confirm password
              <input className="input" type="password" value={form.confirm} onChange={set("confirm")} required />
            </label>
            <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="auth-alt">Already have an account? <Link href="/login">Log in</Link></p>
        </div>
      </div>
    </div>
  );
}
