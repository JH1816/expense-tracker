"""
Helpers for parsing Gmail transaction emails.
Claude uses these patterns when extracting expense data from email content.
"""
import re
from typing import Optional, Tuple


AMOUNT_PATTERNS = [
    r'(?:SGD|S\$)\s*([0-9,]+\.?\d{0,2})',
    r'(?:USD|\$)\s*([0-9,]+\.?\d{0,2})',
    r'(?:MYR|RM)\s*([0-9,]+\.?\d{0,2})',
    r'([0-9,]+\.?\d{0,2})\s*(?:SGD|USD|MYR)',
    r'[Aa]mount[:\s]+\$?([0-9,]+\.?\d{0,2})',
    r'[Tt]otal[:\s]+\$?([0-9,]+\.?\d{0,2})',
    r'[Cc]harged[:\s]+\$?([0-9,]+\.?\d{0,2})',
]

CURRENCY_HINTS = [
    (r'SGD|S\$', 'SGD'),
    (r'MYR|RM\b', 'MYR'),
    (r'USD|\$', 'USD'),
    (r'EUR|€', 'EUR'),
    (r'GBP|£', 'GBP'),
]

CATEGORY_KEYWORDS = {
    'Food & Dining': [
        'restaurant', 'cafe', 'coffee', 'food', 'mcdonald', 'kfc', 'pizza',
        'hawker', 'grab food', 'foodpanda', 'deliveroo', 'dining', 'kitchen',
        'eatery', 'bistro', 'grill', 'sushi', 'ramen', 'burger', 'toast box',
        'ya kun', 'old chang kee', 'bengawan', 'bengawan solo',
    ],
    'Transportation': [
        'grab', 'uber', 'gojek', 'comfort delgro', 'taxi', 'mrt', 'bus',
        'transit', 'parking', 'petrol', 'shell', 'esso', 'caltex', 'ez-link',
        'scooter', 'bike', 'lyft',
    ],
    'Shopping': [
        'amazon', 'lazada', 'shopee', 'zalora', 'uniqlo', 'h&m', 'zara',
        'ikea', 'shop', 'store', 'mall', 'fashion', 'clothing', 'taobao',
        'aliexpress', 'shein', 'cotton on',
    ],
    'Entertainment': [
        'netflix', 'spotify', 'youtube', 'disney+', 'cinema', 'movie', 'concert',
        'game', 'steam', 'playstation', 'xbox', 'apple arcade', 'grab entertainment',
        'shaw theatres', 'golden village', 'cathay',
    ],
    'Healthcare': [
        'clinic', 'hospital', 'pharmacy', 'guardian', 'watson', 'polyclinic',
        'dental', 'doctor', 'medical', 'health', 'medicine', 'raffles medical',
        'parkway', 'mount elizabeth',
    ],
    'Utilities': [
        'singtel', 'starhub', 'm1', 'sp utilities', 'electricity', 'water',
        'internet', 'phone bill', 'cable', 'utility', 'broadband', 'circle life',
    ],
    'Groceries': [
        'ntuc', 'fairprice', 'giant', 'cold storage', 'sheng siong', 'market',
        'grocery', 'supermarket', 'redmart', 'jasons', 'don don donki',
    ],
    'Travel': [
        'airline', 'airbnb', 'booking.com', 'agoda', 'expedia', 'flight',
        'scoot', 'airasia', 'singapore airlines', 'hotel', 'resort', 'klook',
        'changi', 'jetstar',
    ],
    'Subscriptions': [
        'subscription', 'monthly plan', 'annual plan', 'membership', 'apple one',
        'google one', 'microsoft', 'adobe', 'dropbox', 'icloud', 'notion',
    ],
}


def extract_amount(text: str) -> Tuple[Optional[float], str]:
    currency = 'SGD'
    for pattern in AMOUNT_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            try:
                amount = float(m.group(1).replace(',', ''))
                if 0 < amount < 1_000_000:
                    surrounding = text[max(0, m.start() - 5):m.end() + 5]
                    for hint_pat, code in CURRENCY_HINTS:
                        if re.search(hint_pat, surrounding):
                            currency = code
                            break
                    return amount, currency
            except ValueError:
                continue
    return None, currency


def guess_category(merchant: str, body: str) -> str:
    haystack = (merchant + ' ' + body).lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in haystack for kw in keywords):
            return category
    return 'Other'
