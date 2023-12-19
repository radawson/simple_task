from .database import db

class Person(db.Model):
    first_name = db.Column(db.String(20), nullable=False)
    last_name = db.Column(db.String(20))
    full_name = db.Column(db.String(40), db.Computed("first_name || ' ' || last_name"))
    id = db.Column(db.Integer, primary_key=True)
    birthday = db.Column(db.Date)

    def get_all():
        return Person.query.order_by(Person.first_name).all()

    def get_names():
        #return Person.query.with_entities(Person.full_name).all()
        return ["George", "Kathy", "Ric", "Pat"]

