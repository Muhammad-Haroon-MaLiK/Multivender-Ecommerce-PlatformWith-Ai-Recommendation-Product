from pymongo import MongoClient
from datetime import datetime
import random
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to MongoDB (Docker container on localhost)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://root:root123@localhost:27017/shopverse?authSource=admin")
client = MongoClient(MONGO_URI)
db = client.shopverse

# Test connection
try:
    db.command('ping')
    print("✅ Connected to MongoDB successfully!")
    print(f"📍 MongoDB running on: localhost:27017")
    print(f"📊 Database: shopverse")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    exit(1)

# Clear existing data
print("\n🗑️  Clearing existing data...")
try:
    db.products.delete_many({})
    db.browsinghistories.delete_many({})
    db.recommendations.delete_many({})
    print("✅ Existing data cleared.")
except Exception as e:
    print(f"⚠️  Error clearing data: {e}")

# Sample products
products = [
    {
        "title": "iPhone 15 Pro Max",
        "description": "Latest iPhone with A17 Pro chip, titanium design, and amazing camera system",
        "category": "Electronics",
        "subCategory": "Smartphones",
        "vendor": "Apple Store",
        "price": 1199.99,
        "isActive": True,
        "tags": ["smartphone", "apple", "ios", "5g", "camera"],
        "createdAt": datetime.utcnow()
    },
    {
        "title": "Samsung Galaxy S24 Ultra",
        "description": "Premium Android smartphone with AI features, S Pen, and incredible display",
        "category": "Electronics",
        "subCategory": "Smartphones",
        "vendor": "Samsung Store",
        "price": 1299.99,
        "isActive": True,
        "tags": ["smartphone", "samsung", "android", "5g", "spen"],
        "createdAt": datetime.utcnow()
    },
    {
        "title": "MacBook Pro 16-inch",
        "description": "Professional laptop with M3 Max chip, 36GB memory, and 1TB storage",
        "category": "Electronics",
        "subCategory": "Laptops",
        "vendor": "Apple Store",
        "price": 2499.99,
        "isActive": True,
        "tags": ["laptop", "apple", "macbook", "pro"],
        "createdAt": datetime.utcnow()
    },
    {
        "title": "Nike Air Max 270",
        "description": "Comfortable running shoes with Air cushioning and stylish design",
        "category": "Footwear",
        "subCategory": "Running Shoes",
        "vendor": "Nike Store",
        "price": 159.99,
        "isActive": True,
        "tags": ["shoes", "nike", "running", "airmax"],
        "createdAt": datetime.utcnow()
    },
    {
        "title": "Adidas Ultraboost 23",
        "description": "Energy-returning running shoes with responsive Boost technology",
        "category": "Footwear",
        "subCategory": "Running Shoes",
        "vendor": "Adidas Store",
        "price": 189.99,
        "isActive": True,
        "tags": ["shoes", "adidas", "running", "ultraboost"],
        "createdAt": datetime.utcnow()
    },
    {
        "title": "Levi's 501 Original Jeans",
        "description": "Classic straight-fit jeans made from premium denim",
        "category": "Fashion",
        "subCategory": "Jeans",
        "vendor": "Levi's Store",
        "price": 89.99,
        "isActive": True,
        "tags": ["jeans", "denim", "levis", "classic"],
        "createdAt": datetime.utcnow()
    },
    {
        "title": "Zara Oversized Blazer",
        "description": "Stylish oversized blazer for a modern and sophisticated look",
        "category": "Fashion",
        "subCategory": "Blazers",
        "vendor": "Zara",
        "price": 129.99,
        "isActive": True,
        "tags": ["blazer", "zara", "oversized", "fashion"],
        "createdAt": datetime.utcnow()
    },
    {
        "title": "Sony WH-1000XM5 Headphones",
        "description": "Premium noise-canceling headphones with exceptional sound quality",
        "category": "Electronics",
        "subCategory": "Headphones",
        "vendor": "Sony Store",
        "price": 399.99,
        "isActive": True,
        "tags": ["headphones", "sony", "noise-canceling", "wireless"],
        "createdAt": datetime.utcnow()
    },
    {
        "title": "Dyson V15 Vacuum",
        "description": "Powerful cordless vacuum with laser technology for hard floors",
        "category": "Home & Living",
        "subCategory": "Appliances",
        "vendor": "Dyson",
        "price": 699.99,
        "isActive": True,
        "tags": ["vacuum", "dyson", "cordless", "cleaning"],
        "createdAt": datetime.utcnow()
    },
    {
        "title": "LEGO Star Wars Millennium Falcon",
        "description": "Build the iconic Millennium Falcon with this detailed LEGO set",
        "category": "Kids & Toys",
        "subCategory": "LEGO",
        "vendor": "LEGO Store",
        "price": 159.99,
        "isActive": True,
        "tags": ["lego", "starwars", "toys", "building"],
        "createdAt": datetime.utcnow()
    },
    {
        "title": "Dior Sauvage Eau de Parfum",
        "description": "Iconic men's fragrance with fresh and woody notes",
        "category": "Beauty",
        "subCategory": "Fragrance",
        "vendor": "Dior",
        "price": 129.99,
        "isActive": True,
        "tags": ["fragrance", "dior", "sauvage", "perfume"],
        "createdAt": datetime.utcnow()
    },
    {
        "title": "KitchenAid Stand Mixer",
        "description": "Professional-grade stand mixer for all your baking needs",
        "category": "Home & Living",
        "subCategory": "Kitchen",
        "vendor": "KitchenAid",
        "price": 349.99,
        "isActive": True,
        "tags": ["mixer", "kitchenaid", "baking", "kitchen"],
        "createdAt": datetime.utcnow()
    }
]

# Insert products
print("\n📦 Adding sample products...")
result = db.products.insert_many(products)
print(f"✅ Added {len(result.inserted_ids)} products")

# Create sample interactions
print("\n👤 Adding sample user interactions...")
product_ids = list(db.products.find({}, {"_id": 1}))
product_ids = [str(p["_id"]) for p in product_ids]

interactions = []
weights = {"view": 1, "click": 2, "cart": 5, "purchase": 10}
users = ["user1", "user2", "user3", "user4", "user5"]

for user_id in users:
    # Each user interacts with 3-7 random products
    for _ in range(random.randint(3, 7)):
        product_id = random.choice(product_ids)
        event_type = random.choice(["view", "view", "view", "click", "cart", "purchase"])
        weight = weights.get(event_type, 1)
        
        interactions.append({
            "userId": user_id,
            "productId": product_id,
            "eventType": event_type,
            "weight": weight,
            "createdAt": datetime.utcnow()
        })

if interactions:
    db.browsinghistories.insert_many(interactions)
    print(f"✅ Added {len(interactions)} interactions")

print("\n" + "="*50)
print("🎉 Sample data added successfully!")
print("="*50)
print(f"📊 Total Products: {db.products.count_documents({})}")
print(f"📊 Total Interactions: {db.browsinghistories.count_documents({})}")
print("\nNow run: python train_model.py")
print("="*50)