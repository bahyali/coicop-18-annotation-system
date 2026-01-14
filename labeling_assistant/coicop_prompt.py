#!/usr/bin/env python3
"""
COICOP 2018 Classification - Improved Version with Better Arabic Support
"""

# Valid COICOP codes - extracted from official COICOP 2018
VALID_CODES = {
    # 01.1.1 - Cereals
    "01.1.1.1": "Cereals (rice, wheat, barley)",
    "01.1.1.2": "Flour",
    "01.1.1.3": "Bread and bakery products",
    "01.1.1.4": "Breakfast cereals (cornflakes, oats)",
    "01.1.1.5": "Pasta, noodles, couscous",
    "01.1.1.9": "Other cereal products",

    # 01.1.2 - Meat
    "01.1.2.1": "Live animals for food",
    "01.1.2.2": "Fresh/frozen meat",
    "01.1.2.3": "Dried/smoked meat",
    "01.1.2.4": "Offal",
    "01.1.2.5": "Meat preparations (sausage, burger)",

    # 01.1.3 - Fish/Seafood
    "01.1.3.1": "Fresh/frozen fish",
    "01.1.3.2": "Dried/smoked fish",
    "01.1.3.3": "Canned fish (tuna)",
    "01.1.3.4": "Fresh seafood (shrimp)",
    "01.1.3.5": "Dried seafood",
    "01.1.3.6": "Seafood preparations",
    "01.1.3.7": "Fish roe/offal",

    # 01.1.4 - Dairy/Eggs
    "01.1.4.1": "Whole milk",
    "01.1.4.2": "Skimmed milk",
    "01.1.4.3": "Cream, powdered milk",
    "01.1.4.4": "Non-dairy milk (almond, soy)",
    "01.1.4.5": "Cheese",
    "01.1.4.6": "Yoghurt, laban",
    "01.1.4.7": "Milk desserts/beverages",
    "01.1.4.8": "Eggs",

    # 01.1.5 - Oils/Fats
    "01.1.5.1": "Butter",
    "01.1.5.2": "Margarine",
    "01.1.5.3": "Olive oil",
    "01.1.5.4": "Other edible oils",
    "01.1.5.5": "Other edible fats",

    # 01.1.6 - Fruits
    "01.1.6.1": "Fresh/chilled citrus",
    "01.1.6.2": "Bananas",
    "01.1.6.3": "Apples",
    "01.1.6.4": "Stone fruits",
    "01.1.6.5": "Berries",
    "01.1.6.6": "Other fresh fruits",
    "01.1.6.7": "Dried fruits, dates",
    "01.1.6.8": "Nuts",
    "01.1.6.9": "Preserved fruits",

    # 01.1.7 - Vegetables
    "01.1.7.1": "Leafy vegetables",
    "01.1.7.2": "Brassicas (cabbage)",
    "01.1.7.3": "Tomatoes",
    "01.1.7.4": "Other fruiting vegetables",
    "01.1.7.5": "Root vegetables (carrots, potatoes)",
    "01.1.7.6": "Onions, garlic",
    "01.1.7.7": "Beans, peas",
    "01.1.7.8": "Other fresh vegetables",
    "01.1.7.9": "Preserved/dried vegetables",

    # 01.1.8 - Sugar/Sweets
    "01.1.8.1": "Sugar",
    "01.1.8.2": "Jams, marmalades",
    "01.1.8.3": "Honey",
    "01.1.8.4": "Chocolate",
    "01.1.8.5": "Confectionery, candy",
    "01.1.8.6": "Ice cream",
    "01.1.8.9": "Other sweets",

    # 01.1.9 - Ready-made food
    "01.1.9.1": "Ready-made meals",
    "01.1.9.2": "Baby food",
    "01.1.9.3": "Sauces, condiments",
    "01.1.9.4": "Salt, spices",
    "01.1.9.9": "Other food products",

    # 01.2 - Non-alcoholic beverages
    "01.2.1.1": "Mineral water",
    "01.2.1.2": "Soft drinks",
    "01.2.1.3": "Fruit juices",
    "01.2.1.4": "Vegetable juices",
    "01.2.2.1": "Coffee",
    "01.2.2.2": "Tea",
    "01.2.2.3": "Cocoa drinks",
    "01.2.2.9": "Other beverages",

    # 02 - Alcoholic/Tobacco
    "02.1.1.1": "Spirits",
    "02.1.2.1": "Wine",
    "02.1.3.1": "Beer",
    "02.2.0.0": "Tobacco",
    "02.3.0.0": "Narcotics",

    # 03 - Clothing
    "03.1.1.1": "Men's clothing",
    "03.1.1.2": "Women's clothing",
    "03.1.1.3": "Children's clothing",
    "03.1.2.1": "Men's garments",
    "03.1.2.2": "Women's garments",
    "03.1.2.3": "Children's garments",
    "03.1.3.1": "Clothing accessories",
    "03.1.4.1": "Cleaning of clothing",
    "03.2.1.1": "Men's footwear",
    "03.2.1.2": "Women's footwear",
    "03.2.1.3": "Children's footwear",
    "03.2.2.1": "Repair of footwear",

    # 04 - Housing
    "04.1.1.1": "Rent for housing",
    "04.1.2.1": "Other rentals",
    "04.3.1.1": "Materials for maintenance",
    "04.3.2.1": "Services for maintenance",
    "04.4.1.1": "Water supply",
    "04.4.2.1": "Refuse collection",
    "04.4.3.1": "Sewage collection",
    "04.5.1.1": "Electricity",
    "04.5.2.1": "Gas",
    "04.5.3.1": "Liquid fuels",
    "04.5.4.1": "Solid fuels",
    "04.5.5.1": "Heat energy",

    # 05 - Furniture/Household
    "05.1.1.1": "Kitchen furniture",
    "05.1.1.2": "Bedroom furniture",
    "05.1.1.3": "Living room furniture",
    "05.1.1.4": "Other furniture",
    "05.2.1.1": "Carpets",
    "05.2.1.2": "Other floor coverings",
    "05.3.1.1": "Refrigerators/freezers",
    "05.3.1.2": "Washing machines",
    "05.3.1.3": "Dishwashers",
    "05.3.1.4": "Cookers, ovens",
    "05.3.1.5": "Air conditioners",
    "05.3.1.9": "Other major appliances",
    "05.3.2.1": "Small electric appliances",
    "05.4.1.1": "Glassware, tableware",
    "05.5.1.1": "Power tools",
    "05.5.2.1": "Other tools",
    "05.6.1.1": "Household textiles",
    "05.6.2.1": "Cleaning products",

    # 06 - Health
    "06.1.1.1": "Pharmaceutical products",
    "06.1.2.1": "Other medical products",
    "06.1.3.1": "Therapeutic appliances",
    "06.2.1.1": "Medical services",
    "06.2.2.1": "Dental services",
    "06.2.3.1": "Paramedical services",
    "06.3.1.1": "Hospital services",

    # 07 - Transport
    "07.1.1.1": "New motor cars",
    "07.1.1.2": "Used motor cars",
    "07.1.2.1": "Motor cycles",
    "07.1.3.1": "Bicycles",
    "07.1.4.1": "Animal drawn vehicles",
    "07.2.1.1": "Spare parts",
    "07.2.2.1": "Fuels and lubricants",
    "07.2.3.1": "Maintenance and repair",
    "07.2.4.1": "Other vehicle services",
    "07.3.1.1": "Passenger transport by railway",
    "07.3.2.1": "Passenger transport by road",
    "07.3.3.1": "Passenger transport by air",
    "07.3.4.1": "Passenger transport by sea",

    # 08 - Communications
    "08.1.1.1": "Postal services",
    "08.2.1.1": "Telephone equipment",
    "08.3.1.1": "Telephone services",

    # 09 - Recreation/Culture
    "09.1.1.1": "Audio/video equipment",
    "09.1.2.1": "Photographic equipment",
    "09.1.3.1": "Data processing equipment",
    "09.1.4.1": "Recording media",
    "09.2.1.1": "Games and toys",
    "09.2.2.1": "Sports equipment",
    "09.3.1.1": "Garden products",
    "09.3.2.1": "Pets and pet food",
    "09.4.1.1": "Recreational services",
    "09.4.2.1": "Cultural services",
    "09.5.1.1": "Newspapers",
    "09.5.2.1": "Books",
    "09.5.3.1": "Other printed matter",
    "09.5.4.1": "Stationery",
    "09.6.1.1": "Package holidays",

    # 10 - Education
    "10.1.1.1": "Pre-primary education",
    "10.2.1.1": "Primary education",
    "10.3.1.1": "Secondary education",
    "10.4.1.1": "Tertiary education",
    "10.5.1.1": "Other education",

    # 11 - Restaurants/Hotels
    "11.1.1.1": "Restaurants/cafes",
    "11.1.1.2": "Fast food",
    "11.1.2.1": "Canteens",
    "11.2.1.1": "Hotels",
    "11.2.1.2": "Other accommodation",

    # 12 - Insurance/Financial
    "12.1.1.1": "Life insurance",
    "12.1.2.1": "Home insurance",
    "12.1.3.1": "Health insurance",
    "12.1.4.1": "Transport insurance",
    "12.5.1.1": "Financial services",

    # 13 - Personal Care
    "13.1.1.1": "Hairdressing",
    "13.1.2.1": "Personal grooming",
    "13.1.3.1": "Personal care appliances",
    "13.2.1.1": "Jewelry and watches",
    "13.2.2.1": "Other personal effects",
    "13.3.1.1": "Social protection",
    "13.9.1.1": "Other personal services",
}


def quick_classify(description: str) -> tuple:
    """Quick classification using comprehensive keyword matching for Arabic products"""
    desc = description.lower()

    # ===== HIGHEST PRIORITY: Specific brand/product patterns =====

    # Books and Educational Materials - CHECK FIRST
    book_patterns = [
        "كتاب", "book", "مجلد", "قصة", "رواية", "novel", "story",
        "pathways", "ready for life", "step into science",
        "عظماء", "تحصيل", "منهج", "دراسي", "textbook",
        "r/w", "l/s", "epin",  # Educational book markers
    ]
    for p in book_patterns:
        if p in desc:
            return "09.7.1.9", 0.95  # Other books

    # Stationery
    stationery_patterns = [
        "قلم", "اقلام", "pen", "pencil", "مسطرة", "مسطره", "ruler",
        "كراسة", "كراسه", "دفتر", "notebook", "ممحاة", "eraser",
        "مقص", "scissors", "لاصق", "tape", "glue", "صمغ",
        "ملف", "folder", "file", "أوراق", "papers",
    ]
    for p in stationery_patterns:
        if p in desc:
            return "09.7.4.0", 0.95  # Stationery and drawing materials

    # Jewelry - سلسال, خاتم, ذهب
    jewelry_patterns = [
        "سلسال", "سلسله", "necklace", "chain",
        "خاتم", "ring", "ذهب", "gold", "فضة", "silver",
        "مجوهرات", "jewelry", "jewel", "اكسسوار",
        "حلق", "earring", "سوار", "bracelet",
    ]
    for p in jewelry_patterns:
        if p in desc:
            return "13.2.1.1", 0.95

    # Newspapers/Magazines - صحيفة
    news_patterns = [
        "صحيفة", "صحيفه", "جريدة", "جريده", "newspaper",
        "مجلة", "مجله", "magazine", "أخبار", "اخبار", "news",
        "تغريدات", "الاقتصادية",
    ]
    for p in news_patterns:
        if p in desc:
            return "09.7.2.1", 0.95  # Newspapers

    # Electronic Books/E-readers
    if "كتاب الكتروني" in desc or "ebook" in desc or "e-book" in desc:
        return "09.7.1.9", 0.95  # Other books

    # ===== CARS - Very important =====
    car_patterns = [
        "سيارة", "سياره", "car", "vehicle",
        "تويوتا", "toyota", "كامري", "camry", "كورولا", "corolla",
        "هيونداي", "hyundai", "النترا", "elantra", "سوناتا", "sonata",
        "نيسان", "nissan", "باترول", "patrol", "صني", "sunny",
        "فورد", "ford", "اكسبديشن", "expedition",
        "شيفروليه", "chevrolet", "كابريس", "caprice",
        "هوندا", "honda", "اكورد", "accord",
        "كيا", "kia", "سيراتو", "cerato",
        "مازدا", "mazda", "لكزس", "lexus",
        "بي ام", "bmw", "مرسيدس", "mercedes", "بنز",
        "جيب", "jeep", "لاندكروزر", "land cruiser",
        "شانجان", "changan", "ام جي", "mg5", "mg 5",
        "ايسوزو", "isuzu", "دينا", "ديناء",
        "جمس", "gmc", "تاهو", "tahoe",
    ]
    for p in car_patterns:
        if p in desc:
            return "07.1.1.2", 0.95

    # ===== TOBACCO =====
    tobacco_patterns = [
        "سجائر", "سجاير", "cigarette", "دخان",
        "مارلبورو", "marlboro", "دنهل", "dunhill",
        "بال مال", "pall mall", "تبغ", "tobacco",
        "شيشة", "شيشه", "معسل",
    ]
    for p in tobacco_patterns:
        if p in desc:
            return "02.2.0.0", 0.95

    # ===== FOOD CATEGORIES =====

    # Fish/Seafood (check before meat)
    fish_patterns = [
        "تونا", "تونه", "tuna", "سمك", "fish",
        "جمبري", "روبيان", "shrimp", "prawn",
        "سالمون", "salmon", "فيليه سمك",
    ]
    for p in fish_patterns:
        if p in desc:
            return "01.1.3.3", 0.92

    # Vegetables (check eggplant before egg)
    veg_patterns = {
        "باذنجان": "01.1.7.4",
        "eggplant": "01.1.7.4",
        "طماطم": "01.1.7.3",
        "tomato": "01.1.7.3",
        "بندورة": "01.1.7.3",
        "جزر": "01.1.7.5",
        "carrot": "01.1.7.5",
        "بطاطس": "01.1.7.5",
        "بطاطا": "01.1.7.5",
        "potato": "01.1.7.5",
        "خيار": "01.1.7.4",
        "cucumber": "01.1.7.4",
        "فلفل": "01.1.7.4",
        "pepper": "01.1.7.4",
        "بصل": "01.1.7.6",
        "onion": "01.1.7.6",
        "ثوم": "01.1.7.6",
        "garlic": "01.1.7.6",
        "كوسا": "01.1.7.4",
        "zucchini": "01.1.7.4",
        "فاصوليا": "01.1.7.7",
        "bean": "01.1.7.7",
        "بازلاء": "01.1.7.7",
        "peas": "01.1.7.7",
        "ذرة": "01.1.7.8",
        "corn": "01.1.7.8",
        "خس": "01.1.7.1",
        "lettuce": "01.1.7.1",
        "ملفوف": "01.1.7.2",
        "cabbage": "01.1.7.2",
        "سبانخ": "01.1.7.1",
        "spinach": "01.1.7.1",
        "بقدونس": "01.1.7.1",
        "parsley": "01.1.7.1",
        "خضار": "01.1.7.8",
        "vegetable": "01.1.7.8",
    }
    for keyword, code in veg_patterns.items():
        if keyword in desc:
            return code, 0.92

    # Fruits
    fruit_patterns = {
        "تفاح": "01.1.6.3",
        "apple": "01.1.6.3",
        "موز": "01.1.6.2",
        "banana": "01.1.6.2",
        "برتقال": "01.1.6.1",
        "orange": "01.1.6.1",
        "ليمون": "01.1.6.1",
        "lemon": "01.1.6.1",
        "عنب": "01.1.6.6",
        "grape": "01.1.6.6",
        "تمر": "01.1.6.7",
        "date": "01.1.6.7",
        "رطب": "01.1.6.7",
        "مانجو": "01.1.6.6",
        "mango": "01.1.6.6",
        "فراولة": "01.1.6.5",
        "strawberry": "01.1.6.5",
        "توت": "01.1.6.5",
        "berry": "01.1.6.5",
        "blueberry": "01.1.6.5",
        "خوخ": "01.1.6.4",
        "peach": "01.1.6.4",
        "مشمش": "01.1.6.4",
        "apricot": "01.1.6.4",
        "كيوي": "01.1.6.6",
        "kiwi": "01.1.6.6",
        "بطيخ": "01.1.6.6",
        "melon": "01.1.6.6",
        "watermelon": "01.1.6.6",
        "شمام": "01.1.6.6",
        "أناناس": "01.1.6.6",
        "pineapple": "01.1.6.6",
        "لوز": "01.1.6.8",
        "almond": "01.1.6.8",
        "جوز": "01.1.6.8",
        "walnut": "01.1.6.8",
        "فستق": "01.1.6.8",
        "pistachio": "01.1.6.8",
        "كاجو": "01.1.6.8",
        "cashew": "01.1.6.8",
        "فواكه": "01.1.6.6",
        "fruit": "01.1.6.6",
    }
    for keyword, code in fruit_patterns.items():
        if keyword in desc:
            return code, 0.90

    # Sugar/Sweets/Chocolate
    sweet_patterns = {
        "شوكولا": "01.1.8.4",
        "شكولا": "01.1.8.4",
        "chocolate": "01.1.8.4",
        "جالكسي": "01.1.8.4",
        "galaxy": "01.1.8.4",
        "سنيكرز": "01.1.8.4",
        "snickers": "01.1.8.4",
        "كيت كات": "01.1.8.4",
        "kitkat": "01.1.8.4",
        "تويكس": "01.1.8.4",
        "twix": "01.1.8.4",
        "كندر": "01.1.8.4",
        "kinder": "01.1.8.4",
        "سكر": "01.1.8.1",
        "sugar": "01.1.8.1",
        "عسل": "01.1.8.3",
        "honey": "01.1.8.3",
        "مربى": "01.1.8.2",
        "jam": "01.1.8.2",
        "حلوى": "01.1.8.5",
        "candy": "01.1.8.5",
        "حلاوة": "01.1.8.5",
        "مارشملو": "01.1.8.5",
        "marshmallow": "01.1.8.5",
        "ايس كريم": "01.1.8.6",
        "ice cream": "01.1.8.6",
        "بوظة": "01.1.8.6",
        "آيس كريم": "01.1.8.6",
    }
    for keyword, code in sweet_patterns.items():
        if keyword in desc:
            return code, 0.90

    # Cereals/Bread
    cereal_patterns = {
        "خبز": "01.1.1.3",
        "bread": "01.1.1.3",
        "صامولي": "01.1.1.3",
        "توست": "01.1.1.3",
        "toast": "01.1.1.3",
        "كعك": "01.1.1.3",
        "cake": "01.1.1.3",
        "معجنات": "01.1.1.3",
        "pastry": "01.1.1.3",
        "لوزين": "01.1.1.3",
        "بسكويت": "01.1.1.3",
        "biscuit": "01.1.1.3",
        "biscot": "01.1.1.3",
        "كورن فليكس": "01.1.1.4",
        "cornflakes": "01.1.1.4",
        "cereal": "01.1.1.4",
        "شوفان": "01.1.1.4",
        "oat": "01.1.1.4",
        "أرز": "01.1.1.1",
        "ارز": "01.1.1.1",
        "rice": "01.1.1.1",
        "معكرونة": "01.1.1.5",
        "مكرونة": "01.1.1.5",
        "pasta": "01.1.1.5",
        "noodle": "01.1.1.5",
        "اندومي": "01.1.1.5",
        "indomie": "01.1.1.5",
        "دقيق": "01.1.1.2",
        "flour": "01.1.1.2",
        "برغل": "01.1.1.1",
        "bulgur": "01.1.1.1",
    }
    for keyword, code in cereal_patterns.items():
        if keyword in desc:
            return code, 0.90

    # Meat/Poultry
    meat_patterns = {
        "دجاج": "01.1.2.2",
        "chicken": "01.1.2.2",
        "فراخ": "01.1.2.2",
        "لحم": "01.1.2.2",
        "meat": "01.1.2.2",
        "beef": "01.1.2.2",
        "لحمة": "01.1.2.2",
        "غنم": "01.1.2.2",
        "lamb": "01.1.2.2",
        "ضأن": "01.1.2.2",
        "خروف": "01.1.2.2",
        "مفروم": "01.1.2.2",
        "minced": "01.1.2.2",
        "برجر": "01.1.2.5",
        "burger": "01.1.2.5",
        "همبرجر": "01.1.2.5",
        "hamburger": "01.1.2.5",
        "سجق": "01.1.2.5",
        "سوسيج": "01.1.2.5",
        "sausage": "01.1.2.5",
        "نقانق": "01.1.2.5",
        "ستربس": "01.1.2.5",
        "strips": "01.1.2.5",
        "ناجتس": "01.1.2.5",
        "nuggets": "01.1.2.5",
        "شاورما": "01.1.2.5",
    }
    for keyword, code in meat_patterns.items():
        if keyword in desc:
            return code, 0.90

    # Dairy/Milk - حليب، لبن، جبن
    dairy_patterns = {
        "حليب": "01.1.4.1",
        "milk": "01.1.4.1",
        "لبن": "01.1.4.6",
        "laban": "01.1.4.6",
        "المراعي": "01.1.4.1",
        "almarai": "01.1.4.1",
        "نادك": "01.1.4.1",
        "nadec": "01.1.4.1",
        "جبن": "01.1.4.5",
        "جبنة": "01.1.4.5",
        "cheese": "01.1.4.5",
        "زبادي": "01.1.4.6",
        "روب": "01.1.4.6",
        "yogurt": "01.1.4.6",
        "yoghurt": "01.1.4.6",
        "قشطة": "01.1.4.3",
        "cream": "01.1.4.3",
        "كريمة": "01.1.4.3",
        "لبنة": "01.1.4.6",
        "زبدة": "01.1.5.1",
        "butter": "01.1.5.1",
    }
    for keyword, code in dairy_patterns.items():
        if keyword in desc:
            return code, 0.90

    # Eggs (check after eggplant)
    if ("بيض" in desc and "باذنجان" not in desc) or ("egg" in desc and "eggplant" not in desc):
        return "01.1.4.8", 0.90

    # Oils
    oil_patterns = {
        "زيت زيتون": "01.1.5.3",
        "olive oil": "01.1.5.3",
        "زيت": "01.1.5.4",
        "oil": "01.1.5.4",
        "سمن": "01.1.5.5",
        "ghee": "01.1.5.5",
    }
    for keyword, code in oil_patterns.items():
        if keyword in desc:
            return code, 0.88

    # ===== BEVERAGES =====

    # Soft drinks
    soft_drink_patterns = [
        "بيبسي", "pepsi", "كولا", "cola", "coca",
        "سفن أب", "سفن اب", "7up", "7-up",
        "سبرايت", "sprite", "ميرندا", "mirinda",
        "فانتا", "fanta", "ماونتن ديو", "mountain dew",
        "مشروب طاقة", "ريد بول", "red bull", "energy",
    ]
    for p in soft_drink_patterns:
        if p in desc:
            return "01.2.1.2", 0.92

    # Juices
    juice_patterns = ["عصير", "juice", "نكتار", "nectar"]
    for p in juice_patterns:
        if p in desc:
            return "01.2.1.3", 0.90

    # Water/Malt
    water_patterns = [
        "ماء", "مياه", "water", "مويه",
        "موسي", "moussy", "بربيكان", "barbican", "هولستن", "holsten",
    ]
    for p in water_patterns:
        if p in desc:
            return "01.2.1.1", 0.90

    # Coffee
    coffee_patterns = ["قهوة", "قهوه", "coffee", "نسكافيه", "nescafe", "اسبريسو", "espresso"]
    for p in coffee_patterns:
        if p in desc:
            return "01.2.2.1", 0.90

    # Tea
    tea_patterns = ["شاي", "شاهي", "tea", "ليبتون", "lipton"]
    for p in tea_patterns:
        if p in desc:
            return "01.2.2.2", 0.90

    # ===== CLOTHING =====
    clothing_patterns = {
        "فستان": "03.1.2.2",
        "dress": "03.1.2.2",
        "قميص": "03.1.2.1",
        "shirt": "03.1.2.1",
        "بنطلون": "03.1.2.1",
        "pants": "03.1.2.1",
        "بلوزة": "03.1.2.2",
        "blouse": "03.1.2.2",
        "عباية": "03.1.2.2",
        "abaya": "03.1.2.2",
        "ثوب": "03.1.2.1",
        "شماغ": "03.1.3.1",
        "غترة": "03.1.3.1",
        "طاقية": "03.1.3.1",
        "ملابس": "03.1.2.1",
        "clothes": "03.1.2.1",
        "جاكيت": "03.1.2.1",
        "jacket": "03.1.2.1",
        "بجامة": "03.1.2.1",
        "pajama": "03.1.2.1",
    }
    for keyword, code in clothing_patterns.items():
        if keyword in desc:
            return code, 0.88

    # Footwear
    footwear_patterns = [
        "حذاء", "shoe", "جزمة", "جزمه", "boot",
        "صندل", "sandal", "نعال", "slipper",
        "رياضي", "sneaker", "نايك", "nike", "اديداس", "adidas",
    ]
    for p in footwear_patterns:
        if p in desc:
            return "03.2.1.1", 0.88

    # ===== APPLIANCES =====
    appliance_patterns = {
        "مكيف": "05.3.1.5",
        "air conditioner": "05.3.1.5",
        "ثلاجة": "05.3.1.1",
        "refrigerator": "05.3.1.1",
        "fridge": "05.3.1.1",
        "غسالة": "05.3.1.2",
        "washing machine": "05.3.1.2",
        "فرن": "05.3.1.4",
        "oven": "05.3.1.4",
        "ميكرويف": "05.3.1.4",
        "microwave": "05.3.1.4",
        "خلاط": "05.3.2.1",
        "blender": "05.3.2.1",
        "مكنسة": "05.3.2.1",
        "vacuum": "05.3.2.1",
    }
    for keyword, code in appliance_patterns.items():
        if keyword in desc:
            return code, 0.88

    # ===== ELECTRONICS =====
    electronics_patterns = {
        "تلفزيون": "09.1.1.1",
        "تلفاز": "09.1.1.1",
        "tv": "09.1.1.1",
        "television": "09.1.1.1",
        "كمبيوتر": "09.1.3.1",
        "computer": "09.1.3.1",
        "لابتوب": "09.1.3.1",
        "laptop": "09.1.3.1",
        "جوال": "08.2.1.1",
        "موبايل": "08.2.1.1",
        "mobile": "08.2.1.1",
        "phone": "08.2.1.1",
        "ايفون": "08.2.1.1",
        "iphone": "08.2.1.1",
        "سامسونج": "08.2.1.1",
        "samsung": "08.2.1.1",
        "هواوي": "08.2.1.1",
        "huawei": "08.2.1.1",
        "كاميرا": "09.1.2.1",
        "camera": "09.1.2.1",
    }
    for keyword, code in electronics_patterns.items():
        if keyword in desc:
            return code, 0.88

    # ===== TOYS =====
    toy_patterns = [
        "لعبة", "لعبه", "toy", "العاب", "ألعاب",
        "game", "بلايستيشن", "playstation", "اكس بوكس", "xbox",
    ]
    for p in toy_patterns:
        if p in desc:
            return "09.2.1.1", 0.88

    # ===== HEALTH/MEDICINE =====
    health_patterns = [
        "دواء", "علاج", "medicine", "medication",
        "حبوب", "pills", "كبسولات", "capsule",
        "قطرة", "drops", "شراب", "syrup",
        "فيتامين", "vitamin", "مسكن", "painkiller",
    ]
    for p in health_patterns:
        if p in desc:
            return "06.1.1.1", 0.88

    # ===== HOTEL/RESTAURANT =====
    if "فندق" in desc or "hotel" in desc or "إقامة" in desc or "اقامة" in desc or "accommodation" in desc:
        return "11.2.0.1", 0.90  # Hotels, motels

    if "مطعم" in desc or "restaurant" in desc or "وجبة" in desc:
        return "11.1.1.2", 0.90  # Fast food/restaurants

    # ===== INSURANCE =====
    if "تأمين" in desc or "تامين" in desc or "insurance" in desc:
        return "12.1.9.0", 0.88  # Other insurance

    # ===== FUEL =====
    fuel_patterns = ["بنزين", "وقود", "fuel", "petrol", "gasoline", "ديزل", "diesel"]
    for p in fuel_patterns:
        if p in desc:
            return "07.2.2.2", 0.90  # Petrol

    # ===== RENT =====
    if "إيجار" in desc or "ايجار" in desc or "rent" in desc:
        return "04.1.1.0", 0.90  # Rental payments for housing

    # ===== ELECTRICITY/UTILITIES =====
    if "كهرباء" in desc or "electricity" in desc:
        return "04.5.1.0", 0.90  # Electricity

    if "مياه" in desc and ("فاتورة" in desc or "bill" in desc):
        return "04.4.1.1", 0.88

    # No match found
    return None, 0


def create_classification_prompt(description: str, categories: dict = None) -> str:
    """Create prompt for COICOP classification - used as fallback"""

    prompt = f"""Classify this product into COICOP 2018 code.

PRODUCT: "{description}"

MAIN DIVISIONS:
01 = Food and beverages
02 = Tobacco
03 = Clothing/Footwear
04 = Housing/Utilities
05 = Furniture/Appliances
06 = Health
07 = Transport
08 = Communications
09 = Recreation/Culture
10 = Education
11 = Restaurants/Hotels
12 = Insurance
13 = Personal Care

COMMON CODES:
- Books: 09.5.2.1
- Stationery: 09.5.4.1
- Bread/Biscuits: 01.1.1.3
- Meat/Chicken: 01.1.2.2
- Fish/Tuna: 01.1.3.3
- Milk: 01.1.4.1
- Vegetables: 01.1.7.X
- Fruits: 01.1.6.X
- Sugar/Sweets: 01.1.8.X
- Soft drinks: 01.2.1.2
- Cars: 07.1.1.2
- Phones: 08.2.1.1
- Jewelry: 13.2.1.1
- Clothes: 03.1.2.X

Return ONLY valid JSON:
{{"code": "XX.X.X.X", "confidence": 0.XX}}

The code MUST be in format XX.X.X.X (like 01.1.1.3 or 09.5.2.1)

JSON:"""

    return prompt


def create_simple_prompt(description: str, sample_categories: list = None) -> str:
    """Simple prompt - just calls main function"""
    return create_classification_prompt(description)


def is_valid_code(code: str) -> bool:
    """Check if code is valid COICOP format"""
    import re
    if not re.match(r'^\d{2}\.\d\.\d\.\d$', code):
        return False
    return True


if __name__ == "__main__":
    # Test cases
    tests = [
        "كتاب لغة انجليزية",
        "100 مائة من عظماء امة الاسلام",
        "PATHWAYS AME R/W SPARK EPIN 3",
        "سلسال ذهب",
        "اقلام رسم 18 لون",
        "مسطرة شفاف",
        "جزر بلدي كيلو",
        "ساديا برجر بالقسماط",
        "المراعي لبن طازج",
        "صحيفة الاقتصادية",
        "كتاب الكتروني",
        "كراسة صغير",
        "سكر الاسره",
        "تويوتا كامري",
        "ام جي 5 سيارة",
    ]

    print("Testing quick_classify:")
    print("-" * 60)
    for t in tests:
        code, conf = quick_classify(t)
        print(f"{t[:40]:40} -> {code} ({conf:.0%})")
