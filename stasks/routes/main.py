from flask import Blueprint, current_app, flash, redirect, render_template, request, url_for
from flask_login import current_user, fresh_login_required, login_required
from stasks.models import db, Event, Note, Task, User
from datetime import datetime

main = Blueprint("main", __name__)


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
        events = [
            {
                "name": "No events scheduled",
                "person": "today",
                "time": "Relax",
                "no_check": True,
            }
        ]
    else:
        events = sorted(events, key=lambda x: x.time)

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
    events = Event.query.filter_by(date=date).all()
    notes = Note.query.filter_by(date=date).all()
    return render_template(
        "index.html", tasks=tasks, events=events, notes=notes, date=date
    )

@main.route('/about')
def about():
    return render_template('about.html', version=current_app.__version__)

@main.route("/admin")
@login_required
def admin():
    if current_user.is_admin():
        return render_template("admin.html")
    flash("You do not have administrator permissions")
    return render_template("settings.html")  # temp until admin page is created


@main.route("/profile", methods=["GET", "POST"])
@fresh_login_required
def profile():
    if request.method == "POST":
        print(request.form)
        user = User.query.get(current_user.id)
        if request.form.get('first_name'):
            user.first_name = request.form.get('first_name')
        if request.form.get('last_name'):
            user.last_name = request.form.get('last_name')
        if request.form.get('birthdate'):
            user.birthdate = request.form.get('birthdate')
        if request.form.get('email'):
            user.email = request.form.get('email')
        if request.form.get('info'):
            user.info = request.form.get('info')
        db.session.commit()
        flash("Profile updated", "success")
        return redirect(url_for("main.profile"))
    user = current_user
    return render_template("profile.html", user=user)


@main.route("/settings")
@login_required
def settings():
    return render_template("settings.html", config=current_app.config)
