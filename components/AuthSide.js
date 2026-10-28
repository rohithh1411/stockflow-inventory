export default function AuthSide() {
  return (
    <aside className="auth-side">
      <div className="brand" style={{ padding: 0 }}>
        <span className="brand-mark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="M3 8l9 5 9-5M12 13v8" />
          </svg>
        </span>
        StockFlow
      </div>
      <div>
        <h2>Know what is on your shelf.</h2>
        <p>Track products, stock levels, and low-stock items for your store in one place.</p>
      </div>
      <div className="shelf" aria-hidden="true">
        <div className="shelf-row">In stock<div className="shelf-bar"><i style={{ width: "86%" }} /></div></div>
        <div className="shelf-row">In stock<div className="shelf-bar"><i style={{ width: "62%" }} /></div></div>
        <div className="shelf-row">Running low<div className="shelf-bar"><i className="low" style={{ width: "18%" }} /></div></div>
      </div>
    </aside>
  );
}
