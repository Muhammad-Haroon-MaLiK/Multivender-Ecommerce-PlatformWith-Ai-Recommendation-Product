import { Link } from "react-router-dom";
import "./VendorCard.css";

const VendorCard = ({ vendor }) => {
  const {
    _id,
    name,
    category,
    productCount = 0,
    rating,
    logo,
    emoji = "🏪",
    isVerified = true,
  } = vendor;

  return (
    <Link to={`/vendors/${_id}`} className="vendor-card">
      <div className="vendor-card__avatar">
        {logo ? (
          <img src={logo} alt={name} />
        ) : (
          <span>{emoji}</span>
        )}
      </div>

      <div className="vendor-card__info">
        <p className="vendor-card__name">{name}</p>
        <p className="vendor-card__meta">
          {category} · {productCount} products
        </p>
        {rating && (
          <p className="vendor-card__rating">★ {rating}</p>
        )}
        {isVerified && (
          <span className="vendor-card__verified">✓ Verified</span>
        )}
      </div>

      <div className="vendor-card__arrow">›</div>
    </Link>
  );
};

export default VendorCard;