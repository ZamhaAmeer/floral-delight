/**
 * Floral Delight - Core Architectural Module
 * Central Flower Catalog Data, LocalStorage Wishlist Engine,
 * Toast Notifications, and Global Navigation Handlers.
 */

/* ==========================================================================
   1. Central Flower Catalog (Single Source of Truth)
   ========================================================================== */
const FLORAL_CATALOG = [
  // -------------------------------------------------------------
  // 1. ROSES (flowerType: 'roses')
  // -------------------------------------------------------------
  {
    id: 'rose-red',
    name: 'Classic Red Rose Bouquet',
    tagline: 'Grand Velvet Petals',
    flowerType: 'roses',
    category: 'romance',
    price: 4300,
    image: 'Images/rose-red.jpg',
    occasions: ['wedding', 'anniversary', 'birthday', 'getwellsoon'],
    color: 'Velvet Crimson Red',
    meaning: 'Passionate romance, profound devotion, and timeless elegance.',
    season: 'All Year Harvest',
    stemLength: '50 cm',
    fragrance: 'Rich Classic Floral',
    description: 'Lush, classic garden roses with full velvety blooms and captivating natural aroma, hand-tied with custom silk ribbon.'
  },
  {
    id: 'rose-pink',
    name: 'Blush Pink Rose Bouquet',
    tagline: 'Tender Grace & Sweetness',
    flowerType: 'roses',
    category: 'romance',
    price: 4400,
    image: 'Images/rose-pink.jpg',
    occasions: ['wedding', 'anniversary', 'birthday', 'thanksgiving'],
    color: 'Soft Blush Pink',
    meaning: 'Gentle affection, poetic romance, elegance, and blossoming joy.',
    season: 'All Year Harvest',
    stemLength: '50 cm',
    fragrance: 'Sweet Rose Water',
    description: 'Tender blush garden roses layered with ruffled perfection, expressing pure romance and gentle appreciation.'
  },
  {
    id: 'rose-white',
    name: 'Pure White Rose Bouquet',
    tagline: 'Majestic Bridal Simplicity',
    flowerType: 'roses',
    category: 'serene',
    price: 4400,
    image: 'Images/rose-white.jpg',
    occasions: ['wedding', 'anniversary', 'getwellsoon', 'thanksgiving'],
    color: 'Pure Porcelain White',
    meaning: 'Innocence, sacred devotion, harmony, and fresh beginnings.',
    season: 'All Year Harvest',
    stemLength: '50 cm',
    fragrance: 'Delicate Fresh Floral',
    description: 'Immaculate ivory white roses radiating peaceful grace, heartfelt loyalty, and understated luxury.'
  },
  {
    id: 'rose-black',
    name: 'Black Rose Bouquet',
    tagline: 'Rare Mystique & Velvet Noir',
    flowerType: 'roses',
    category: 'romance',
    price: 4800,
    image: 'Images/rose-black.jpg',
    occasions: ['anniversary', 'birthday'],
    color: 'Midnight Velvet Noir',
    meaning: 'Mysterious allure, dramatic elegance, rare rebirth, and profound fascination.',
    season: 'Boutique Harvest',
    stemLength: '50 cm',
    fragrance: 'Deep Velvet Musk',
    description: 'Extremely rare Black Baccara roses featuring deep gothic undertones, seductive velvet petals, and avant-garde style.'
  },
  {
    id: 'rose-yellow',
    name: 'Yellow Rose Bouquet',
    tagline: 'Radiant Warmth & Friendship',
    flowerType: 'roses',
    category: 'vibrant',
    price: 4200,
    image: 'Images/rose-yellow.jpg',
    occasions: ['birthday', 'graduation', 'getwellsoon', 'thanksgiving'],
    color: 'Vibrant Buttercup Yellow',
    meaning: 'Warm friendship, cheerful hospitality, optimism, and unyielding joy.',
    season: 'All Year Harvest',
    stemLength: '50 cm',
    fragrance: 'Honeyed Citrus Floral',
    description: 'Sun-drenched yellow roses brimming with golden optimism, designed to instantly brighten spirits and welcome cherished friends.'
  },
  {
    id: 'rose-peach',
    name: 'Peach Rose Bouquet',
    tagline: 'Subtle Modesty & Gratitude',
    flowerType: 'roses',
    category: 'romance',
    price: 4300,
    image: 'Images/rose-peach.jpg',
    occasions: ['thanksgiving', 'anniversary', 'birthday'],
    color: 'Apricot & Tender Peach',
    meaning: 'Heartfelt gratitude, modesty, sincerity, and warm tenderness.',
    season: 'All Year Harvest',
    stemLength: '50 cm',
    fragrance: 'Tender Sweet Peach',
    description: 'Warm pastel peach roses evoking cozy intimacy, sincere appreciation, and gentle sophistication.'
  },
  {
    id: 'rose-lavender',
    name: 'Lavender Rose Bouquet',
    tagline: 'Enchantment & Royal Wonder',
    flowerType: 'roses',
    category: 'serene',
    price: 4500,
    image: 'Images/rose-lavender.jpg',
    occasions: ['wedding', 'anniversary', 'birthday'],
    color: 'Silvery Lavender & Lilac',
    meaning: 'Love at first sight, royal wonder, and enchanting daydreams.',
    season: 'All Year Harvest',
    stemLength: '50 cm',
    fragrance: 'Soft Lavender Herbaceous',
    description: 'Rare lilac roses that whisper of magical fascination, regal poise, and unforgettable first impressions.'
  },
  {
    id: 'rose-orange',
    name: 'Orange Rose Bouquet',
    tagline: 'Fiery Passion & Energy',
    flowerType: 'roses',
    category: 'vibrant',
    price: 4400,
    image: 'Images/rose-orange.jpg',
    occasions: ['birthday', 'graduation', 'anniversary'],
    color: 'Sunburst Coral & Orange',
    meaning: 'Vibrant enthusiasm, passion, boundless creative energy, and excitement.',
    season: 'All Year Harvest',
    stemLength: '50 cm',
    fragrance: 'Warm Spiced Citrus',
    description: 'Fiery coral-orange garden roses pulsing with contagious warmth, vivacity, and spirited celebration.'
  },
  {
    id: 'rose-mixed',
    name: 'Mixed Rose Bouquet',
    tagline: 'Multi-Color Kaleidoscope',
    flowerType: 'roses',
    category: 'romance',
    price: 4900,
    image: 'Images/rose-mixed.jpg',
    occasions: ['wedding', 'birthday', 'anniversary', 'thanksgiving'],
    color: 'Crimson, Blush, Yellow & Peach',
    meaning: 'The complete celebration of love, friendship, joy, and sincere unity.',
    season: 'Curated Daily',
    stemLength: '50 cm',
    fragrance: 'Multi-Rose Symphony',
    description: 'A breathtaking tapestry of multi-hued roses celebrating life in full chromatic harmony.'
  },

  // -------------------------------------------------------------
  // 2. LOTUS (flowerType: 'lotus')
  // -------------------------------------------------------------
  {
    id: 'lotus-pink',
    name: 'Sacred Pink Lotus Bouquet',
    tagline: 'Sacred Aquatic Blossom',
    flowerType: 'lotus',
    category: 'serene',
    price: 3800,
    image: 'Images/lotus-pink.jpg',
    occasions: ['anniversary', 'wedding', 'getwellsoon'],
    color: 'Tender Pink & White',
    meaning: 'Spiritual awakening, serenity, purity rising above hardship, and graceful resilience.',
    season: 'Seasonal Aquatic Harvest',
    stemLength: '35 cm',
    fragrance: 'Clean Aquatic Floral',
    description: 'Revered aquatic bloom representing inner peace, renewal, and timeless spiritual grace.'
  },
  {
    id: 'lotus-white',
    name: 'Pure White Lotus Bouquet',
    tagline: 'Celestial Peace & Awakening',
    flowerType: 'lotus',
    category: 'serene',
    price: 4000,
    image: 'Images/lotus-white.jpg',
    occasions: ['wedding', 'getwellsoon', 'thanksgiving'],
    color: 'Pristine Ivory White',
    meaning: 'Unblemished spiritual perfection, quiet mind, and sacred sanctuary.',
    season: 'Seasonal Aquatic Harvest',
    stemLength: '35 cm',
    fragrance: 'Subtle Sweet Waterlily',
    description: 'Luminous white lotus blossoms cut at sunrise, bringing profound stillness and tranquility.'
  },
  {
    id: 'lotus-royal',
    name: 'Royal Purple Lotus Bouquet',
    tagline: 'Rare Mystic Waterlily',
    flowerType: 'lotus',
    category: 'serene',
    price: 4200,
    image: 'Images/lotus-royal.jpg',
    occasions: ['anniversary', 'birthday'],
    color: 'Deep Violet & Royal Blue',
    meaning: 'Enigmatic wisdom, spiritual ascension, and royal heritage.',
    season: 'Boutique Aquatic Harvest',
    stemLength: '35 cm',
    fragrance: 'Deep Exotic Floral',
    description: 'Rare blue and purple waterlotus stems reflecting mystical depth and timeless botanical wonder.'
  },

  // -------------------------------------------------------------
  // 3. TULIPS (flowerType: 'tulips')
  // -------------------------------------------------------------
  {
    id: 'tulip-pink',
    name: 'Pink Tulip Bouquet',
    tagline: 'Spring Velvet Dutch Bulbs',
    flowerType: 'tulips',
    category: 'romance',
    price: 5500,
    image: 'Images/tulip-pink.jpg',
    occasions: ['wedding', 'anniversary', 'birthday', 'thanksgiving'],
    color: 'Blush Pink & Rose',
    meaning: 'Declaration of pure and enduring love, fresh beginnings, and deep affection.',
    season: 'Spring / All Year',
    stemLength: '45 cm',
    fragrance: 'Delicate & Sweet',
    description: 'Crisp, velvety Dutch tulips hand-selected for vibrant color and long-lasting freshness in your home or celebration.'
  },
  {
    id: 'tulip-yellow',
    name: 'Golden Yellow Tulip Bouquet',
    tagline: 'Morning Sunshine Petals',
    flowerType: 'tulips',
    category: 'vibrant',
    price: 5400,
    image: 'Images/tulip-yellow.jpg',
    occasions: ['birthday', 'graduation', 'getwellsoon'],
    color: 'Bright Buttercup Yellow',
    meaning: 'Cheerful sunlight in your smile, prosperity, and radiant optimism.',
    season: 'Spring Harvest',
    stemLength: '45 cm',
    fragrance: 'Crisp Green Floral',
    description: 'Radiant golden tulips that open with the morning light, filling any room with joyful sunshine.'
  },
  {
    id: 'tulip-white',
    name: 'Pure White Tulip Bouquet',
    tagline: 'Crisp Spring Simplicity',
    flowerType: 'tulips',
    category: 'serene',
    price: 5400,
    image: 'Images/tulip-white.jpg',
    occasions: ['wedding', 'anniversary', 'thanksgiving'],
    color: 'Pure Snow White',
    meaning: 'Forgiveness, worthy honor, peace, and fresh clean beginnings.',
    season: 'Spring Harvest',
    stemLength: '45 cm',
    fragrance: 'Clean Fresh Petals',
    description: 'Statuesque white tulips wrapped in artisan parchment, symbolizing peaceful renewal and sincere affection.'
  },
  {
    id: 'tulip-red',
    name: 'Crimson Red Tulip Bouquet',
    tagline: 'Bold Romance & Passion',
    flowerType: 'tulips',
    category: 'romance',
    price: 5500,
    image: 'Images/tulip-red.jpg',
    occasions: ['wedding', 'anniversary', 'birthday'],
    color: 'Deep Crimson Red',
    meaning: 'Irrevocable passionate love, heart-to-heart commitment, and desire.',
    season: 'Spring Harvest',
    stemLength: '45 cm',
    fragrance: 'Sweet Velvet Blossom',
    description: 'Velvety crimson Dutch tulips that declare passionate love with timeless European elegance.'
  },

  // -------------------------------------------------------------
  // 4. LILIES (flowerType: 'lilies')
  // -------------------------------------------------------------
  {
    id: 'lily-white',
    name: 'Pure White Oriental Lily Bouquet',
    tagline: 'Pure Majestic Petals',
    flowerType: 'lilies',
    category: 'serene',
    price: 4200,
    image: 'Images/lily-white.jpg',
    occasions: ['wedding', 'anniversary', 'getwellsoon'],
    color: 'Ivory White & Blush',
    meaning: 'Purity of heart, rebirth, devotion, and tranquil peace.',
    season: 'All Year Harvest',
    stemLength: '60 cm',
    fragrance: 'Sweet & Intoxicating',
    description: 'Statuesque white lilies symbolizing serenity and refined honor, bringing a soothing presence to any room.'
  },
  {
    id: 'lily-stargazer',
    name: 'Pink Stargazer Lily Bouquet',
    tagline: 'Exotic Sweet Fragrance',
    flowerType: 'lilies',
    category: 'romance',
    price: 4500,
    image: 'Images/lily-stargazer.jpg',
    occasions: ['wedding', 'birthday', 'anniversary'],
    color: 'Vibrant Fuchsia & White Rim',
    meaning: 'Ambition, blossoming prosperity, and boundless romantic passion.',
    season: 'All Year Harvest',
    stemLength: '60 cm',
    fragrance: 'Rich Perfumed Floral',
    description: 'Dazzling oriental stargazers boasting deep magenta centers, speckled petals, and unforgettable perfume.'
  },
  {
    id: 'lily-casablanca',
    name: 'Royal Casablanca Lily Bouquet',
    tagline: 'Grand Architectural Blooms',
    flowerType: 'lilies',
    category: 'serene',
    price: 4600,
    image: 'Images/lily-casablanca.jpg',
    occasions: ['graduation', 'wedding', 'anniversary'],
    color: 'Porcelain White & Cream',
    meaning: 'Celebration of monumental achievements, noble devotion, and elegance.',
    season: 'All Year Harvest',
    stemLength: '65 cm',
    fragrance: 'Majestic Night Fragrance',
    description: 'The pinnacle of floral grandeur, Casablanca lilies open with expansive star-shaped white blossoms.'
  },

  // -------------------------------------------------------------
  // 5. ORCHIDS (flowerType: 'orchids')
  // -------------------------------------------------------------
  {
    id: 'orchid-white',
    name: 'White Phalaenopsis Orchid Bouquet',
    tagline: 'Exotic Phalaenopsis Stems',
    flowerType: 'orchids',
    category: 'serene',
    price: 5200,
    image: 'Images/orchid-white.jpg',
    occasions: ['wedding', 'anniversary', 'thanksgiving'],
    color: 'Porcelain White & Pale Yellow',
    meaning: 'Refined elegance, rare luxury, spiritual strength, and thoughtful esteem.',
    season: 'All Year Harvest',
    stemLength: '55 cm',
    fragrance: 'Subtle & Clean',
    description: 'Sculptural Phalaenopsis stems boasting remarkable longevity and contemporary architectural poise.'
  },
  {
    id: 'orchid-magenta',
    name: 'Imperial Magenta Orchid Bouquet',
    tagline: 'Royal Cascading Stems',
    flowerType: 'orchids',
    category: 'vibrant',
    price: 5400,
    image: 'Images/orchid-magenta.jpg',
    occasions: ['anniversary', 'birthday', 'graduation'],
    color: 'Vibrant Violet & Magenta',
    meaning: 'Sovereign luxury, admiration, charm, and unique brilliance.',
    season: 'All Year Harvest',
    stemLength: '55 cm',
    fragrance: 'Exotic Light Perfume',
    description: 'Showstopping magenta orchids with delicate petal patterns that captivate connoisseurs of rare botany.'
  },
  {
    id: 'orchid-dendrobium',
    name: 'Wild Dendrobium Orchid Spray',
    tagline: 'Graceful Tropical Sprays',
    flowerType: 'orchids',
    category: 'serene',
    price: 5000,
    image: 'Images/orchid-dendrobium.jpg',
    occasions: ['birthday', 'getwellsoon', 'thanksgiving'],
    color: 'Soft Lilac & White',
    meaning: 'Refinement, delicate exotic warmth, and enduring friendship.',
    season: 'Tropical All Year',
    stemLength: '50 cm',
    fragrance: 'Gentle Botanical Herb',
    description: 'Light, cascading dendrobium sprays evoking the breezy serenity of tropical rainforest sanctuaries.'
  },

  // -------------------------------------------------------------
  // 6. SUNFLOWERS (flowerType: 'sunflowers')
  // -------------------------------------------------------------
  {
    id: 'sunflower-golden',
    name: 'Golden Sunshine Sunflower Bouquet',
    tagline: 'Sun-Kissed Petals',
    flowerType: 'sunflowers',
    category: 'vibrant',
    price: 4100,
    image: 'Images/sunflower-golden.jpg',
    occasions: ['birthday', 'graduation', 'getwellsoon', 'thanksgiving'],
    color: 'Radiant Golden Yellow',
    meaning: 'Unwavering optimism, adoration, longevity, and vibrant joy.',
    season: 'Summer Harvest',
    stemLength: '50 cm',
    fragrance: 'Earthy Warmth',
    description: 'Vibrant, open-faced golden blooms radiating contagious happiness, warmth, and vitality.'
  },
  {
    id: 'sunflower-rustic',
    name: 'Rustic Meadow Sunflower Bouquet',
    tagline: 'Country Charm & Wheat Accents',
    flowerType: 'sunflowers',
    category: 'vibrant',
    price: 4300,
    image: 'Images/sunflower-rustic.jpg',
    occasions: ['thanksgiving', 'birthday', 'graduation'],
    color: 'Sun Gold, Amber & Green',
    meaning: 'Abundant harvest, warmth of home, and cheerful loyalty.',
    season: 'Summer to Autumn',
    stemLength: '50 cm',
    fragrance: 'Warm Hay & Earth',
    description: 'Lush golden sunflowers paired with golden wheat ears and dried seed pods for organic rustic charm.'
  },
  {
    id: 'sunflower-sunshine',
    name: 'Petite Sunshine Sunflower Bunch',
    tagline: 'Bright Smiles & Care',
    flowerType: 'sunflowers',
    category: 'vibrant',
    price: 3900,
    image: 'Images/sunflower-sunshine.jpg',
    occasions: ['getwellsoon', 'birthday'],
    color: 'Bright Lemon & Warm Honey',
    meaning: 'Instant cheer, speedy recovery, and uplifting good wishes.',
    season: 'Summer Harvest',
    stemLength: '45 cm',
    fragrance: 'Mild Natural Sunlight',
    description: 'Compact, cheerful sunflowers wrapped in craft paper to deliver an immediate burst of heartfelt joy.'
  },

  // -------------------------------------------------------------
  // 7. CARNATIONS (flowerType: 'carnations')
  // -------------------------------------------------------------
  {
    id: 'carnation-blush',
    name: 'Blush Pink Carnation Bouquet',
    tagline: 'Ruffled Garden Petals',
    flowerType: 'carnations',
    category: 'romance',
    price: 3800,
    image: 'Images/carnation-blush.jpg',
    occasions: ['thanksgiving', 'birthday', 'anniversary'],
    color: 'Blush Pink & Peach',
    meaning: 'Deep gratitude, maternal love, affection, and steadfast devotion.',
    season: 'All Year Harvest',
    stemLength: '45 cm',
    fragrance: 'Clove & Spicy Sweet',
    description: 'Intricately ruffled petals that express profound thankfulness, sweetness, and enduring beauty.'
  },
  {
    id: 'carnation-white',
    name: 'Snow White Carnation Bouquet',
    tagline: 'Innocence & Pure Devotion',
    flowerType: 'carnations',
    category: 'serene',
    price: 3800,
    image: 'Images/carnation-white.jpg',
    occasions: ['anniversary', 'wedding', 'thanksgiving'],
    color: 'Pure Snow White',
    meaning: 'Sweet remembrance, pure love, innocent wishes, and sincere fidelity.',
    season: 'All Year Harvest',
    stemLength: '45 cm',
    fragrance: 'Clean Clove Spice',
    description: 'Delicate ruffled white carnations that symbolize pure thoughts, steadfast faithfulness, and sweet good luck.'
  },
  {
    id: 'carnation-vintage',
    name: 'Vintage Burgundy Carnation Bouquet',
    tagline: 'Heritage Clove-Scented Blooms',
    flowerType: 'carnations',
    category: 'romance',
    price: 4000,
    image: 'Images/carnation-vintage.jpg',
    occasions: ['birthday', 'anniversary'],
    color: 'Burgundy & Spiced Rose',
    meaning: 'Deep affectionate longing, rich heritage, and distinctive admiration.',
    season: 'All Year Harvest',
    stemLength: '45 cm',
    fragrance: 'Spiced Floral Clove',
    description: 'Rich vintage-toned burgundy carnations delivering rich color depth and exceptional vase longevity.'
  },

  // -------------------------------------------------------------
  // 8. DAISIES (flowerType: 'daisies')
  // -------------------------------------------------------------
  {
    id: 'daisy-meadow',
    name: 'White Meadow Daisy Bouquet',
    tagline: 'Meadow Charm Stems',
    flowerType: 'daisies',
    category: 'vibrant',
    price: 4000,
    image: 'Images/daisy-meadow.jpg',
    occasions: ['birthday', 'graduation', 'getwellsoon'],
    color: 'Crisp White & Butter Gold',
    meaning: 'Innocence, fresh beginnings, joyful cheer, and loyal companionship.',
    season: 'Spring to Autumn',
    stemLength: '40 cm',
    fragrance: 'Light Herbal Fresh',
    description: 'Sunny meadow daisies celebrating simple pleasures, candid smiles, and heartfelt friendships.'
  },
  {
    id: 'daisy-gerbera',
    name: 'Vibrant Gerbera Daisy Bouquet',
    tagline: 'Bold Festive Color Wheel',
    flowerType: 'daisies',
    category: 'vibrant',
    price: 4200,
    image: 'Images/daisy-gerbera.jpg',
    occasions: ['birthday', 'graduation', 'getwellsoon'],
    color: 'Coral, Yellow, Pink & Amber',
    meaning: 'Unrestrained cheerfulness, celebratory victory, and youthful optimism.',
    season: 'All Year Harvest',
    stemLength: '45 cm',
    fragrance: 'Fresh Natural Green',
    description: 'Large, festive gerbera daisies in bold cheerful shades that energize any gathering.'
  },
  {
    id: 'daisy-chamomile',
    name: 'Chamomile & Field Daisy Bunch',
    tagline: 'Soothing Country Whisper',
    flowerType: 'daisies',
    category: 'serene',
    price: 3900,
    image: 'Images/daisy-chamomile.jpg',
    occasions: ['getwellsoon', 'thanksgiving'],
    color: 'Petite White & Sunny Yellow',
    meaning: 'Patience in adversity, gentle healing, and soothing peace.',
    season: 'Spring to Autumn',
    stemLength: '35 cm',
    fragrance: 'Herbal Apple & Tea',
    description: 'Dainty chamomile and field daisy blossoms that inspire calmness, comfort, and restorative rest.'
  },

  // -------------------------------------------------------------
  // 9. LAVENDER (flowerType: 'lavender')
  // -------------------------------------------------------------
  {
    id: 'lavender-provence',
    name: 'French Provence Lavender Bouquet',
    tagline: 'Aromatic French Stems',
    flowerType: 'lavender',
    category: 'serene',
    price: 4300,
    image: 'Images/lavender-provence.jpg',
    occasions: ['getwellsoon', 'anniversary', 'birthday', 'thanksgiving'],
    color: 'Soft Violet & Silver Sage',
    meaning: 'Calm spirit, quiet serenity, healing, and graceful tranquility.',
    season: 'All Year Harvest',
    stemLength: '40 cm',
    fragrance: 'Herbaceous & Calming Essential Oils',
    description: 'Aromatic sprigs that infuse living spaces with gentle soothing scent, available fresh or naturally dried.'
  },
  {
    id: 'lavender-english',
    name: 'English Herbal Lavender Bouquet',
    tagline: 'Fresh Garden Sprigs',
    flowerType: 'lavender',
    category: 'serene',
    price: 4400,
    image: 'Images/lavender-english.jpg',
    occasions: ['getwellsoon', 'birthday', 'thanksgiving'],
    color: 'Deep Royal Violet & Blue',
    meaning: 'Devotion, refined elegance, mental clarity, and sweet rest.',
    season: 'Summer Harvest',
    stemLength: '40 cm',
    fragrance: 'Sweet Floral Lavender',
    description: 'English garden lavender with dense flower spikes and deep aromatic fragrance.'
  },
  {
    id: 'lavender-bundle',
    name: 'Dried Violet Sanctuary Lavender Bundle',
    tagline: 'Everlasting Aromatic Tie',
    flowerType: 'lavender',
    category: 'serene',
    price: 3800,
    image: 'Images/lavender-bundle.jpg',
    occasions: ['anniversary', 'thanksgiving'],
    color: 'Muted Lavender & Herb Green',
    meaning: 'Constancy, soothing remembrance, and enduring fragrance.',
    season: 'Artisan Preserved',
    stemLength: '35 cm',
    fragrance: 'Concentrated Calming Aroma',
    description: 'Slow-dried aromatic bundle tied with raffia, retaining its therapeutic scent for months.'
  },

  // -------------------------------------------------------------
  // 10. MIXED FLOWER BOUQUETS (flowerType: 'mixed')
  // -------------------------------------------------------------
  {
    id: 'mixed-grand',
    name: 'Grand Masterpiece Bouquet (All in one)',
    tagline: 'Grand Masterpiece Arrangement',
    flowerType: 'mixed',
    category: 'romance',
    price: 6000,
    image: 'Images/mixed-grand.jpg',
    occasions: ['wedding', 'anniversary', 'graduation', 'birthday'],
    color: 'Harmonious Blush & Pastel Mix',
    meaning: 'The complete celebration of love, unity, abundance, and joyous milestones.',
    season: 'Curated Daily',
    stemLength: '60 cm',
    fragrance: 'Multi-Floral Symphony',
    description: 'Our premier signature composition combining roses, lilies, carnations, and rare foliage in a luxurious hand-tied arrangement.'
  },
  {
    id: 'mixed-pastel',
    name: 'Pastel Elegance Garden Bouquet',
    tagline: 'Romantic Meadow Composition',
    flowerType: 'mixed',
    category: 'romance',
    price: 5800,
    image: 'Images/mixed-pastel.jpg',
    occasions: ['wedding', 'anniversary', 'birthday', 'thanksgiving'],
    color: 'Dusty Rose, Cream & Sage',
    meaning: 'Understated luxury, gentle gratitude, and poetic beauty for life\'s tender moments.',
    season: 'Curated Daily',
    stemLength: '55 cm',
    fragrance: 'Delicate Meadow Perfume',
    description: 'Artfully composed pastel roses, ranunculus, and silver eucalyptus reflecting timeless botanical grace and soft romance.'
  },
  {
    id: 'mixed-sunset',
    name: 'Sunset Romance Mixed Bouquet',
    tagline: 'Warm Coral & Dusk Hues',
    flowerType: 'mixed',
    category: 'vibrant',
    price: 5900,
    image: 'Images/mixed-sunset.jpg',
    occasions: ['anniversary', 'wedding', 'birthday'],
    color: 'Coral, Peach, Amber & Rose',
    meaning: 'Passionate sunset confessions, celebration of life, and heartfelt admiration.',
    season: 'Curated Daily',
    stemLength: '55 cm',
    fragrance: 'Sweet Citrus & Garden Bloom',
    description: 'A vibrant twilight blend of coral roses, golden spray daisies, and sunset carnations.'
  },
  {
    id: 'mixed-wildflower',
    name: 'Wildflower Meadow Harmony Bouquet',
    tagline: 'Bohemian Garden Whimsy',
    flowerType: 'mixed',
    category: 'vibrant',
    price: 5500,
    image: 'Images/mixed-wildflower.jpg',
    occasions: ['birthday', 'graduation', 'getwellsoon'],
    color: 'Multi-Floral Meadow Hues',
    meaning: 'Freedom, joyful spontaneity, organic beauty, and radiant spirits.',
    season: 'Seasonal Harvest',
    stemLength: '50 cm',
    fragrance: 'Wild Meadow Flora',
    description: 'Artisanal hand-gathered wildflowers, lavender stems, daisies, and delicate seedheads.'
  },

  // -------------------------------------------------------------
  // 11. ADDITIONAL SIGNATURE BOTANICALS
  // -------------------------------------------------------------
  {
    id: 'anthurium',
    name: 'Tropical Heart Anthurium Bouquet',
    tagline: 'Tropical Heart Silhouette',
    flowerType: 'other',
    category: 'vibrant',
    price: 4000,
    image: 'Images/Anthurium.jpg',
    occasions: ['getwellsoon', 'birthday', 'thanksgiving'],
    color: 'Bold Coral & Pink',
    meaning: 'Warm hospitality, enduring friendship, resilience, and boundless abundance.',
    season: 'Tropical Year-Round',
    stemLength: '45 cm',
    fragrance: 'Mild Natural Green',
    description: 'Glossy heart-shaped exotic spathes that exude modern tropical warmth and unwavering longevity.'
  },
  {
    id: 'dahlias',
    name: 'Geometric Dahlia Bouquet',
    tagline: 'Intricate Geometric Petals',
    flowerType: 'other',
    category: 'vibrant',
    price: 4500,
    image: 'Images/Dahlias.jpeg',
    occasions: ['anniversary', 'wedding', 'birthday', 'thanksgiving'],
    color: 'Burgundy & Soft Coral',
    meaning: 'Inner strength, dignity, graceful balance, and everlasting commitment.',
    season: 'Late Summer to Autumn',
    stemLength: '50 cm',
    fragrance: 'Soft Herbaceous',
    description: 'Hypnotic geometric symmetry of layered petals that capture admiration and refined artistic flair.'
  }
];

/* Helper to get flower by ID with legacy alias support */
function getFlowerById(id) {
  if (!id) return null;
  const direct = FLORAL_CATALOG.find(f => f.id === id);
  if (direct) return direct;
  
  // Legacy aliases
  const aliasMap = {
    'rose': 'rose-red',
    'tulip': 'tulip-pink',
    'lotus': 'lotus-pink',
    'lily': 'lily-white',
    'orchid': 'orchid-white',
    'sunflower': 'sunflower-golden',
    'carnation': 'carnation-blush',
    'daisy': 'daisy-meadow',
    'lavender': 'lavender-provence',
    'all-in-one': 'mixed-grand'
  };
  if (aliasMap[id]) {
    return FLORAL_CATALOG.find(f => f.id === aliasMap[id]) || null;
  }
  return null;
}

/* ==========================================================================
   2. Smart Wishlist Management (LocalStorage)
   ========================================================================== */
const WISHLIST_STORAGE_KEY = 'floral_delight_wishlist';

function getWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading wishlist from localStorage:', e);
    return [];
  }
}

function saveWishlist(items) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    updateWishlistNavBadge();
  } catch (e) {
    console.error('Error saving wishlist to localStorage:', e);
  }
}

function isWishlisted(flowerId) {
  const list = getWishlist();
  return list.includes(flowerId);
}

function toggleWishlist(flowerId) {
  let list = getWishlist();
  const flower = getFlowerById(flowerId);
  const flowerName = flower ? flower.name : 'Flower';
  let isNowAdded = false;

  if (list.includes(flowerId)) {
    list = list.filter(id => id !== flowerId);
    isNowAdded = false;
    showToast(`Removed ${flowerName} from Wishlist`, 'fa-heart-crack');
  } else {
    list.push(flowerId);
    isNowAdded = true;
    showToast(`Added ${flowerName} to Wishlist! 🌸`, 'fa-heart');
  }

  saveWishlist(list);
  updateWishlistButtons(flowerId, isNowAdded);
  return isNowAdded;
}

function updateWishlistNavBadge() {
  const count = getWishlist().length;
  document.querySelectorAll('.wishlist-count-badge').forEach(badge => {
    badge.textContent = count;
    badge.style.transform = 'scale(1.25)';
    setTimeout(() => {
      badge.style.transform = 'scale(1)';
    }, 200);
  });
}

function updateWishlistButtons(flowerId, isAdded) {
  document.querySelectorAll(`[data-wishlist-id="${flowerId}"]`).forEach(btn => {
    if (isAdded) {
      btn.classList.add('active');
      btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
      btn.setAttribute('aria-label', 'Remove from Wishlist');
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
      btn.setAttribute('aria-label', 'Add to Wishlist');
    }
  });
}

/* ==========================================================================
   3. Toast Notification System
   ========================================================================== */
function showToast(message, iconClass = 'fa-circle-check') {
  let toast = document.querySelector('.floral-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'floral-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
  toast.classList.add('show');

  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

/* ==========================================================================
   4. Global Header, Navigation & Back-to-Top Handlers
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileNav();
  initBackToTop();
  updateWishlistNavBadge();

  // Cross-tab storage synchronization
  window.addEventListener('storage', (e) => {
    if (e.key === WISHLIST_STORAGE_KEY) {
      updateWishlistNavBadge();
    }
  });
});

function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (!toggleBtn || !mobileNav) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
    toggleBtn.innerHTML = isOpen 
      ? '<i class="fa-solid fa-xmark"></i>' 
      : '<i class="fa-solid fa-bars"></i>';
  });

  mobileNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });
  });
}

function initBackToTop() {
  const backToTopBtn = document.querySelector('.back-to-top-btn');
  if (!backToTopBtn) return;

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

