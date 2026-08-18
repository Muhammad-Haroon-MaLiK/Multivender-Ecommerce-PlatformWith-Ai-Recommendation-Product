"""
ShopVerse Recommendation Model
==============================

Hybrid recommender:
  1. Collaborative filtering (implicit ALS) on the user-product weighted
     interaction matrix built from BrowsingHistory (view/click/cart/purchase).
  2. Content-based similarity (TF-IDF over title+category+tags+description)
     used to (a) fill in recommendations for users the CF model is unsure
     about, and (b) surface brand-new products that have no interactions yet
     ("item cold start") by matching them to what the user already likes.

Output: writes each user's top-N recommended products into the
`recommendations` collection, which the Node/Express API reads directly.

Run manually:
    python train_model.py

Run on a schedule (recommended): via cron, e.g. nightly at 2 AM:
    0 2 * * * /usr/bin/python3 /path/to/ml/train_model.py >> /var/log/shopverse_reco.log 2>&1

Or trigger it from Node with node-cron / a queue worker (see README.md).
"""

import os
import sys
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
from pymongo import MongoClient
from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from implicit.als import AlternatingLeastSquares
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://root:root123@localhost:27017/shopverse?authSource=admin")
MODEL_VERSION = "hybrid-als-content-v1"
TOP_N = 20                     # how many recommendations to store per user
LOOKBACK_DAYS = 90             # only use recent interaction history for training
MIN_USER_INTERACTIONS = 3      # skip users with too little signal (handled by trending in the API)
ALS_FACTORS = 50
ALS_ITERATIONS = 20
ALS_REGULARIZATION = 0.05
CF_WEIGHT = 0.7                # blend weight for collaborative score vs content score
CONTENT_WEIGHT = 0.3


def get_db():
    client = MongoClient(MONGO_URI)
    return client.get_default_database()


def load_interactions(db):
    """Pull recent weighted interactions and collapse to one row per (user, product)."""
    since = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)
    cursor = db.browsinghistories.find(
        {"createdAt": {"$gte": since}, "userId": {"$ne": None}},
        {"userId": 1, "productId": 1, "weight": 1},
    )
    df = pd.DataFrame(list(cursor))
    if df.empty:
        return df
    df["userId"] = df["userId"].astype(str)
    df["productId"] = df["productId"].astype(str)
    # sum weights so repeated views/purchases of the same item accumulate signal
    df = df.groupby(["userId", "productId"], as_index=False)["weight"].sum()
    return df


def load_products(db):
    cursor = db.products.find(
        {"isActive": True},
        {"title": 1, "description": 1, "category": 1, "subCategory": 1, "tags": 1},
    )
    products = list(cursor)
    for p in products:
        p["_id"] = str(p["_id"])
        p["text"] = " ".join([
            p.get("title", ""),
            p.get("category", "") or "",
            p.get("subCategory", "") or "",
            " ".join(p.get("tags", []) or []),
            (p.get("description", "") or "")[:300],  # cap length, description can be long
        ])
    return pd.DataFrame(products)


def build_interaction_matrix(df):
    """Returns (sparse user-item matrix, user_id list, product_id list, index maps)."""
    user_ids = df["userId"].unique().tolist()
    product_ids = df["productId"].unique().tolist()

    user_idx = {u: i for i, u in enumerate(user_ids)}
    product_idx = {p: i for i, p in enumerate(product_ids)}

    rows = df["userId"].map(user_idx)
    cols = df["productId"].map(product_idx)
    values = df["weight"].astype(float)

    matrix = csr_matrix((values, (rows, cols)), shape=(len(user_ids), len(product_ids)))
    return matrix, user_ids, product_ids, user_idx, product_idx


def train_als(user_item_matrix):
    model = AlternatingLeastSquares(
        factors=ALS_FACTORS,
        regularization=ALS_REGULARIZATION,
        iterations=ALS_ITERATIONS,
        random_state=42,
    )
    # implicit expects item-user matrix for .fit in recent versions, but the
    # recommend() call takes user-item rows -> keep both orientations handy.
    model.fit(user_item_matrix)
    return model


def build_content_similarity(products_df):
    if products_df.empty:
        return None, {}
    tfidf = TfidfVectorizer(max_features=5000, stop_words="english")
    tfidf_matrix = tfidf.fit_transform(products_df["text"])
    sim_matrix = cosine_similarity(tfidf_matrix)
    product_pos = {pid: i for i, pid in enumerate(products_df["_id"].tolist())}
    return sim_matrix, product_pos


def content_recommendations_for_user(user_recent_product_ids, sim_matrix, product_pos, product_ids, top_n):
    """Fallback / supplement: average similarity to the user's recently interacted items."""
    if sim_matrix is None:
        return {}
    positions = [product_pos[pid] for pid in user_recent_product_ids if pid in product_pos]
    if not positions:
        return {}
    avg_sim = sim_matrix[positions].mean(axis=0)
    scored = {product_ids[i]: float(avg_sim[i]) for i in np.argsort(-avg_sim)[: top_n * 2]}
    for pid in user_recent_product_ids:
        scored.pop(pid, None)  # don't recommend what they've already seen
    return scored


def main():
    db = get_db()
    print(f"[{datetime.now(timezone.utc)}] Loading interactions...")
    interactions = load_interactions(db)

    print(f"[{datetime.now(timezone.utc)}] Loading product catalog...")
    products_df = load_products(db)
    if products_df.empty:
        print("No active products found. Aborting.")
        sys.exit(0)

    sim_matrix, product_pos = build_content_similarity(products_df)
    all_product_ids = products_df["_id"].tolist()

    if interactions.empty:
        print("No user interactions yet. Nothing to train — trending endpoint covers all users for now.")
        return

    matrix, user_ids, product_ids, user_idx, product_idx = build_interaction_matrix(interactions)
    print(f"Matrix: {matrix.shape[0]} users x {matrix.shape[1]} products, {matrix.nnz} interactions")

    print(f"[{datetime.now(timezone.utc)}] Training ALS model...")
    model = train_als(matrix)

    # index -> mongo product id lookup, and per-user recent items for content blending
    idx_to_product = {v: k for k, v in product_idx.items()}
    user_recent_items = (
        interactions.sort_values("weight", ascending=False)
        .groupby("userId")["productId"]
        .apply(list)
    )

    now = datetime.now(timezone.utc)
    bulk_ops = []
    skipped = 0

    for user_id in user_ids:
        u_pos = user_idx[user_id]
        n_interactions = matrix[u_pos].nnz
        if n_interactions < MIN_USER_INTERACTIONS:
            skipped += 1
            continue  # API falls back to trending for these users

        # Collaborative filtering candidates
        cf_ids, cf_scores = model.recommend(
            u_pos, matrix[u_pos], N=TOP_N, filter_already_liked_items=True
        )
        cf_results = {idx_to_product[i]: float(s) for i, s in zip(cf_ids, cf_scores)}

        # normalize CF scores to 0..1 so blending with cosine similarity is sane
        if cf_results:
            max_cf = max(cf_results.values()) or 1.0
            cf_results = {pid: s / max_cf for pid, s in cf_results.items()}

        # Content-based candidates (also covers newly-listed products with no interactions yet)
        recent = user_recent_items.get(user_id, [])[:10]
        content_results = content_recommendations_for_user(recent, sim_matrix, product_pos, all_product_ids, TOP_N)

        # Blend
        combined = {}
        for pid, score in cf_results.items():
            combined[pid] = combined.get(pid, 0) + CF_WEIGHT * score
        for pid, score in content_results.items():
            combined[pid] = combined.get(pid, 0) + CONTENT_WEIGHT * score

        top_items = sorted(combined.items(), key=lambda x: x[1], reverse=True)[:TOP_N]
        if not top_items:
            skipped += 1
            continue

        # Convert product IDs to ObjectId if valid
        items_doc = []
        for pid, score in top_items:
            try:
                # Try to convert to ObjectId
                product_obj_id = ObjectId(pid)
                items_doc.append({
                    "productId": product_obj_id,
                    "score": round(score, 4),
                    "reason": "hybrid" if pid in cf_results and pid in content_results
                    else "collaborative" if pid in cf_results else "content",
                })
            except:
                # If not valid ObjectId, store as string
                items_doc.append({
                    "productId": pid,
                    "score": round(score, 4),
                    "reason": "hybrid" if pid in cf_results and pid in content_results
                    else "collaborative" if pid in cf_results else "content",
                })

        # Handle user_id - try to convert to ObjectId or keep as string
        try:
            user_obj_id = ObjectId(user_id)
            filter_user = {"userId": user_obj_id}
        except:
            filter_user = {"userId": user_id}

        bulk_ops.append(
            {
                "filter": filter_user,
                "update": {
                    "$set": {
                        "items": items_doc,
                        "modelVersion": MODEL_VERSION,
                        "generatedAt": now,
                    }
                },
                "upsert": True,
            }
        )

    if bulk_ops:
        from pymongo import UpdateOne
        db.recommendations.bulk_write(
            [UpdateOne(op["filter"], op["update"], upsert=op["upsert"]) for op in bulk_ops]
        )

    print(f"[{datetime.now(timezone.utc)}] Done. Wrote recommendations for {len(bulk_ops)} users, "
          f"skipped {skipped} (insufficient history -> trending fallback applies).")


if __name__ == "__main__":
    main()