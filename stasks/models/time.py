from datetime import date, time
from .database import db
from .person import Person, User

class Time(db.Model):
    __tablename__ = "timecards"
    id = db.Column(db.Integer, primary_key=True)
    time_in = db.Column(db.Time)
    time_out = db.Column(db.Time)
    date = db.Column(db.Date)
    paid = db.Column(db.Boolean, default=False)
    person_id = db.Column(db.Integer, db.ForeignKey('person.id'), nullable=False)
    person = db.relationship('Person', backref='timecards')
    description = db.Column(db.Text, nullable=True)
   

    def __repr__(self):
        return f"<Task {self.id}: {self.name}>"
    
    def to_dict(self):
        dict_ = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        for key in dict_:
            if isinstance(dict_[key], (date, time)):
                dict_[key] = str(dict_[key])
        return dict_