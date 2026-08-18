from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# CORS Configuration
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000"],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "Accept"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://root:root123@localhost:27017/shopverse?authSource=admin")
client = MongoClient(MONGO_URI)
db = client.shopverse

# Collections
products_collection = db.products
recommendations_collection = db.recommendations
browsing_history_collection = db.browsinghistories
users_collection = db.users

def parse_objectid(doc):
    """Convert ObjectId to string for JSON serialization"""
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

# ALL ROUTES - NO AUTHENTICATION REQUIRED
# Development Mode Only

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'database': 'connected' if client else 'disconnected'
    })

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all active products with pagination"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        skip = (page - 1) * limit
        
        query = {'isActive': True}
        
        category = request.args.get('category')
        if category:
            query['category'] = category
        
        search = request.args.get('search')
        if search:
            query['$or'] = [
                {'title': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}},
                {'tags': {'$in': [search]}}
            ]
        
        total = products_collection.count_documents(query)
        products = list(products_collection.find(query).skip(skip).limit(limit))
        
        for product in products:
            parse_objectid(product)
        
        return jsonify({
            'products': products,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get a single product by ID"""
    try:
        product = products_collection.find_one({'_id': ObjectId(product_id)})
        if product:
            parse_objectid(product)
            return jsonify(product)
        return jsonify({'error': 'Product not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    """Get product recommendations - PUBLIC API (no auth required)"""
    try:
        limit = int(request.args.get('limit', 8))
        user_id = request.args.get('userId')
        
        # If no userId, get first user with recommendations
        if not user_id:
            random_rec = recommendations_collection.find_one()
            if random_rec:
                user_id = str(random_rec['userId'])
            else:
                return jsonify({
                    'recommendations': [],
                    'message': 'No recommendations available'
                })
        
        # Try to find recommendations for this user
        rec = recommendations_collection.find_one({'userId': user_id})
        
        if not rec:
            return jsonify({
                'recommendations': [],
                'message': 'No recommendations available for this user'
            })
        
        recommended_products = []
        for item in rec.get('items', [])[:limit]:
            product_id = item['productId']
            try:
                product = products_collection.find_one({'_id': ObjectId(product_id)})
            except:
                product = products_collection.find_one({'_id': product_id})
            
            if product:
                parse_objectid(product)
                product['recommendation_score'] = item.get('score', 0)
                product['reason'] = item.get('reason', '')
                recommended_products.append(product)
        
        return jsonify({
            'recommendations': recommended_products,
            'modelVersion': rec.get('modelVersion'),
            'generatedAt': rec.get('generatedAt').isoformat() if rec.get('generatedAt') else None,
            'userId': user_id
        })
        
    except Exception as e:
        print(f"Error in recommendations: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all product categories"""
    try:
        categories = products_collection.distinct('category', {'isActive': True})
        return jsonify({'categories': [c for c in categories if c]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vendors', methods=['GET'])
def get_vendors():
    """Get all vendors"""
    try:
        vendors = products_collection.distinct('vendor', {'isActive': True})
        return jsonify({'vendors': [v for v in vendors if v]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )