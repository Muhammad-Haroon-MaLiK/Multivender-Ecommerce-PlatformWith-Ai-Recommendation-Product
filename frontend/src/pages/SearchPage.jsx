import { useState } from "react";
import ProductCard from "../components/ProductCard";
import { PRODUCTS } from "../data/mockData";

export default function SearchPage({ setPage, setSelectedProduct, addToCart }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("All");
  const cats = ["All", ...new Set(PRODUCTS.map(p => p.category))];
  const filtered = PRODUCTS.filter(p =>
    (active === "All" || p.category === active) &&
    (q === "" || p.name.toLowerCase().includes(q.toLowerCase()) || p.vendor.toLowerCase().includes(q.toLowerCase()))
  );
  
  return (
    <div className="page">
      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search products, vendors, categories…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
        </div>
      </div>
      <div className="filters-bar">
        {cats.map(c => (
          <button key={c} className={`filter-chip${active===c?" active":""}`} onClick={() => setActive(c)}>{c}</button>
        ))}
      </div>
      <div className="search-layout">
        <div className="filter-panel">
          <h4>Price Range</h4>
          <input type="range" min={0} max={200} style={{width:"100%", marginBottom:"0.5rem"}} />
          <div style={{display:"flex", justifyContent:"space-between", fontSize:"0.8rem", color:"var(--text2)", marginBottom:"1.25rem"}}>
            <span>$0</span><span>$200</span>
          </div>
          <h4>Ratings</h4>
          {["4.5+","4.0+","3.5+"].map(r => (
            <div key={r} className="filter-option"><input type="radio" name="rating" /><label>★ {r}</label></div>
          ))}
          <h4 style={{marginTop:"1rem"}}>Verified Vendors</h4>
          <div className="filter-option"><input type="checkbox" /><label>Show only verified</label></div>
          <h4 style={{marginTop:"1rem"}}>Shipping</h4>
          <div className="filter-option"><input type="checkbox" /><label>Free shipping</label></div>
        </div>
        <div>
          <p style={{fontSize:"0.8rem", color:"var(--text2)", marginBottom:"1rem"}}>{filtered.length} results{q ? ` for "${q}"` : ""}</p>
          <div className="products-grid">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} setPage={setPage} setSelectedProduct={setSelectedProduct} addToCart={addToCart} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{textAlign:"center", padding:"3rem", color:"var(--text2)"}}>
              <div style={{fontSize:"3rem", marginBottom:"1rem"}}>🔍</div>
              <p>No products found for "<strong>{q}</strong>"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}