from flask import Blueprint, render_template, request
from stasks.models import Event, db, Person
from datetime import datetime

events = Blueprint('events', __name__)

@events.route('/events')
def event_list():
    events = Event.query.all()
    return render_template('events.html', events=events)

@events.route('/events/<int:id>')
def event_detail(id):
    event = Event.query.get(id)
    return render_template('detail_event.html', event=event)

@events.route("/events/add", methods=["GET", "POST"])
def add_event():
    if request.method == "GET":
        return render_template("add_event.html",  people=Person.get_names())
    elif request.method == "POST":
        name = request.form.get("name")
        description = request.form.get("description")
        date = datetime.strptime(request.form["date"], "%Y-%m-%d").date()
        time = datetime.strptime(request.form["time"], "%H:%M").time()
        location = request.form.get("location")
        person = request.form.get("person")
        new_event = Event(name=name, description=description, date=date, time=time, location=location, person= person)
        db.session.add(new_event)
        db.session.commit()
        message = "Event added successfully"
        events = Event.query.all()
    return render_template("events.html", events=events, message=message)

@events.route("/event/<int:id>", methods=["GET", "POST","DELETE", "PATCH"])
def event_api(id):
    if request.method == "GET":
        event = Event.query.get(id)
        message=None
    elif request.method == "POST":
        name = request.form.get("name")
        description = request.form.get("description")
        date = datetime.strptime(request.form["date"], "%Y-%m-%d").date()
        time = datetime.strptime(request.form["time"], "%H:%M").time()
        location = request.form.get("location")
        person = request.form.get("person")
        new_event = Event(name=name, description=description, date=date, time=time, location=location, person= person)
        db.session.add(new_event)
        db.session.commit()
        message = "Event added successfully"
        event=new_event
    elif request.method == "DELETE":
        event = Event.query.get(id)
        db.session.delete(event)
        db.session.commit()
        message = "Event deleted successfully"
        return render_template("events.html", message=message)
    elif request.method == "PATCH":
        event = Event.query.get(id)
        print(f"Got Event {event} with id {id}")
        form_data = request.form.to_dict()
        print(f"Got form data {form_data.get('location')}")
        if form_data.get("name"):
            event.name = form_data.get("name")
        if form_data.get("description"):
            event.description = form_data.get("description")
        raw_date = form_data.get("date")
        raw_time = form_data.get("time")
        if raw_date:
            event.date = datetime.strptime(raw_date, "%Y-%m-%d").date()
        if raw_time:
            event.time = datetime.strptime(raw_time, "%H:%M:%S").time()
        if form_data.get("location"):
            event.location = form_data.get("location")
        if form_data.get("person"):
            event.person = form_data.get("person")
        db.session.commit()
        message = "Event updated successfully"
    return render_template("detail_event.html", event=event, message=message)