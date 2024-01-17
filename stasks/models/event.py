from .database import db
from datetime import date, time

class Event(db.Model):
    __tablename__ = "events"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    # person should be selected from the list people
    person = db.Column(db.String(20))
    location = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, nullable=False, default=False)
    added_by = db.Column(db.String(30), nullable=True)     

    def to_dict(self):
        dict_ = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        for key in dict_:
            if isinstance(dict_[key], (date, time)):
                dict_[key] = str(dict_[key])
        return dict_