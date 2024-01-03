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
    task1 = Task(
        name="Clean Cat Litter",
        description="Clean the cat litter box and refill with 1 inch of fresh litter.",
        completed=False,
        priority=0,
        template=True,
        added_by="admin",
    )
    task1.templates.append(Template.query.filter_by(name="Daily Tasks").first())
    tasks.append(task1)
    task2 = Task(
        name="Pick Up Dishes",
        description="Periodically check the house (especially bedrooms) for dirty dishes and bring them to the kitchen.",
        completed=False,
        priority=0,
        template=True,
        added_by="admin",
    )
    task2.templates.append(Template.query.filter_by(name="Daily Tasks").first())
    tasks.append(task2)
    task3 = Task(
        name="Take Out Trash",
        description="Remove trash from upstairs bathrooms and bedrooms, downstairs bathroom, kitchen, and powder room. replace trash bags in each garbage can.",
        completed=False,
        priority=0,
        template=True,
        added_by="admin",
    )
    task3.templates.append(Template.query.filter_by(name="Daily Tasks").first())
    tasks.append(task3)
    task4 = Task(
        name="Clean Kitchen",
        description="Wipe down kitchen counters, clean stove top, and clean microwave.",
        completed=False,
        priority=0,
        template=True,
        added_by="admin",
    )
    task4.templates.append(Template.query.filter_by(name="Daily Tasks").first())
    tasks.append(task4)
    task5 = Task(
        name="Vacuum first floor carpets",
        description="Vacuum first floor rugs in living room, dining room, foyer, and both bedrooms.",
        completed=False,
        priority=0,
        template=True,
        added_by="admin",
    )
    task5.templates.append(Template.query.filter_by(name="Daily Tasks").first())
    tasks.append(task5)

    db.session.add_all(tasks)
    message += f"{len(tasks)} tasks added to db.\n"
    db.session.commit()
    return message
