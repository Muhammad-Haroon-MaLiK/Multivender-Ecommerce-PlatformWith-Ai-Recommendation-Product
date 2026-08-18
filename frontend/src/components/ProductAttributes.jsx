import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

const ProductAttributes = ({ category, attributes: initialAttributes, onAttributeChange }) => {
  const [attributes, setAttributes] = useState(initialAttributes || {});
  const [attributeConfigs, setAttributeConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryAttributes();
  }, [category]);

  const fetchCategoryAttributes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/product-attributes/category/${category}`);
      setAttributeConfigs(response.data.attributes || []);
    } catch (error) {
      console.error('Error fetching attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttributeChange = (name, value) => {
    const newAttributes = { ...attributes, [name]: value };
    setAttributes(newAttributes);
    if (onAttributeChange) {
      onAttributeChange(newAttributes);
    }
  };

  if (loading) {
    return <div className="loading-attributes">Loading product options...</div>;
  }

  return (
    <div className="product-attributes">
      {attributeConfigs.map((attr) => (
        <div key={attr.name} className="attribute-group">
          <label className="attribute-label">
            {attr.label} {attr.required && <span className="required">*</span>}
          </label>
          
          {attr.type === 'select' && (
            <select
              className="attribute-select"
              value={attributes[attr.name] || ''}
              onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
              required={attr.required}
            >
              <option value="">Select {attr.label}</option>
              {attr.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          
          {attr.type === 'color' && (
            <div className="color-options">
              {attr.options.map((color) => (
                <button
                  key={color}
                  className={`color-option ${attributes[attr.name] === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleAttributeChange(attr.name, color)}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProductAttributes;