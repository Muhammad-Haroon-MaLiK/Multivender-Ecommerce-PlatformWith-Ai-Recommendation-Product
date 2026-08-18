import pymongo
import os
from dotenv import load_dotenv
from datetime import datetime
from bson import ObjectId

load_dotenv()

# MongoDB connection
mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/markethub')
print(f'Connecting to MongoDB: {mongo_uri}')

client = pymongo.MongoClient(mongo_uri)
db = client.get_database()

print(f'[{datetime.utcnow()}] Connected to MongoDB')

# Drop existing recommendations collection to start fresh
db.recommendations.drop()
print('Dropped existing recommendations collection')

# Get all users
users = list(db.users.find({}))
print(f'Found {len(users)} users')

# Get all products
products = list(db.products.find({}))
print(f'Found {len(products)} products')

if len(products) == 0:
    print('No products found')
    exit()

recommendations_saved = 0

# For each user, generate recommendations based on their browsing history
for user in users:
    # Get user's browsing history
    history = list(db.browsinghistories.find({'userId': user['_id']}))
    
    if len(history) == 0:
        print(f'  Skipping {user.get("email", user["_id"])} - no history')
        continue
    
    # Get product IDs the user has interacted with
    viewed_product_ids = [h['productId'] for h in history]
    
    # Create recommendations
    recommendations = []
    for product in products:
        product_id = product['_id']
        
        # Calculate score based on interactions
        if product_id in viewed_product_ids:
            interaction_count = len([h for h in history if h['productId'] == product_id])
            score = 0.7 + (interaction_count * 0.05)
        else:
            score = 0.1 + (len(history) * 0.005)
        
        # Cap score at 1.0
        score = min(score, 1.0)
        
        recommendations.append({
            'productId': product_id,
            'name': product.get('name', 'Product'),
            'category': product.get('category', 'General'),
            'price': product.get('price', 0),
            'score': round(score, 4)
        })
    
    # Sort by score (highest first)
    recommendations.sort(key=lambda x: x['score'], reverse=True)
    
    # Take top 10
    top_recommendations = recommendations[:10]
    
    # Save to MongoDB
    result = db.recommendations.insert_one({
        'userId': user['_id'],
        'userEmail': user.get('email', ''),
        'recommendations': top_recommendations,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    })
    
    recommendations_saved += 1
    print(f'  ✅ Saved {len(top_recommendations)} recommendations for {user.get("email", user["_id"])}')

print(f'[{datetime.utcnow()}] Done! Saved recommendations for {recommendations_saved} users')

# Verify the save
count = db.recommendations.count_documents({})
print(f'Total recommendations in database: {count}')

client.close()
