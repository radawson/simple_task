from .database import db
from .person import Person, User

class Time(db.Model):
    __tablename__ = "timecards"
    id = db.Column(db.Integer, primary_key=True)
    time_in = db.Column(db.Time)
    time_out = db.Column(db.Time)
    date = db.Column(db.Date)
    person_id = db.Column(db.Integer, db.ForeignKey('person.id'), nullable=False)
    person = db.relationship('Person', backref='timecards')
    description = db.Column(db.Text, nullable=True)
   

    def __repr__(self):
        return f"<Task {self.id}: {self.name}>"
    
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}