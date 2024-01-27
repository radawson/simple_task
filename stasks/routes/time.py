from flask import (
    Blueprint,
    current_app,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, fresh_login_required, login_required
from stasks.models import db, Event, Note, Task, Time, User
from datetime import datetime

times = Blueprint("times", __name__)


@times.route("/time", methods=["GET", "POST"])
def timecard():
    if request.method == "GET":
        users = User.query.filter_by(employee=True).all()
        print(users)
        return render_template("time.html", users=users)
    elif request.method == "POST":
        print(request.form.to_dict())
        message = "Post request received"
        person_id = request.form.get("person_id")
        if not person_id:
            return jsonify("No person selected")
        if request.form.get("time_in"):
            time_in = datetime.strptime(request.form.get("time_in"), "%H:%M").time()
        if request.form.get("time_out"):
            time_out = datetime.strptime(request.form.get("time_out"),'%H:%M').time()
        if request.form.get("date"):
            date = datetime.strptime(request.form.get("date"), "%Y-%m-%d").date()
        description = request.form.get("description")
        # Check to see if the user has already clocked in
        if Time.query.filter_by(person_id=person_id, date=date).first():
            time_entry = Time.query.filter_by(person_id=person_id, date=date).first()
            if time_entry.time_in and not time_entry.time_out:
                time_entry.time_out = time_out
                db.session.commit()
                message = "Time out updated"
            else:
                message = "Time in already recorded"
        else:
            time_entry = Time(
                person_id=person_id,
                time_in=time_in,
                date=date,
                description=description,
            )
            db.session.add(time_entry)
            db.session.commit()
            message = "Time in recorded"
        return jsonify(message)
    else:
        pass

@times.route("/time/date/<date>", methods=["GET"])
def time_by_date(date):
    if request.method == "GET":
        if date == "all":
            times = Time.query.all()
        else:
            times = Time.query.filter_by(date=date).all()
        return jsonify([timecard.to_dict() for timecard in times])
    else:
        pass

@times.route("/time/person/<person_id>", methods=["GET"])
def time_by_person(person_id):
    if request.method == "GET":
        if person_id == "all":
            times = Time.query.all()
        else:
            times = Time.query.filter_by(person_id=person_id).all()
        print([timecard.to_dict() for timecard in times])
        return jsonify([timecard.to_dict() for timecard in times])
    else:
        pass

@times.route("/time/<time_id>", methods=["GET", "PATCH", "DELETE"])
def time_api(time_id):
    if request.method == "GET":
        timecard = Time.query.get(time_id)
        return jsonify(timecard.to_dict())
    elif request.method == "PATCH":

        timecard = Time.query.get(time_id)
        if request.form.get("time_in"):
           
            timecard.time_in = datetime.strptime(request.form.get("time_in"), "%H:%M:%S").time()
        if request.form.get("time_out") is not None and request.form.get("time_out") != "" and request.form.get("time_out") != "null":
            print(f"Time out is {request.form.get('time_out')} which is a {type(request.form.get('time_out'))}")
            timecard.time_out = datetime.strptime(request.form.get("time_out"), "%H:%M:%S").time()
        if request.form.get("date"):
            timecard.date = datetime.strptime(request.form.get("date"), "%Y-%M-%d").date()
        if request.form.get("paid") == "true":
            timecard.paid = True
        elif request.form.get("paid") == "false":
            timecard.paid = False
        if request.form.get("description"):
            timecard.description = request.form.get("description")
        db.session.commit()
        return jsonify({"message": "Timecard updated", "category": "success"})
    elif request.method == "DELETE":
        timecard = Time.query.get(time_id)
        db.session.delete(timecard)
        db.session.commit()
        return jsonify(timecard.to_dict())
    else:
        pass