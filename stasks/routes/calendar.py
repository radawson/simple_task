from flask import Blueprint, jsonify, render_template, request
from flask_login import login_required
from stasks.models import Event, db, Person
from datetime import datetime
from operator import attrgetter

calendar = Blueprint("calendar", __name__)


@calendar.route("/ics", methods=["POST"])
def ics_to_event():
    # ics will be converted to JSON in the request
    data = request.get_json()
    # convert the ics data fields to the Event model fields
    event = Event()
    event.name = data["summary"]
    event.description = data["description"]
    event.date_start = datetime.fromisoformat(data["start"]).date()
    event.time_start = datetime.fromisoformat(data["start"]).time()
    event.location = data["location"]
    event.completed = False
    event.added_by = "web"
    event.tz_id = data["tzid"]
    # add the event to the database
    db.session.add(event)
    db.session.commit()
    message = f"Event {event.name} added to the database"
    return jsonify({"message": message, "category": "success"})
