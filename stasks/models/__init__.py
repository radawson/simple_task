from .database import db
from .event import Event
from .note import Note
from .person import Person, User
from .task import Task

def seed_db():
    # Check if users already exist in db
    if User.query.count() > 0:
        return f"Users exist in database: {User.query.all()}"
    db.session.add(Person(first_name="George", last_name="Dirschel"))
    db.session.add(Person(first_name="Kathy", last_name="Dirschel"))
    db.session.add(Person(first_name="Ric", last_name="Dawson"))
    db.session.add(Person(first_name="Pat", last_name="Dawson"))
    db.session.commit()
