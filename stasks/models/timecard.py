from datetime import date, time
from datetime import datetime
from .database import db
from .person import Person, User

class Timecard(db.Model):
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
        if self.time_in and self.time_out:
            dict_['minutes'] = (self.time_out.hour * 60 + self.time_out.minute) - (self.time_in.hour * 60 + self.time_in.minute)
        elif self.time_in and not self.time_out:
            now = datetime.now().time()
            dict_['minutes'] = (now.hour * 60 + now.minute) - (self.time_in.hour * 60 + self.time_in.minute)
        else:
            dict_['minutes'] = 0
        if self.person:
            dict_['first_name'] = self.person.first_name
            dict_['last_name'] = self.person.last_name
            dict_['base_pay'] = self.person.base_pay
        return dict_