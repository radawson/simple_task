from .database import db
from .event import Event
from .note import Note
from .person import Person, User
from .task import Task, Template, task_to_templates


def seed_db():
    message = "Database seeded with: \n"
    # Check if users already exist in db
    if User.query.count() > 0:
        message += f"Users exist in database: {User.query.all()}\n"
    else:
        people = []
        people.append(Person(first_name="George", last_name="Dirschel"))
        people.append(Person(first_name="Kathy", last_name="Dirschel"))
        people.append(Person(first_name="Ric", last_name="Dawson"))
        people.append(Person(first_name="Pat", last_name="Dawson"))
        people.append(
            User(
                first_name="Rick",
                last_name="Dawson",
                username="admin",
                admin=True,
                password="scrypt:32768:8:1$Q6tRqUTRrUSb87UR$a4c4beae0d6bc50ca34aa47a451d3726cfea2facbe2d8ad9d7e6222065f99dbabf6e5c6f6e2ffbe2fb2ecfe829523f552c9986c9cd93697f2715183f0b553330",
            )
        )
        db.session.add_all(people)
        message += f"{len(people)} people added to db.\n"
    if Template.query.count() > 0:
        message += f"Templates exist in database: {Template.query.all()}"

    else:
        templates = []
        templates.append(Template(name="Daily Tasks"))
        templates.append(Template(name="Monday Tasks"))
        templates.append(Template(name="Tuesday Tasks"))
        templates.append(Template(name="Wednesday Tasks"))
        templates.append(Template(name="Thursday Tasks"))
        templates.append(Template(name="Friday Tasks"))
        templates.append(Template(name="Saturday Tasks"))
        templates.append(Template(name="Sunday Tasks"))
        templates.append(Template(name="Weekly Tasks"))
        templates.append(Template(name="Monthly Tasks"))
        templates.append(Template(name="Morning Tasks"))
        templates.append(Template(name="Afternoon Tasks"))
        db.session.add_all(templates)
        message += f"{len(templates)} templates added to db.\n"

    tasks = []
    tasks.append(
        Task(
            name="Clean Cat Litter",
            description="Clean the cat litter box and refil; with 1 inch of fresh litter.",
            completed=False,
            priority=0,
            added_by="Rick",
        )
    )

    db.session.add_all(tasks)
    message += f"{len(tasks)} tasks added to db.\n"
    db.session.commit()
    return message
