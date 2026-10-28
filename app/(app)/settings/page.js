"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

export default function SettingsPage() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api("/api/settings")
      .then((d) => setValue(String(d.defaultLowStockThreshold)))
      .catch((e) => setError(e.message));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      await api("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ defaultLowStockThreshold: value }),
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Defaults that apply across your organization.</p>
        </div>
      </div>
      <form onSubmit={save} className="panel panel-pad" style={{ maxWidth: 480 }}>
        {error && <div className="alert-error">{error}</div>}
        {saved && <div className="alert-ok">Settings saved</div>}
        <label className="field">Default low stock threshold
          <span className="hint">Used for products that do not have their own threshold.</span>
          <input className="input" type="number" min="0" step="1" value={value} onChange={(e) => { setValue(e.target.value); setSaved(false); }} required />
        </label>
        <button className="btn btn-primary" type="submit">Save changes</button>
      </form>
    </>
  );
}
