from .database import db
from datetime import date, time

class Event(db.Model):
    __tablename__ = "events"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    cal_uid = db.Column(db.String(200), nullable=True)
    description = db.Column(db.Text, nullable=True)
    date_start = db.Column(db.Date)
    time_start = db.Column(db.Time)
    date_end = db.Column(db.Date)
    time_end = db.Column(db.Time)
    # person should be selected from the list people
    person = db.Column(db.String(20))
    location = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, nullable=False, default=False)
    added_by = db.Column(db.String(30), nullable=True)  
    tz_id = db.Column(db.String) # Time Zone   

    def to_dict(self):
        dict_ = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        for key in dict_:
            if isinstance(dict_[key], (date, time)):
                dict_[key] = str(dict_[key])
        clock_time = self.time_start.strftime('%I:%M %p')
        # Remove leading zero from hour (if any)
        if clock_time.startswith('0'):
            clock_time = clock_time[1:]
        dict_['clock_time'] = clock_time
        return dict_
