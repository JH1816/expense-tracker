from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(200), unique=True, nullable=False)
    email = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(200), default='')
    picture = db.Column(db.String(500), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'picture': self.picture,
        }


class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(7), default='#808080')
    icon = db.Column(db.String(10), default='📦')
    budget = db.Column(db.Float, nullable=True)
    # NULL = global/default category visible to all users
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    expenses = db.relationship('Expense', backref='category_rel', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'icon': self.icon,
            'budget': self.budget,
        }


class Expense(db.Model):
    __tablename__ = 'expenses'

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    merchant = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    source = db.Column(db.String(20), default='manual')
    email_id = db.Column(db.String(200), nullable=True)
    currency = db.Column(db.String(10), default='SGD')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'amount': self.amount,
            'merchant': self.merchant,
            'description': self.description,
            'category_id': self.category_id,
            'category': self.category_rel.to_dict() if self.category_rel else None,
            'date': self.date.isoformat(),
            'source': self.source,
            'email_id': self.email_id,
            'currency': self.currency,
            'created_at': self.created_at.isoformat(),
        }
