import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VendorProductForm.css';

const API_URL = 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

const VendorProductForm = ({ onProductAdded, editingProduct, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    discountedPrice: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Toys', 'Automotive', 'Fashion', 'Footwear', 'Kids & Toys'];

  // Populate form when editing
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        price: editingProduct.price || '',
        category: editingProduct.category || '',
        stock: editingProduct.stock || '',
        discountedPrice: editingProduct.discountedPrice || ''
      });
      
      // Handle existing images
      if (editingProduct.images && editingProduct.images.length > 0) {
        const imageUrls = editingProduct.images.map(img => {
          if (typeof img === 'string') {
            if (img.startsWith('http')) return img;
            if (img.startsWith('/')) return `https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api${img}`;
            return `https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/uploads/${img}`;
          }
          return null;
        }).filter(Boolean);
        setExistingImages(imageUrls);
      }
    }
  }, [editingProduct]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      
      // URL construction
      let url;
      let method;
      
      if (editingProduct) {
        // For editing: use PUT with product ID in URL
        url = `${API_URL}/vendor/products/${editingProduct._id}`;
        method = 'put';
        console.log('📝 Editing product:', url);
      } else {
        // For adding: use POST
        url = `${API_URL}/vendor/products`;
        method = 'post';
        console.log('📝 Adding product:', url);
      }

      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('stock', formData.stock);
      if (formData.discountedPrice) {
        formDataToSend.append('discountedPrice', formData.discountedPrice);
      }
      
      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      // If editing, include existing images to keep
      if (editingProduct) {
        existingImages.forEach(img => {
          formDataToSend.append('existingImages', img);
        });
      }

      const response = await axios({
        method,
        url,
        data: formDataToSend,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('📦 Response:', response.data);

      if (response.data.success || response.data.product) {
        const product = response.data.product || response.data;
        setMessage(editingProduct ? '✅ Product updated successfully!' : '✅ Product added successfully!');
        
        if (!editingProduct) {
          setFormData({
            name: '',
            description: '',
            price: '',
            category: '',
            stock: '',
            discountedPrice: ''
          });
          setImages([]);
          setImagePreviews([]);
          setExistingImages([]);
        }
        
        if (onProductAdded) {
          onProductAdded(product);
        }
      } else {
        setMessage('❌ ' + (response.data.message || 'Failed to save product'));
      }
    } catch (error) {
      console.error('❌ Error:', error);
      console.error('❌ Response:', error.response?.data);
      setMessage('❌ Error: ' + (error.response?.data?.message || error.message || 'Failed to save product'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vendor_product_form">
      <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
      
      {message && (
        <div className={`form-message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Name *</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter product name"
          />
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            required
            rows="4"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your product..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Price (Rs) *</label>
            <input
              type="number"
              step="0.01"
              name="price"
              required
              value={formData.price}
              onChange={handleChange}
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Discounted Price (Rs)</label>
            <input
              type="number"
              step="0.01"
              name="discountedPrice"
              value={formData.discountedPrice}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Stock *</label>
            <input
              type="number"
              name="stock"
              required
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Product Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          <small>Upload up to 5 images (JPG, PNG, GIF)</small>
        </div>

        {/* Existing Images (for editing) */}
        {existingImages.length > 0 && (
          <div className="image-previews">
            {existingImages.map((img, index) => (
              <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                <img src={img} alt={`Existing ${index}`} className="preview-image" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="image-previews">
            {imagePreviews.map((preview, index) => (
              <img key={index} src={preview} alt={`Preview ${index}`} className="preview-image" />
            ))}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
          </button>
          {onCancel && (
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default VendorProductForm;