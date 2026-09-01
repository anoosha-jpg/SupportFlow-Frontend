import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ value = 0, onChange, readOnly = false, size = 20, showLabel = true }) => {
  const [hoverValue, setHoverValue] = useState(0);

  const getRatingLabel = (rating) => {
    switch (rating) {
      case 1:
        return 'Poor (1/5)';
      case 2:
        return 'Fair (2/5)';
      case 3:
        return 'Good (3/5)';
      case 4:
        return 'Very Good (4/5)';
      case 5:
        return 'Excellent (5/5)';
      default:
        return 'Select rating';
    }
  };

  const activeRating = hoverValue || value;

  return (
    <div className="star-rating-wrapper">
      <div className="star-rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-btn ${star <= activeRating ? 'filled' : 'empty'} ${readOnly ? 'readonly' : 'interactive'}`}
            onClick={() => !readOnly && onChange && onChange(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            disabled={readOnly}
            aria-label={`${star} star rating`}
          >
            <Star
              size={size}
              fill={star <= activeRating ? '#f59e0b' : 'none'}
              stroke={star <= activeRating ? '#f59e0b' : '#cbd5e1'}
              strokeWidth={2}
            />
          </button>
        ))}
      </div>
      {showLabel && (
        <span className="star-rating-text">
          {readOnly ? `${value > 0 ? value.toFixed(1) : 'No reviews'} / 5` : getRatingLabel(activeRating)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
