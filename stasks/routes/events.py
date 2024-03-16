from flask import Blueprint, flash, jsonify, render_template, request
from flask_login import login_required
from stasks.models import Event, db, Person
from datetime import datetime, date, time
from operator import attrgetter

from operator import attrgetter

def sort_key(event):
    # Use a date far in the future for events with no start date
    date_start = event.date_start or date.max
    # Use a time of 00:00 for events with no start time
    time_start = event.time_start or time.min
    return (date_start, time_start)

events = Blueprint("events", __name__)


@events.route("/events")
def event_list():
    all_events = Event.query.all()
    sorted_events = sorted(all_events, key=sort_key)
    return render_template("events.html", events=sorted_events)


@events.route("/events/<date>")
def get_events_date(date):
    if date == "future":
        events = Event.query.filter(Event.date_start > datetime.now().date()).all()
    elif date == "all":
        events = Event.query.all()
    else:
        date = datetime.strptime(date, "%Y-%m-%d").date()
        events = Event.query.filter_by(date_start=date).all()
    return jsonify([event.to_dict() for event in events])


@events.route("/events/<int:id>")
def event_detail(id):
    event = Event.query.get(id)
    return render_template("detail_event.html", event=event)


@events.route("/events/add", methods=["GET", "POST"])
@login_required
def add_event():
    if request.method == "GET":
        return render_template("add_event.html", people=Person.get_client_names())
    elif request.method == "POST":
        new_event = Event()
        new_event.name = request.form.get("name")
        new_event.description = request.form.get("description")
        if request.form.get("date_end") and request.form.get("time_end"):
            new_event.date_end = datetime.strptime(
                request.form.get("date_end"), "%Y-%m-%d"
            ).date()
            new_event.time_end = datetime.strptime(request.form["time_end"], "%H:%M").time()
        if request.form.get("date"):
            new_event.date_start = datetime.strptime(request.form.get("date"), "%Y-%m-%d").date()
        else:
            message = "Date is required"
            flash(message)
            return render_template("add_event.html", people=Person.get_client_names())
        if request.form.get("time"):
            new_event.time_start = datetime.strptime(request.form["time"], "%H:%M").time()
        else:
            message = "Time is required"
            flash(message)
            return render_template("add_event.html", people=Person.get_client_names())
        new_event.location = request.form.get("location")
        new_event.person = request.form.get("person")
        if request.form.get("tz_id"):
            new_event.tz_id = request.form.get("tz_id")
        new_event.added_by = request.form.get("added_by")
        db.session.add(new_event)
        db.session.commit()
        message = "Event added successfully"
        all_events = Event.query.all()
        #sorted_events = sorted(events, key=attrgetter("date_start", "time_start"))    
        sorted_events = sorted(all_events, key=sort_key)
        flash(message)
    return render_template("events.html", events=sorted_events)


@events.route("/event/<int:id>", methods=["GET", "POST", "DELETE", "PATCH"])
def event_api(id):
    message = ""
    if request.method == "GET":
        event = Event.query.get(id)
        message = None
    elif request.method == "POST":
        name = request.form.get("name")
        description = request.form.get("description")
        date_start = datetime.strptime(request.form.get("date_start"), "%Y-%m-%d").date()
        time_start = datetime.strptime(request.form.get("time_start"), "%H:%M").time()
        location = request.form.get("location")
        person = request.form.get("person")
        new_event = Event(
            name=name,
            description=description,
            date_start=date_start,
            time_start=time_start,
            location=location,
            person=person,
        )
        db.session.add(new_event)
        db.session.commit()
        message = "Event added successfully"
        event = new_event
    elif request.method == "DELETE":
        event = Event.query.get(id)
        db.session.delete(event)
        db.session.commit()
        message = "Event deleted successfully"
        return render_template("events.html", message=message)
    elif request.method == "PATCH":
        event = Event.query.get(id)
        form_data = request.form.to_dict()
        if form_data.get("name"):
            event.name = form_data.get("name")
        if form_data.get("description"):
            event.description = form_data.get("description")
        raw_date_start = form_data.get("date_start")
        raw_time_start = form_data.get("time_start")
        if raw_date_start:
            event.date_start = datetime.strptime(raw_date_start, "%Y-%m-%d").date()
        if raw_time_start:
            try:
                event.time_start = datetime.strptime(raw_time_start, "%H:%M").time()
            except ValueError:
                event.time_start = datetime.strptime(raw_time_start, "%H:%M:%S").time()
        raw_date_end = form_data.get("date_end")
        raw_time_end = form_data.get("time_end")
        if raw_date_end:
            event.date_end = datetime.strptime(raw_date_end, "%Y-%m-%d").date()
        if raw_time_end:
            try:
                event.time_end = datetime.strptime(raw_time_end, "%H:%M").time()
            except ValueError:
                event.time_end = datetime.strptime(raw_time_end, "%H:%M:%S").time()

        if form_data.get("location"):
            event.location = form_data.get("location")
        if form_data.get("person"):
            event.person = form_data.get("person")
        if form_data.get("completed") == "True":
            event.completed = True
        elif form_data.get("completed") == "False":
            event.completed = False
        elif form_data.get("completed"):
            event.completed = form_data.get("completed")

        db.session.commit()
        message = "Event updated successfully"
        return jsonify(message)
    return render_template("detail_event.html", event=event, message=message)

@events.route("/events/dump")
@login_required
def dump_events():
    events = Event.query.all()
    return jsonify([event.to_dict() for event in events])
