from flask import (
    Blueprint,
    current_app,
    flash,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, fresh_login_required, login_required
from stasks.models import db, Event, Note, Task, Person, User
from datetime import datetime


main = Blueprint("main", __name__)


# Define the route for the index page
@main.route("/")
def index():
    # Get the current date
    date = datetime.now().date()
    # Query the database for events, notes, and tasks for the current date
    events = Event.query.filter_by(date_start=date).all()
    notes = Note.query.filter_by(date=date).all()
    tasks = Task.query.filter_by(date=date).all()

    # If there are no events, set events to a default message
    if events == []:
        events = [
            {
                "name": "No events scheduled",
                "person": "today",
                "time": "Relax",
                "no_check": True,
            }
        ]
    else:
        events = sorted(events, key=lambda x: x.time_start)
        events = [event.to_dict() for event in events]

    if notes == []:
        notes = [{"title": "Nothing to show"}]

    if tasks == []:
        tasks = [{"name": "No tasks found for today", "no_check": True}]
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
    events = Event.query.filter_by(date_start=date).all()
    notes = Note.query.filter_by(date=date).all()
    return render_template(
        "index.html", tasks=tasks, events=events, notes=notes, date=date
    )


@main.route("/about")
def about():
    return render_template("about.html", version=current_app.__version__)


@main.route("/admin")
@login_required
def admin():
    version = current_app.__version__
    if current_user.is_admin():
        return render_template("admin.html", version=version, employees=Person.get_employees())
    flash("You do not have administrator permissions")
    return render_template("settings.html")  # temp until admin page is created

@main.route("/calendar")
def calendar():
    return render_template("calendar.html")


@main.route("/profile", methods=["GET"])
@fresh_login_required
def profile():
    user = current_user
    return render_template("profile.html", user=user)


@main.route("/qr")
def qr_generator():
    return render_template("qr.html")


@main.route("/settings")
@login_required
def settings():
    return render_template("settings.html", config=current_app.config)
