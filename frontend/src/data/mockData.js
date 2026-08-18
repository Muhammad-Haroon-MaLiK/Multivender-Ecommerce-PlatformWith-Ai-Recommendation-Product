export const PRODUCTS = [
  { id:1, name:"Minimal Leather Watch", vendor:"TimeZone Studio", price:129, oldPrice:180, emoji:"⌚", rating:4.8, reviews:142, category:"Fashion", tag:"Best Seller" },
  { id:2, name:"Wireless Noise-Cancel Headphones", vendor:"SoundWave Co.", price:89, oldPrice:120, emoji:"🎧", rating:4.6, reviews:98, category:"Electronics", tag:"Sale" },
  { id:3, name:"Organic Coffee Blend", vendor:"Bean & Brew", price:24, oldPrice:null, emoji:"☕", rating:4.9, reviews:311, category:"Food", tag:null },
  { id:4, name:"Handmade Ceramic Mug Set", vendor:"Clay Arts House", price:42, oldPrice:55, emoji:"🏺", rating:4.7, reviews:67, category:"Home", tag:"New" },
  { id:5, name:"Yoga Mat Pro", vendor:"ZenFlex Store", price:65, oldPrice:85, emoji:"🧘", rating:4.5, reviews:203, category:"Sports", tag:"Sale" },
  { id:6, name:"Succulent Plant Bundle", vendor:"GreenThumb Co.", price:35, oldPrice:null, emoji:"🌵", rating:4.8, reviews:189, category:"Home", tag:null },
  { id:7, name:"Bamboo Desk Organizer", vendor:"EcoDesk Brand", price:48, oldPrice:60, emoji:"🗂️", rating:4.4, reviews:55, category:"Home", tag:"New" },
  { id:8, name:"Artisan Hot Sauce Set", vendor:"Spice Routes", price:29, oldPrice:null, emoji:"🌶️", rating:4.6, reviews:428, category:"Food", tag:"Best Seller" },
];

export const VENDORS = [
  { id:1, name:"TimeZone Studio", category:"Fashion & Accessories", emoji:"⌚", rating:4.9, products:48, sales:2840, verified:true },
  { id:2, name:"SoundWave Co.", category:"Electronics", emoji:"🎧", rating:4.7, products:32, sales:1620, verified:true },
  { id:3, name:"Bean & Brew", category:"Food & Beverages", emoji:"☕", rating:4.8, products:15, sales:5200, verified:true },
  { id:4, name:"Clay Arts House", category:"Home & Decor", emoji:"🏺", rating:4.6, products:67, sales:890, verified:false },
  { id:5, name:"ZenFlex Store", category:"Sports & Wellness", emoji:"🧘", rating:4.5, products:24, sales:1340, verified:true },
  { id:6, name:"GreenThumb Co.", category:"Plants & Garden", emoji:"🌵", rating:4.8, products:89, sales:3210, verified:true },
];

export const ORDERS = [
  { id:"#ORD-8821", date:"May 05, 2026", items:3, total:218, status:"delivered" },
  { id:"#ORD-8819", date:"May 03, 2026", items:1, total:89, status:"shipped" },
  { id:"#ORD-8801", date:"Apr 28, 2026", items:5, total:312, status:"processing" },
  { id:"#ORD-8799", date:"Apr 20, 2026", items:2, total:74, status:"delivered" },
  { id:"#ORD-8780", date:"Apr 12, 2026", items:1, total:29, status:"cancelled" },
];

export const CATEGORIES = [
  { name:"Electronics", icon:"📱" },
  { name:"Fashion", icon:"👗" },
  { name:"Home & Decor", icon:"🏠" },
  { name:"Food", icon:"🍎" },
  { name:"Sports", icon:"⚽" },
  { name:"Beauty", icon:"💄" },
  { name:"Books", icon:"📚" },
  { name:"Toys", icon:"🧸" },
];