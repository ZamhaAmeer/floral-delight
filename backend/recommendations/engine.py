"""
Rule-Based Recommendation Engine for Floral Delight Boutique Florist.

Architecture Note:
This engine is deliberately decoupled from API views. It implements modular,
rule-based scoring based on floral symbolism, occasion compatibility, recipient synergy,
palette matching, and budget thresholds. In the future, this module can be extended
or backed by a machine learning model or external AI recommendations without breaking API contracts.
"""
from decimal import Decimal
from products.models import Product

# ==============================================================================
# Supported Curations & Metadata
# ==============================================================================

OCCASION_METADATA = {
    "birthday": {
        "title": "Birthday Celebration",
        "description": "Joyful, cheerful celebration; bright blooms symbolizing happiness, personal growth, and radiant vitality.",
        "preferred_flower_types": ["sunflowers", "roses", "tulips", "daisies", "mixed"],
        "preferred_colors": ["yellow", "gold", "pink", "mixed", "orange"],
        "symbolism": "Celebrating another year of life, joy, and sunny optimism.",
    },
    "anniversary": {
        "title": "Anniversary & Romance",
        "description": "Enduring love, commitment, and heartfelt devotion; deep velvety roses, graceful lilies, and elegant orchids.",
        "preferred_flower_types": ["roses", "lilies", "orchids", "lotus"],
        "preferred_colors": ["red", "crimson", "pink", "blush", "white"],
        "symbolism": "Profound devotion, passion, and timeless romantic bonding.",
    },
    "wedding": {
        "title": "Wedding & Nuptials",
        "description": "Everlasting union, bridal majesty, and pure new beginnings; pristine white and tender blush blooms.",
        "preferred_flower_types": ["roses", "lilies", "orchids", "tulips"],
        "preferred_colors": ["white", "ivory", "blush", "pink"],
        "symbolism": "Purity of intention, harmony, and enduring sacred unity.",
    },
    "graduation": {
        "title": "Graduation & Milestone",
        "description": "Triumph, academic accomplishment, and bright horizon; radiant golden sunflowers and confident blossoms.",
        "preferred_flower_types": ["sunflowers", "tulips", "orchids", "mixed"],
        "preferred_colors": ["yellow", "gold", "orange", "vibrant"],
        "symbolism": "Celebrating monumental success, resilience, and a promising journey ahead.",
    },
    "valentines": {
        "title": "Valentine's Day",
        "description": "Passionate romance, poetic affection, and grand romantic gestures; velvet red and tender blush roses.",
        "preferred_flower_types": ["roses", "tulips", "lilies"],
        "preferred_colors": ["red", "crimson", "pink", "blush"],
        "symbolism": "Unconditional love, romantic desire, and exquisite tenderness.",
    },
    "mothers_day": {
        "title": "Mother's Day",
        "description": "Maternal gratitude, nurturing warmth, and tender appreciation; artisanal carnations, soft garden roses, and royal lilies.",
        "preferred_flower_types": ["carnations", "roses", "lilies", "tulips"],
        "preferred_colors": ["pink", "blush", "pastel", "white"],
        "symbolism": "Honoring unconditional nurturing, gentle grace, and endless maternal love.",
    },
    "just_because": {
        "title": "Just Because / Thinking of You",
        "description": "Spontaneous delight, friendship, and thoughtful botanical warmth to brighten someone's day.",
        "preferred_flower_types": ["tulips", "daisies", "sunflowers", "lavender", "mixed"],
        "preferred_colors": ["pink", "yellow", "lavender", "pastel"],
        "symbolism": "Spontaneous appreciation, genuine warmth, and mindful presence.",
    },
}

RECIPIENT_METADATA = {
    "partner": {
        "title": "Romantic Partner / Spouse",
        "preferred_categories": ["roses", "lilies", "orchids"],
        "tone": "romantic and devoted",
    },
    "friend": {
        "title": "Friend / Colleague",
        "preferred_categories": ["sunflowers", "tulips", "daisies", "mixed"],
        "tone": "cheerful, warm, and uplifting",
    },
    "family": {
        "title": "Family Member / Parent",
        "preferred_categories": ["carnations", "roses", "lilies", "lavender"],
        "tone": "tender, grateful, and comforting",
    },
    "other": {
        "title": "Special Recipient / Host",
        "preferred_categories": ["orchids", "tulips", "mixed"],
        "tone": "courteous, refined, and artisanal",
    },
}

SUPPORTED_FLOWER_TYPES = [
    {"slug": "roses", "name": "Garden Roses"},
    {"slug": "tulips", "name": "Dutch Tulips"},
    {"slug": "lilies", "name": "Royal Lilies"},
    {"slug": "orchids", "name": "Exotic Orchids"},
    {"slug": "lotus", "name": "Sacred Lotus"},
    {"slug": "sunflowers", "name": "Golden Sunflowers"},
    {"slug": "carnations", "name": "Artisanal Carnations"},
    {"slug": "daisies", "name": "Gerbera & Chamomile Daisies"},
    {"slug": "lavender", "name": "Aromatic Lavender"},
    {"slug": "anthurium", "name": "Tropical Anthuriums"},
]

SUPPORTED_COLORS = [
    {"slug": "red", "name": "Crimson & Velvet Red", "hex": "#B22222"},
    {"slug": "pink", "name": "Blush & Soft Pink", "hex": "#FFB6C1"},
    {"slug": "white", "name": "Pure White & Cream", "hex": "#FFFFF0"},
    {"slug": "yellow", "name": "Golden Sunshine Yellow", "hex": "#FFD700"},
    {"slug": "purple", "name": "Royal Purple & Lavender", "hex": "#9370DB"},
    {"slug": "mixed", "name": "Artisan Multi-Color Ensemble", "hex": "#E6A2A2"},
]

SUPPORTED_BOUQUET_STYLES = [
    {"slug": "hand-tied", "name": "Hand-Tied Bouquet", "description": "Classic artisanal wrap with satin/silk ribbon."},
    {"slug": "flower-box", "name": "Luxury Flower Box", "description": "Velvet or blush round presentation box."},
    {"slug": "flower-basket", "name": "Woven Flower Basket", "description": "Country cottage wicker arrangement with floral foam."},
    {"slug": "premium", "name": "Grand Premium Arrangement", "description": "High-stem statement display for milestones."},
]


# ==============================================================================
# Recommendation Engine Class
# ==============================================================================

class FlowerRecommendationEngine:
    """
    Evaluates catalog products against user preference vectors.
    Computes a composite relevance score (0 - 100) and formulates human-readable
    botanical justifications for each recommended bouquet.
    """

    @classmethod
    def recommend(cls, preferences: dict, limit: int = 6) -> dict:
        """
        Generate ranked recommendations matching user preferences.
        """
        occasion_slug = (preferences.get("occasion") or "").strip().lower()
        flower_type_slug = (preferences.get("flower_type") or "").strip().lower()
        color_slug = (preferences.get("color") or preferences.get("colour") or "").strip().lower()
        recipient_slug = (preferences.get("recipient") or "").strip().lower()
        bouquet_style_slug = (preferences.get("bouquet_style") or "").strip().lower()

        budget_min = preferences.get("budget_min")
        budget_max = preferences.get("budget_max")

        # 1. Fetch available products from PostgreSQL database (never fake or unavailable items)
        available_products = list(
            Product.objects.filter(is_available=True).select_related("category")
        )

        if not available_products:
            return {
                "status": "success",
                "total_found": 0,
                "summary_message": "Our florists are currently preparing fresh morning harvests. No flowers in stock.",
                "recommendations": []
            }

        # 2. Score each product against preferences
        scored_products = []
        for product in available_products:
            score, reasons, matches_criteria = cls._evaluate_product(
                product,
                occasion_slug=occasion_slug,
                flower_type_slug=flower_type_slug,
                color_slug=color_slug,
                recipient_slug=recipient_slug,
                bouquet_style_slug=bouquet_style_slug,
                budget_min=budget_min,
                budget_max=budget_max
            )
            scored_products.append({
                "product": product,
                "score": score,
                "reasons": reasons,
                "matches_criteria": matches_criteria,
            })

        # 3. Sort by score descending, then by price ascending
        scored_products.sort(key=lambda x: (-x["score"], x["product"].price))

        # 4. Check if exact matches exist (score >= 60)
        exact_matches = [p for p in scored_products if p["matches_criteria"] and p["score"] >= 55]

        has_exact_matches = len(exact_matches) > 0
        final_selection = exact_matches if has_exact_matches else scored_products[:limit]
        final_selection = final_selection[:limit]

        # 5. Formulate summary message
        occ_meta = OCCASION_METADATA.get(occasion_slug)
        rec_meta = RECIPIENT_METADATA.get(recipient_slug)

        if has_exact_matches:
            if occ_meta and rec_meta:
                summary = f"Curated for a {occ_meta['title']} gift to your {rec_meta['title']}. Hand-selected for {rec_meta['tone']} appeal."
            elif occ_meta:
                summary = f"Curated for {occ_meta['title']} with blooms celebrating {occ_meta['symbolism'].lower()}"
            elif flower_type_slug:
                summary = f"Selected premium {flower_type_slug.capitalize()} arrangements harmonized with your preferences."
            else:
                summary = "Our master florists have tailored these botanical recommendations based on your preferences."
        else:
            summary = "We couldn't find an exact match for all combined criteria, so our florists selected the closest available seasonal arrangements for you."

        # 6. Format recommended products
        results = []
        for item in final_selection:
            prod = item["product"]
            reason_text = " ".join(item["reasons"])
            if not has_exact_matches:
                reason_text = f"Alternative Recommendation: {reason_text}"

            results.append({
                "product_id": prod.id,
                "product_name": prod.name,
                "product_slug": prod.slug,
                "product_description": prod.description or "",
                "product_image": prod.image,
                "category": prod.category.name,
                "flower_type": prod.flower_type or prod.category.slug,
                "price": str(prod.price),
                "match_score": min(item["score"], 99),
                "is_exact_match": item["matches_criteria"],
                "recommendation_reason": reason_text,
            })

        return {
            "status": "success",
            "total_found": len(results),
            "is_exact_match": has_exact_matches,
            "summary_message": summary,
            "preferences_applied": {
                "occasion": occasion_slug or None,
                "flower_type": flower_type_slug or None,
                "color": color_slug or None,
                "recipient": recipient_slug or None,
                "bouquet_style": bouquet_style_slug or None,
                "budget_min": str(budget_min) if budget_min is not None else None,
                "budget_max": str(budget_max) if budget_max is not None else None,
            },
            "recommendations": results,
        }

    @classmethod
    def _evaluate_product(
        cls,
        product: Product,
        occasion_slug: str,
        flower_type_slug: str,
        color_slug: str,
        recipient_slug: str,
        bouquet_style_slug: str,
        budget_min: Decimal,
        budget_max: Decimal,
    ) -> tuple[int, list[str], bool]:
        """
        Calculates individual score and reason tokens for a single product.
        """
        score = 50  # Base viability score
        reasons = []
        matched_explicit_preference = False

        prod_flower_type = (product.flower_type or "").lower()
        prod_name_lower = product.name.lower()
        prod_desc_lower = (product.description or "").lower()
        category_slug = (product.category.slug if product.category else "").lower()

        # -------------------------------------------------------------
        # 1. Flower Type Matching (+30 points)
        # -------------------------------------------------------------
        if flower_type_slug:
            if (flower_type_slug in prod_flower_type or
                flower_type_slug in prod_name_lower or
                flower_type_slug in category_slug):
                score += 30
                matched_explicit_preference = True
                reasons.append(f"Features your preferred {flower_type_slug.capitalize()} floral variety.")
            else:
                score -= 15  # Penalize if user specifically requested roses but product is tulip

        # -------------------------------------------------------------
        # 2. Occasion Synergy (+25 points)
        # -------------------------------------------------------------
        if occasion_slug:
            occ_info = OCCASION_METADATA.get(occasion_slug)
            if occ_info:
                # Check preferred flower types for occasion
                if any(ft in prod_flower_type or ft in prod_name_lower for ft in occ_info["preferred_flower_types"]):
                    score += 25
                    matched_explicit_preference = True
                    reasons.append(f"Ideal for {occ_info['title']}: {occ_info['symbolism']}")
                # Check preferred colors for occasion
                elif any(c in prod_name_lower or c in prod_desc_lower for c in occ_info["preferred_colors"]):
                    score += 15
                    reasons.append(f"Color harmony suited for {occ_info['title']}.")

        # -------------------------------------------------------------
        # 3. Color / Palette Matching (+20 points)
        # -------------------------------------------------------------
        if color_slug:
            if (color_slug in prod_name_lower or
                color_slug in product.slug.lower() or
                color_slug in prod_desc_lower):
                score += 20
                matched_explicit_preference = True
                reasons.append(f"Presents a gorgeous {color_slug.capitalize()} botanical aesthetic.")
            else:
                score -= 10

        # -------------------------------------------------------------
        # 4. Recipient Synergy (+15 points)
        # -------------------------------------------------------------
        if recipient_slug:
            rec_info = RECIPIENT_METADATA.get(recipient_slug)
            if rec_info:
                if any(c in prod_flower_type or c in prod_name_lower for c in rec_info["preferred_categories"]):
                    score += 15
                    matched_explicit_preference = True
                    reasons.append(f"Thoughtfully suited for your {rec_info['title']}.")

        # -------------------------------------------------------------
        # 5. Budget Constraints (+10 points or boundary adjustment)
        # -------------------------------------------------------------
        in_budget = True
        price = product.price

        if budget_min is not None and price < budget_min:
            in_budget = False
            score -= 15

        if budget_max is not None:
            if price <= budget_max:
                score += 10
                reasons.append(f"Priced at Rs. {price:,.2f}, fitting comfortably within your budget.")
            else:
                in_budget = False
                score -= 25  # Substantial penalty if over max budget

        # -------------------------------------------------------------
        # 6. Fallback reason if list is empty
        # -------------------------------------------------------------
        if not reasons:
            reasons.append(f"Fresh artisan floral harvest from our {product.category.name} collection.")

        # Flag whether this satisfies user's explicit choices
        has_active_filters = any([occasion_slug, flower_type_slug, color_slug, recipient_slug, budget_max])
        matches_criteria = in_budget and (matched_explicit_preference if has_active_filters else True)

        return score, reasons, matches_criteria
