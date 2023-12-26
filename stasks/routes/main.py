from flask import Blueprint, render_template
from flask_login import current_user, login_required
from stasks.models import  db, Event, Note, Task
from datetime import datetime

main = Blueprint('main', __name__)

# Define the route for the index page
@main.route("/")
def index():
    # Get the current date
    date = datetime.now().date()
    # Query the database for events, notes, and tasks for the current date
    events = Event.query.filter_by(date=date).all()
    notes = Note.query.filter_by(date=date).all()
    tasks = Task.query.filter_by(date=date).all()

    # If there are no events, set events to a default message
    if events == []:
        events = [{"name": "No events scheduled",
                    "person": "today",
                    "time": "Relax",
                    "no_check":True}]
    else:
        events = sorted(events, key=lambda x: x.time)

    if notes == []:
        notes = [{"title": "Nothing to show"}]

    if tasks == []:
        tasks = [{"name": "No tasks found for today",
                    "no_check":True}]
    else:
        tasks = sorted(tasks, key=lambda x: x.priority)

    return render_template(
        "index.html", date=date, events=events, notes=notes, tasks=tasks
    )


# Define the route for the date page
@main.route("/date/<date>")
def get_date(date):
    date = datetime.strptime(date, "%Y-%m-%d").date()
    tasks = Task.query.filter_by(date=date).all()
    events = Event.query.filter_by(date=date).all()
    notes = Note.query.filter_by(date=date).all()
    return render_template("index.html", tasks=tasks, events=events, notes=notes, date=date)

@main.route("/profile")
@login_required
def profile():
    user=current_user
    return render_template("profile.html", user=user)