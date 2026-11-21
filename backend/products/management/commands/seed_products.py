"""
Management command to seed flower categories and products into the database.
Usage:
    python manage.py seed_products
"""
from django.core.management.base import BaseCommand
from products.models import Category, Product


class Command(BaseCommand):
    help = "Seed initial flower products and categories for Floral Delight"

    def handle(self, *args, **options):
        self.stdout.write("Seeding categories and flower products...")

        categories_data = [
            {"name": "Roses", "slug": "roses", "description": "Classic and luxury garden roses."},
            {"name": "Tulips", "slug": "tulips", "description": "Fresh vibrant Dutch garden tulips."},
            {"name": "Lilies", "slug": "lilies", "description": "Fragrant and majestic royal lilies."},
            {"name": "Orchids", "slug": "orchids", "description": "Exotic tropical orchid blooms."},
            {"name": "Lotus", "slug": "lotus", "description": "Sacred water lotus and water lilies."},
            {"name": "Sunflowers", "slug": "sunflowers", "description": "Golden radiance sunflowers."},
            {"name": "Carnations", "slug": "carnations", "description": "Artisanal ruffled carnations."},
            {"name": "Daisies", "slug": "daisies", "description": "Cheerful chamomile and gerbera daisies."},
            {"name": "Lavender", "slug": "lavender", "description": "Soothing aromatic lavender stems."},
            {"name": "Anthurium", "slug": "anthurium", "description": "Tropical architectural anthuriums."},
        ]

        category_objs = {}
        for cat in categories_data:
            obj, _ = Category.objects.get_or_create(
                slug=cat["slug"],
                defaults={"name": cat["name"], "description": cat["description"]}
            )
            category_objs[cat["slug"]] = obj

        products_data = [
            {
                "id": 1,
                "name": "Classic Red Rose Bouquet",
                "slug": "rose-red",
                "category": category_objs["roses"],
                "price": 4300.00,
                "image": "Images/rose-red.jpg",
                "flower_type": "roses",
                "description": "Lush, classic garden roses with full velvety blooms and captivating natural aroma."
            },
            {
                "id": 2,
                "name": "Blush Pink Rose Bouquet",
                "slug": "rose-pink",
                "category": category_objs["roses"],
                "price": 4400.00,
                "image": "Images/rose-pink.jpg",
                "flower_type": "roses",
                "description": "Tender blush garden roses layered with ruffled perfection, expressing pure romance."
            },
            {
                "id": 3,
                "name": "Dutch Tulip Ensemble",
                "slug": "tulip-pink",
                "category": category_objs["tulips"],
                "price": 5500.00,
                "image": "Images/tulip-pink.jpg",
                "flower_type": "tulips",
                "description": "Crisp springtime Dutch tulips in harmonic pink and white shades."
            },
            {
                "id": 4,
                "name": "Casablanca Royal Lily",
                "slug": "lily-white",
                "category": category_objs["lilies"],
                "price": 4800.00,
                "image": "Images/lily-white.jpg",
                "flower_type": "lilies",
                "description": "Pristine white oriental lilies delivering enchanting natural perfume."
            },
            {
                "id": 5,
                "name": "Golden Radiance Sunflower",
                "slug": "sunflower-golden",
                "category": category_objs["sunflowers"],
                "price": 3800.00,
                "image": "Images/sunflower-golden.jpg",
                "flower_type": "sunflowers",
                "description": "Vibrant golden-yellow sunflowers capturing the warmth of morning sun."
            },
            {
                "id": 6,
                "name": "Tropical Dendrobium Orchid",
                "slug": "orchid-white",
                "category": category_objs["orchids"],
                "price": 5200.00,
                "image": "Images/orchid-white.jpg",
                "flower_type": "orchids",
                "description": "Refined exotic orchid sprays showcasing sculptural silhouette and enduring freshness."
            },
        ]

        count = 0
        for p in products_data:
            p_id = p.pop("id")
            Product.objects.update_or_create(id=p_id, defaults=p)
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {count} flower products!"))
