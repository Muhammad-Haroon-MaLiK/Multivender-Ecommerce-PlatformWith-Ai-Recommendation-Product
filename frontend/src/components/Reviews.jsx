import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Reviews.css";

const API_URL = 'http://https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

const Reviews = ({ productId, user }) => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ratingDistribution, setRatingDistribution] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [sortBy, setSortBy] = useState('recent');
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: ''
  });

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId, sortBy, pagination.page]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/reviews/${productId}?page=${pagination.page}&limit=5&sort=${sortBy}`
      );
      
      if (response.data.success) {
        setReviews(response.data.reviews);
        setRatingDistribution(response.data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!formData.comment.trim()) {
      showMessage('error', 'Please write a review comment');
      return;
    }

    setSubmitting(true);

    try {
      const token = getToken();
      const url = editingReview 
        ? `${API_URL}/reviews/${editingReview._id}`
        : `${API_URL}/reviews`;
      
      const method = editingReview ? 'put' : 'post';
      
      const response = await axios[method](
        url,
        {
          productId,
          rating: formData.rating,
          title: formData.title,
          comment: formData.comment
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        showMessage('success', response.data.message);
        setShowForm(false);
        setEditingReview(null);
        setFormData({ rating: 5, title: '', comment: '' });
        fetchReviews();
      }
    } catch (error) {
      console.error('Review error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setFormData({
      rating: review.rating,
      title: review.title || '',
      comment: review.comment
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      const token = getToken();
      const response = await axios.delete(`${API_URL}/reviews/${reviewId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        showMessage('success', 'Review deleted successfully');
        fetchReviews();
      }
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('error', 'Failed to delete review');
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/reviews/${reviewId}/helpful`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setReviews(reviews.map(r => 
          r._id === reviewId 
            ? { ...r, helpful: response.data.helpful }
            : r
        ));
      }
    } catch (error) {
      console.error('Helpful error:', error);
    }
  };

  const renderStars = (rating, interactive = false) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        className={`star-btn ${star <= rating ? 'active' : ''}`}
        onClick={() => interactive && setFormData({ ...formData, rating: star })}
        disabled={!interactive}
        type="button"
      >
        ★
      </button>
    ));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="reviews-loading">
        <div className="spinner"></div>
        <p>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <h2>Customer Reviews</h2>
        <div className="reviews-summary">
          <div className="average-rating">
            <span className="rating-number">
              {reviews.length > 0 
                ? (Object.values(ratingDistribution).reduce((sum, count, idx) => sum + (idx + 1) * count, 0) / 
                   Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0)).toFixed(1)
                : '0'
              }
            </span>
            <div className="stars">
              {renderStars(Math.round(
                Object.values(ratingDistribution).reduce((sum, count, idx) => sum + (idx + 1) * count, 0) /
                Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0) || 0
              ))}
            </div>
            <span className="review-count">{reviews.length} reviews</span>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Rating Distribution */}
      <div className="rating-distribution">
        {[5, 4, 3, 2, 1].map(star => {
          const total = Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0);
          const count = ratingDistribution[star] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={star} className="distribution-row">
              <span className="star-label">{star} ★</span>
              <div className="distribution-bar">
                <div 
                  className="distribution-fill" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="distribution-count">{count}</span>
            </div>
          );
        })}
      </div>

      /* Write Review Button */
      {user && (
        <div className="write-review-section">
          <button 
            className="write-review-btn"
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setEditingReview(null);
                setFormData({ rating: 5, title: '', comment: '' });
              }
            }}
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        </div>
      )}

      /* Review Form */
      {showForm && (
        <form className="review-form" onSubmit={handleSubmitReview}>
          <h3>{editingReview ? 'Edit Review' : 'Write Your Review'}</h3>
          
          <div className="form-group">
            <label>Rating</label>
            <div className="star-rating">
              {renderStars(formData.rating, true)}
              <span className="rating-label">
                {formData.rating === 5 ? 'Excellent' :
                 formData.rating === 4 ? 'Good' :
                 formData.rating === 3 ? 'Average' :
                 formData.rating === 2 ? 'Poor' : 'Terrible'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Title (Optional)</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Summarize your experience"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Review</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Share your experience with this product..."
              className="form-textarea"
              rows="4"
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-review-btn"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
          </button>
        </form>
      )}

      /* Sort Options */
      <div className="reviews-toolbar">
        <span className="toolbar-label">Sort by:</span>
        <div className="sort-options">
          {['recent', 'rating_high', 'rating_low', 'helpful'].map(option => (
            <button
              key={option}
              className={`sort-btn ${sortBy === option ? 'active' : ''}`}
              onClick={() => setSortBy(option)}
            >
              {option === 'recent' ? 'Most Recent' :
               option === 'rating_high' ? 'Highest Rating' :
               option === 'rating_low' ? 'Lowest Rating' : 'Most Helpful'}
            </button>
          ))}
        </div>
      </div>

      /* Reviews List */
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <div className="no-reviews-icon">💬</div>
            <h3>No reviews yet</h3>
            <p>Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="review-item">
              <div className="review-header">
                <div className="review-user">
                  <div className="user-avatar">
                    {review.user?.avatar ? (
                      <img src={`${API_URL}${review.user.avatar}`} alt={review.user.name} />
                    ) : (
                      <span>{review.user?.name?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{review.user?.name || 'Anonymous'}</span>
                    <span className="review-date">{formatDate(review.createdAt)}</span>
                  </div>
                </div>
                <div className="review-actions">
                  {user && user.id === review.user?._id && (
                    <>
                      <button 
                        className="edit-review-btn"
                        onClick={() => handleEditReview(review)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-review-btn"
                        onClick={() => handleDeleteReview(review._id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="review-stars">
                {renderStars(review.rating)}
              </div>

              {review.title && (
                <h4 className="review-title">{review.title}</h4>
              )}

              <p className="review-comment">{review.comment}</p>

              {review.verifiedPurchase && (
                <span className="verified-badge">✓ Verified Purchase</span>
              )}

              <div className="review-footer">
                <button 
                  className="helpful-btn"
                  onClick={() => handleHelpful(review._id)}
                >
                  👍 {review.helpful || 0} helpful
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      /* Pagination */
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Reviews;