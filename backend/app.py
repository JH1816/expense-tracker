from flask import Flask, request, jsonify, g
from flask_cors import CORS
from models import db, Expense, Category, User
from datetime import datetime
from sqlalchemy import func, extract
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from functools import wraps
import calendar
import os
import requests as req

app = Flask(__name__)
CORS(app,
     origins=['http://localhost:5173', 'http://localhost:3000'],
     allow_headers=['Content-Type', 'Authorization'])

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "expenses.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-prod')

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')

db.init_app(app)

DEFAULT_CATEGORIES = [
    {'name': 'Food & Dining', 'color': '#f97316', 'icon': '🍔'},
    {'name': 'Transportation', 'color': '#3b82f6', 'icon': '🚗'},
    {'name': 'Shopping', 'color': '#eab308', 'icon': '🛍️'},
    {'name': 'Entertainment', 'color': '#8b5cf6', 'icon': '🎬'},
    {'name': 'Healthcare', 'color': '#ef4444', 'icon': '💊'},
    {'name': 'Utilities', 'color': '#06b6d4', 'icon': '⚡'},
    {'name': 'Groceries', 'color': '#22c55e', 'icon': '🛒'},
    {'name': 'Travel', 'color': '#ec4899', 'icon': '✈️'},
    {'name': 'Subscriptions', 'color': '#a855f7', 'icon': '📱'},
    {'name': 'Other', 'color': '#6b7280', 'icon': '📦'},
]

with app.app_context():
    db.create_all()

    # Migrate: add user_id columns to existing tables if absent
    with db.engine.connect() as conn:
        for sql in [
            "ALTER TABLE categories ADD COLUMN user_id INTEGER REFERENCES users(id)",
            "ALTER TABLE expenses ADD COLUMN user_id INTEGER REFERENCES users(id)",
        ]:
            try:
                conn.execute(db.text(sql))
                conn.commit()
            except Exception:
                pass  # Column already exists

    # Seed global default categories (user_id=NULL) on fresh install
    if Category.query.filter_by(user_id=None).count() == 0:
        for cat_data in DEFAULT_CATEGORIES:
            db.session.add(Category(**cat_data))
        db.session.commit()


# ── Auth middleware ────────────────────────────────────────────────────────

def _serializer():
    return URLSafeTimedSerializer(app.config['SECRET_KEY'], salt='auth')


def make_token(user_id, email):
    return _serializer().dumps({'user_id': user_id, 'email': email})


def verify_token(token, max_age=86400 * 30):  # 30 days
    return _serializer().loads(token, max_age=max_age)


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401
        try:
            payload = verify_token(auth[7:])
            g.user_id = payload['user_id']
        except (BadSignature, SignatureExpired, Exception):
            return jsonify({'error': 'Invalid or expired token'}), 401
        return f(*args, **kwargs)
    return decorated


# ── Auth routes ───────────────────────────────────────────────────────────

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    credential = request.json.get('credential')
    if not credential:
        return jsonify({'error': 'No credential provided'}), 400
    if not GOOGLE_CLIENT_ID:
        return jsonify({'error': 'GOOGLE_CLIENT_ID not configured on server'}), 500

    try:
        resp = req.get(
            'https://oauth2.googleapis.com/tokeninfo',
            params={'id_token': credential},
            timeout=10,
        )
        if resp.status_code != 200:
            return jsonify({'error': 'Token verification failed'}), 400
        info = resp.json()
        if info.get('aud') != GOOGLE_CLIENT_ID:
            return jsonify({'error': 'Token audience mismatch'}), 400
    except Exception as e:
        return jsonify({'error': f'Token verification failed: {str(e)}'}), 400

    user = User.query.filter_by(google_id=info['sub']).first()

    if user is None:
        user = User(
            google_id=info['sub'],
            email=info['email'],
            name=info.get('name', ''),
            picture=info.get('picture', ''),
        )
        db.session.add(user)
        db.session.flush()

        # First user: claim any existing expenses that have no owner
        Expense.query.filter_by(user_id=None).update({'user_id': user.id})
        db.session.commit()
    else:
        user.name = info.get('name', user.name)
        user.picture = info.get('picture', user.picture)
        db.session.commit()

    token = make_token(user.id, user.email)
    return jsonify({'token': token, 'user': user.to_dict()})


@app.route('/api/auth/me', methods=['GET'])
@require_auth
def auth_me():
    user = db.get_or_404(User, g.user_id)
    return jsonify(user.to_dict())


# ── Categories ─────────────────────────────────────────────────────────────

@app.route('/api/categories', methods=['GET'])
@require_auth
def get_categories():
    # Global categories (user_id=NULL) + this user's custom categories
    cats = Category.query.filter(
        db.or_(Category.user_id == g.user_id, Category.user_id == None)
    ).order_by(Category.name).all()

    result = []
    for cat in cats:
        d = cat.to_dict()
        d['total_spent'] = round(
            db.session.query(func.sum(Expense.amount))
            .filter(Expense.category_id == cat.id, Expense.user_id == g.user_id)
            .scalar() or 0, 2
        )
        result.append(d)
    return jsonify(result)


@app.route('/api/categories', methods=['POST'])
@require_auth
def create_category():
    data = request.json
    cat = Category(
        name=data['name'],
        color=data.get('color', '#6b7280'),
        icon=data.get('icon', '📦'),
        budget=data.get('budget'),
        user_id=g.user_id,
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify(cat.to_dict()), 201


@app.route('/api/categories/<int:cat_id>', methods=['PUT'])
@require_auth
def update_category(cat_id):
    cat = db.get_or_404(Category, cat_id)
    data = request.json
    cat.name = data.get('name', cat.name)
    cat.color = data.get('color', cat.color)
    cat.icon = data.get('icon', cat.icon)
    cat.budget = data.get('budget', cat.budget)
    db.session.commit()
    return jsonify(cat.to_dict())


# ── Expenses ───────────────────────────────────────────────────────────────

@app.route('/api/expenses', methods=['GET'])
@require_auth
def get_expenses():
    query = Expense.query.filter_by(user_id=g.user_id)

    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    category_id = request.args.get('category_id', type=int)
    search = request.args.get('search', '')
    source = request.args.get('source', '')
    limit = request.args.get('limit', type=int)

    if year:
        query = query.filter(extract('year', Expense.date) == year)
    if month:
        query = query.filter(extract('month', Expense.date) == month)
    if category_id:
        query = query.filter(Expense.category_id == category_id)
    if search:
        query = query.filter(
            db.or_(
                Expense.merchant.ilike(f'%{search}%'),
                Expense.description.ilike(f'%{search}%'),
            )
        )
    if source:
        query = query.filter(Expense.source == source)

    query = query.order_by(Expense.date.desc())
    if limit:
        query = query.limit(limit)

    return jsonify([e.to_dict() for e in query.all()])


@app.route('/api/expenses', methods=['POST'])
@require_auth
def create_expense():
    data = request.json

    email_id = data.get('email_id')
    if email_id and Expense.query.filter_by(email_id=email_id, user_id=g.user_id).first():
        return jsonify({'skipped': True, 'message': 'Duplicate email_id'}), 200

    date_str = data.get('date', datetime.now().isoformat())
    try:
        expense_date = datetime.fromisoformat(date_str)
    except ValueError:
        expense_date = datetime.now()

    expense = Expense(
        amount=float(data['amount']),
        merchant=data['merchant'],
        description=data.get('description', ''),
        category_id=data.get('category_id') or None,
        date=expense_date,
        source=data.get('source', 'manual'),
        email_id=email_id,
        currency=data.get('currency', 'SGD'),
        user_id=g.user_id,
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify(expense.to_dict()), 201


@app.route('/api/expenses/<int:exp_id>', methods=['PUT'])
@require_auth
def update_expense(exp_id):
    expense = db.get_or_404(Expense, exp_id)
    if expense.user_id != g.user_id:
        return jsonify({'error': 'Forbidden'}), 403
    data = request.json

    if 'amount' in data:
        expense.amount = float(data['amount'])
    if 'merchant' in data:
        expense.merchant = data['merchant']
    if 'description' in data:
        expense.description = data['description']
    if 'category_id' in data:
        expense.category_id = data['category_id'] or None
    if 'currency' in data:
        expense.currency = data['currency']
    if 'date' in data:
        try:
            expense.date = datetime.fromisoformat(data['date'])
        except ValueError:
            pass

    db.session.commit()
    return jsonify(expense.to_dict())


@app.route('/api/expenses/<int:exp_id>', methods=['DELETE'])
@require_auth
def delete_expense(exp_id):
    expense = db.get_or_404(Expense, exp_id)
    if expense.user_id != g.user_id:
        return jsonify({'error': 'Forbidden'}), 403
    db.session.delete(expense)
    db.session.commit()
    return '', 204


# ── Dashboard ──────────────────────────────────────────────────────────────

@app.route('/api/dashboard', methods=['GET'])
@require_auth
def dashboard():
    now = datetime.now()
    month = request.args.get('month', now.month, type=int)
    year = request.args.get('year', now.year, type=int)

    def month_expenses(y, m):
        return Expense.query.filter(
            Expense.user_id == g.user_id,
            extract('year', Expense.date) == y,
            extract('month', Expense.date) == m,
        ).all()

    current = month_expenses(year, month)
    total = sum(e.amount for e in current)
    count = len(current)
    avg = total / count if count else 0

    prev_m = month - 1 if month > 1 else 12
    prev_y = year if month > 1 else year - 1
    prev_total = sum(e.amount for e in month_expenses(prev_y, prev_m))

    cat_map = {}
    for e in current:
        cat = e.category_rel
        key = e.category_id or 0
        if key not in cat_map:
            cat_map[key] = {
                'name': cat.name if cat else 'Uncategorized',
                'color': cat.color if cat else '#6b7280',
                'icon': cat.icon if cat else '📦',
                'amount': 0,
                'count': 0,
            }
        cat_map[key]['amount'] += e.amount
        cat_map[key]['count'] += 1

    by_category = sorted(
        [{'category_id': k, **v, 'amount': round(v['amount'], 2)} for k, v in cat_map.items()],
        key=lambda x: x['amount'],
        reverse=True,
    )

    daily_map = {}
    for e in current:
        d = e.date.day
        daily_map[d] = daily_map.get(d, 0) + e.amount

    days_in_month = calendar.monthrange(year, month)[1]
    daily_data = [
        {'day': d, 'date': f'{year}-{month:02d}-{d:02d}', 'amount': round(daily_map.get(d, 0), 2)}
        for d in range(1, days_in_month + 1)
    ]

    monthly_trend = []
    for i in range(5, -1, -1):
        total_months = (year * 12 + month - 1) - i
        y = total_months // 12
        m = total_months % 12 + 1
        m_total = sum(e.amount for e in month_expenses(y, m))
        monthly_trend.append({
            'month': f"{calendar.month_abbr[m]} {y}",
            'amount': round(m_total, 2),
        })

    recent = (
        Expense.query
        .filter_by(user_id=g.user_id)
        .order_by(Expense.date.desc())
        .limit(5)
        .all()
    )

    return jsonify({
        'total': round(total, 2),
        'count': count,
        'average': round(avg, 2),
        'prev_total': round(prev_total, 2),
        'by_category': by_category,
        'daily': daily_data,
        'monthly_trend': monthly_trend,
        'recent': [e.to_dict() for e in recent],
    })


# ── Gmail sync endpoint ────────────────────────────────────────────────────

@app.route('/api/gmail/sync', methods=['POST'])
@require_auth
def gmail_sync_receive():
    data = request.json
    expenses = data.get('expenses', [])
    added, skipped = 0, 0

    for exp in expenses:
        if exp.get('email_id') and Expense.query.filter_by(
            email_id=exp['email_id'], user_id=g.user_id
        ).first():
            skipped += 1
            continue

        cat = None
        if exp.get('category'):
            cat = Category.query.filter(
                Category.name == exp['category'],
                db.or_(Category.user_id == g.user_id, Category.user_id == None),
            ).first()

        try:
            exp_date = datetime.fromisoformat(exp.get('date', datetime.now().isoformat()))
        except ValueError:
            exp_date = datetime.now()

        row = Expense(
            amount=float(exp['amount']),
            merchant=exp['merchant'],
            description=exp.get('description', ''),
            category_id=cat.id if cat else None,
            date=exp_date,
            source='gmail',
            email_id=exp.get('email_id'),
            currency=exp.get('currency', 'SGD'),
            user_id=g.user_id,
        )
        db.session.add(row)
        added += 1

    db.session.commit()
    return jsonify({
        'success': True,
        'added': added,
        'skipped': skipped,
        'message': f'Added {added} new expense(s), skipped {skipped} duplicate(s).',
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
