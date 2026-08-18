import ProductCard from "../components/ProductCard";
import { VENDORS, PRODUCTS } from "../data/mockData";

export default function VendorStorePage({ setPage, setSelectedProduct }) {
  const v = VENDORS[0];
  const vendorProducts = PRODUCTS.slice(0,4);
  
  return (
    <div className="page">
      <div className="vendor-banner">
        <div className="vendor-banner-avatar">{v.emoji}</div>
        <div className="vendor-banner-info">
          <h1>{v.name}</h1>
          <p>{v.category} · {v.verified ? "✓ Verified Seller" : "Seller"}</p>
          <div className="vendor-banner-stats">
            <div className="vendor-banner-stat"><strong>{v.products}</strong><span>Products</span></div>
            <div className="vendor-banner-stat"><strong>{v.sales.toLocaleString()}</strong><span>Sales</span></div>
            <div className="vendor-banner-stat"><strong>★ {v.rating}</strong><span>Rating</span></div>
          </div>
        </div>
        <button className="btn-hero-outline" style={{marginLeft:"auto"}}>+ Follow Store</button>
      </div>
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Products by {v.name}</h2>
        </div>
        <div className="products-grid">
          {vendorProducts.map(p => (
            <ProductCard key={p.id} product={p} setPage={setPage} setSelectedProduct={setSelectedProduct} addToCart={() => {}} />
          ))}
        </div>
      </div>
    </div>
  );
}