from flask_login import UserMixin
from .database import db


class Person(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(20), nullable=False)
    last_name = db.Column(db.String(20))
    full_name = db.Column(db.String(40), db.Computed("first_name || ' ' || last_name"))
    phone = db.Column(db.String(20))
    address = db.Column(db.String(40))
    city = db.Column(db.String(20))
    state = db.Column(db.String(2))
    zip_code = db.Column(db.String(10))
    country = db.Column(db.String(20))
    birthday = db.Column(db.Date)

    def get_all():
        return Person.query.order_by(Person.first_name).all()

    def get_names():
        people = Person.query.with_entities(Person.full_name).all()
        names = [person[0] for person in people]
        return names


class User(UserMixin, Person):
    email = db.Column(db.String(40))
    password = db.Column(db.String(20))
    username = db.Column(db.String(20), unique=True)
    admin = db.Column(db.Boolean, default=False)

    def is_admin(self):
        return self.admin
