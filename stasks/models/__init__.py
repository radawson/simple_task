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
    db.session.add(
        User(
            first_name="Rick",
            last_name="Dawson",
            username="admin",
            admin=True,
            password="scrypt:32768:8:1$Q6tRqUTRrUSb87UR$a4c4beae0d6bc50ca34aa47a451d3726cfea2facbe2d8ad9d7e6222065f99dbabf6e5c6f6e2ffbe2fb2ecfe829523f552c9986c9cd93697f2715183f0b553330",
        )
    )
    db.session.commit()
    return f"5 users added to database."
