from flask import Blueprint, render_template, request
from stasks.models import Event, db
from datetime import datetime

events = Blueprint('events', __name__)

@events.route('/events/<int:id>')
def event_detail(id):
    event = Event.query.get(id)
    return render_template('event_detail.html', event=event)

@events.route("/events", methods=["GET", "POST"])
def add_event():
    if request.method == "GET":
        events = Event.query.all()
        return render_template("add_event.html", events=events)
    elif request.method == "POST":
        name = request.form["name"]
        description = request.form["description"]
        date = datetime.strptime(request.form["date"], "%Y-%m-%d").date()
        time = datetime.strptime(request.form["time"], "%H:%M").time()
        location = request.form["location"]
        new_event = Event(name=name, description=description, date=date, time=time, location=location)
        db.session.add(new_event)
        db.session.commit()
        message = "Event added successfully"
    return render_template("add_event.html", message=message)