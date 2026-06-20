from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Expense, Category
from datetime import datetime
from sqlalchemy import func, extract
import calendar
import os

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'http://localhost:3000'])

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "expenses.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-secret-key-change-in-prod'

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
    if Category.query.count() == 0:
        for cat_data in DEFAULT_CATEGORIES:
            db.session.add(Category(**cat_data))
        db.session.commit()


# ── Categories ─────────────────────────────────────────────────────────────

@app.route('/api/categories', methods=['GET'])
def get_categories():
    cats = Category.query.order_by(Category.name).all()
    result = []
    for cat in cats:
        d = cat.to_dict()
        d['total_spent'] = round(
            db.session.query(func.sum(Expense.amount))
            .filter(Expense.category_id == cat.id)
            .scalar() or 0, 2
        )
        result.append(d)
    return jsonify(result)


@app.route('/api/categories', methods=['POST'])
def create_category():
    data = request.json
    cat = Category(
        name=data['name'],
        color=data.get('color', '#6b7280'),
        icon=data.get('icon', '📦'),
        budget=data.get('budget'),
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify(cat.to_dict()), 201


@app.route('/api/categories/<int:cat_id>', methods=['PUT'])
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
def get_expenses():
    query = Expense.query

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
def create_expense():
    data = request.json

    email_id = data.get('email_id')
    if email_id and Expense.query.filter_by(email_id=email_id).first():
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
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify(expense.to_dict()), 201


@app.route('/api/expenses/<int:exp_id>', methods=['PUT'])
def update_expense(exp_id):
    expense = db.get_or_404(Expense, exp_id)
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
def delete_expense(exp_id):
    expense = db.get_or_404(Expense, exp_id)
    db.session.delete(expense)
    db.session.commit()
    return '', 204


# ── Dashboard ──────────────────────────────────────────────────────────────

@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    now = datetime.now()
    month = request.args.get('month', now.month, type=int)
    year = request.args.get('year', now.year, type=int)

    def month_expenses(y, m):
        return Expense.query.filter(
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

    # By category
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

    # Daily spending
    daily_map = {}
    for e in current:
        d = e.date.day
        daily_map[d] = daily_map.get(d, 0) + e.amount

    days_in_month = calendar.monthrange(year, month)[1]
    daily_data = [
        {'day': d, 'date': f'{year}-{month:02d}-{d:02d}', 'amount': round(daily_map.get(d, 0), 2)}
        for d in range(1, days_in_month + 1)
    ]

    # Monthly trend (last 6 months)
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

    recent = Expense.query.order_by(Expense.date.desc()).limit(5).all()

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
def gmail_sync_receive():
    """Accept parsed expenses from Claude's Gmail scan."""
    data = request.json
    expenses = data.get('expenses', [])
    added, skipped = 0, 0

    for exp in expenses:
        if exp.get('email_id') and Expense.query.filter_by(email_id=exp['email_id']).first():
            skipped += 1
            continue

        cat = None
        if exp.get('category'):
            cat = Category.query.filter_by(name=exp['category']).first()

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
