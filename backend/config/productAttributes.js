
const PRODUCT_ATTRIBUTES = {
  'Clothing': {
    attributes: [
      { 
        name: 'size', 
        label: 'Size', 
        type: 'select', 
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        required: true 
      },
      { 
        name: 'color', 
        label: 'Color', 
        type: 'color', 
        options: ['#000000', '#FFFFFF', '#FF0000', '#0000FF', '#008000', '#FFC0CB', '#800080', '#FFA500'],
        required: true 
      },
      { 
        name: 'fabric', 
        label: 'Fabric', 
        type: 'select', 
        options: ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen', 'Denim', 'Jersey'],
        required: false 
      },
      { 
        name: 'pattern', 
        label: 'Pattern', 
        type: 'select', 
        options: ['Solid', 'Striped', 'Checked', 'Floral', 'Graphic', 'Camouflage'],
        required: false 
      },
    ]
  },
  
  'Footwear': {
    attributes: [
      { 
        name: 'size', 
        label: 'Size (US)', 
        type: 'select', 
        options: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'],
        required: true 
      },
      { 
        name: 'color', 
        label: 'Color', 
        type: 'color', 
        options: ['#000000', '#FFFFFF', '#8B4513', '#A52A2A', '#FF0000', '#0000FF', '#008000'],
        required: true 
      },
      { 
        name: 'material', 
        label: 'Material', 
        type: 'select', 
        options: ['Leather', 'Suede', 'Canvas', 'Mesh', 'Synthetic', 'Rubber'],
        required: false 
      },
    ]
  },
  
  'Watches': {
    attributes: [
      { 
        name: 'color', 
        label: 'Color', 
        type: 'color', 
        options: ['#000000', '#C0C0C0', '#FFD700', '#8B4513', '#0000FF', '#FFFFFF'],
        required: true 
      },
      { 
        name: 'strapMaterial', 
        label: 'Strap Material', 
        type: 'select', 
        options: ['Leather', 'Stainless Steel', 'Silicone', 'Nylon', 'Titanium', 'Gold'],
        required: true 
      },
      { 
        name: 'movement', 
        label: 'Movement Type', 
        type: 'select', 
        options: ['Automatic', 'Quartz', 'Mechanical', 'Solar', 'Smart'],
        required: false 
      },
      { 
        name: 'dialColor', 
        label: 'Dial Color', 
        type: 'select', 
        options: ['Black', 'White', 'Blue', 'Green', 'Rose Gold', 'Silver', 'Gold'],
        required: false 
      },
    ]
  },
  
  'Electronics': {
    attributes: [
      { 
        name: 'storage', 
        label: 'Storage', 
        type: 'select', 
        options: ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
        required: true 
      },
      { 
        name: 'color', 
        label: 'Color', 
        type: 'color', 
        options: ['#000000', '#FFFFFF', '#C0C0C0', '#FFD700', '#FF0000', '#0000FF'],
        required: false 
      },
      { 
        name: 'ram', 
        label: 'RAM', 
        type: 'select', 
        options: ['4GB', '6GB', '8GB', '12GB', '16GB', '32GB'],
        required: false 
      },
      { 
        name: 'condition', 
        label: 'Condition', 
        type: 'select', 
        options: ['New', 'Refurbished', 'Used - Like New', 'Used - Good'],
        required: false 
      },
    ]
  },
  
  'Perfumes': {
    attributes: [
      { 
        name: 'size', 
        label: 'Size (ml)', 
        type: 'select', 
        options: ['30ml', '50ml', '75ml', '100ml', '150ml', '200ml'],
        required: true 
      },
      { 
        name: 'scentType', 
        label: 'Scent Type', 
        type: 'select', 
        options: ['Floral', 'Woody', 'Citrus', 'Oriental', 'Fresh', 'Spicy', 'Gourmand', 'Aquatic'],
        required: true 
      },
      { 
        name: 'gender', 
        label: 'Gender', 
        type: 'select', 
        options: ['Unisex', 'Men', 'Women'],
        required: false 
      },
    ]
  },
  
  'Beauty': {
    attributes: [
      { 
        name: 'shade', 
        label: 'Shade', 
        type: 'select', 
        options: ['Fair', 'Light', 'Medium', 'Tan', 'Deep', 'Dark'],
        required: true 
      },
      { 
        name: 'finish', 
        label: 'Finish', 
        type: 'select', 
        options: ['Matte', 'Glossy', 'Satin', 'Dewy', 'Sheer'],
        required: false 
      },
    ]
  },
  
  'Home & Living': {
    attributes: [
      { 
        name: 'color', 
        label: 'Color', 
        type: 'color', 
        options: ['#FFFFFF', '#F5F5DC', '#8B4513', '#2F4F4F', '#A0522D', '#D2B48C'],
        required: false 
      },
      { 
        name: 'material', 
        label: 'Material', 
        type: 'select', 
        options: ['Wood', 'Metal', 'Glass', 'Plastic', 'Fabric', 'Ceramic', 'Stone'],
        required: false 
      },
      { 
        name: 'size', 
        label: 'Size (cm)', 
        type: 'select', 
        options: ['Small', 'Medium', 'Large', 'Extra Large'],
        required: false 
      },
    ]
  }
};

// Default attributes for any category not listed
const DEFAULT_ATTRIBUTES = [
  { name: 'color', label: 'Color', type: 'color', options: ['#000000', '#FFFFFF', '#FF0000', '#0000FF', '#008000'], required: false },
  { name: 'size', label: 'Size', type: 'select', options: ['S', 'M', 'L', 'XL'], required: false },
];

const getProductAttributes = (category) => {
  return PRODUCT_ATTRIBUTES[category]?.attributes || DEFAULT_ATTRIBUTES;
};

const getAttributeOptions = (category, attributeName) => {
  const categoryConfig = PRODUCT_ATTRIBUTES[category];
  if (!categoryConfig) return [];
  
  const attribute = categoryConfig.attributes.find(a => a.name === attributeName);
  return attribute?.options || [];
};

module.exports = {
  PRODUCT_ATTRIBUTES,
  getProductAttributes,
  getAttributeOptions,
};