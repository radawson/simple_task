from flask import session
from flask_login import UserMixin
from datetime import date, time
from .database import db

class Person(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(20), nullable=False)
    last_name = db.Column(db.String(20))
    goes_by = db.Column(db.String(20))
    full_name = db.Column(db.String(40), db.Computed("first_name || ' ' || last_name"))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(40), unique=True,
                     name='uq_person_email')
    address = db.Column(db.String(40))
    city = db.Column(db.String(20))
    state = db.Column(db.String(2))
    zip_code = db.Column(db.String(10))
    country = db.Column(db.String(20))
    birthdate = db.Column(db.Date)
    info = db.Column(db.Text, default="")
    employee = db.Column(db.Boolean, default=False)
    base_pay = db.Column(db.Integer)

    def to_dict(self):
        dict_ = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        for key in dict_:
            if isinstance(dict_[key], (date, time)):
                dict_[key] = str(dict_[key])
        return dict_

    @staticmethod
    def get_all():
        return Person.query.order_by(Person.first_name).all()

    @staticmethod
    def get_clients():
        return Person.query.filter_by(employee=False).all()

    @staticmethod
    def get_client_names():
        people = Person.query.filter_by(employee=False).with_entities(Person.full_name).all()
        names = [person[0] for person in people]
        return names

    @staticmethod
    def get_employees():
        return Person.query.filter_by(employee=True).all()

    @staticmethod
    def get_employees_names():
        people = Person.query.filter_by(employee=True).with_entities(Person.full_name).all()
        names = [person[0] for person in people]
        return names

class User(UserMixin, Person):
    password = db.Column(db.String(128))  # Increased length for hashed passwords
    username = db.Column(db.String(20), unique=True)
    admin = db.Column(db.Boolean, default=False)
    oidc_sub = db.Column(db.String(255), unique=True,
                        name='uq_user_oidc_sub')  # OIDC subject identifier

    def is_admin(self):
        return self.admin or session.get('admin', False)

    def is_employee(self):
        return self.employee