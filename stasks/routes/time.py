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
from stasks.models import db, Event, Note, Task, Timecard, User
from datetime import datetime

times = Blueprint("times", __name__)


@times.route("/time", methods=["GET", "POST"])
def timecard():
    if request.method == "GET":
        users = User.query.filter_by(employee=True).all()
        return render_template("time.html", users=users)
    elif request.method == "POST":
        message = "Post timecard request received"
        print(request.form.to_dict())
        person_id = request.form.get("person_id")
        if not person_id:
            return jsonify({'message':'No person selected', 'category':'error'})
        if request.form.get("date"):
            date = datetime.strptime(request.form.get("date"), "%Y-%M-%d").date()
        else:
            return jsonify({'message':'No date selected', 'category':'error'})
        description = request.form.get("description")
        if request.form.get("time_in"):
            time_in = datetime.strptime(request.form.get("time_in"), "%H:%M").time()
        if request.form.get("time_out"):
            time_out = datetime.strptime(request.form.get("time_out"), "%H:%M").time()
        
        
        # Check to see if the user has already clocked in
        if Timecard.query.filter_by(person_id=person_id, date=date).first():
            time_entry = Timecard.query.filter_by(person_id=person_id, date=date).first()
            # User has clocked in but not clocked out
            if time_entry.time_in and not time_entry.time_out:
                # Trying to clock out
                if request.form.get("time_out"):
                    time_entry.time_out = time_out
                    db.session.commit()
                    message = "Time out updated"
                # Trying to clock in again    
                else:
                    message = "Time in already recorded"
            # User has clocked in and out, so make a new entry
        else:
            # User has clocked out without clocking in
            if not request.form.get("time_in"):
                return jsonify({'message': "Time in required before time out", 'category':'warning'})
            time_entry = Timecard(
                person_id=person_id,
                time_in=time_in,
                date=date,
                description=description,
            )
            message = "Time in recorded"
        db.session.add(time_entry)
        db.session.commit()
        
        return jsonify({'message':message, 'category':'success'})
    else:
        pass


@times.route("/time/date/<date>", methods=["GET"])
def time_by_date(date):
    if request.method == "GET":
        if date == "all":
            times = Timecard.query.all()
        else:
            times = Timecard.query.filter_by(date=date).all()
        return jsonify([timecard.to_dict() for timecard in times])
    else:
        pass


@times.route("/time/person/<person_id>", methods=["GET"])
def time_by_person(person_id):
    if request.method == "GET":
        if person_id == "all":
            times = Timecard.query.all()
        else:
            times = Timecard.query.filter_by(person_id=person_id).all()
        print([timecard.to_dict() for timecard in times])
        return jsonify([timecard.to_dict() for timecard in times])
    else:
        pass


@times.route("/time/<time_id>", methods=["GET", "PATCH", "DELETE"])
def time_api(time_id):
    if request.method == "GET":
        timecard = Timecard.query.get(time_id)
        return jsonify(timecard.to_dict())
    elif request.method == "PATCH":
        timecard = Timecard.query.get(time_id)
        if request.form.get("time_in"):
            try:
                timecard.time_in = datetime.strptime(
                    request.form.get("time_in"), "%H:%M"
                ).time()
            except:
                timecard.time_in = datetime.strptime(
                    request.form.get("time_in"), "%H:%M:%S"
                ).time()
        if (
            request.form.get("time_out")
            and request.form.get("time_out") != ""
            and request.form.get("time_out") != "null"
        ):
            try:
                timecard.time_out = datetime.strptime(
                    request.form.get("time_out"), "%H:%M"
                ).time()
            except:
                timecard.time_out = datetime.strptime(
                request.form.get("time_out"), "%H:%M:%S"
            ).time()
        if request.form.get("date"):
            timecard.date = datetime.strptime(
                request.form.get("date"), "%Y-%M-%d"
            ).date()
        if request.form.get("paid") == "true":
            timecard.paid = True
        elif request.form.get("paid") == "false":
            timecard.paid = False
        if request.form.get("base_pay"):
            timecard.base_pay = request.form.get("base_pay")
        if request.form.get("description"):
            timecard.description = request.form.get("description")
        db.session.commit()
        return jsonify({"message": "Timecard updated", "category": "success"})
    elif request.method == "DELETE":
        timecard = Timecard.query.get(time_id)
        db.session.delete(timecard)
        db.session.commit()
        return jsonify(timecard.to_dict())
    else:
        pass
