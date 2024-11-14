from flask import Blueprint, jsonify, render_template, request
from flask_login import login_required
from stasks.models import Note, db
from datetime import datetime

notes = Blueprint('notes', __name__)

@notes.route("/notes")
def note_list():
    notes = Note.query.all()
    return render_template("notes.html", notes=notes)

@notes.route("/notes/<date>")
def get_notess_date(date):
    date = datetime.strptime(date, "%Y-%m-%d").date()
    notes = Note.query.filter_by(date=date).all()
    return render_template("notes.html", notes=notes)


@notes.route("/notes/add", methods=["GET", "POST"])
def add_note():
    message = ""
    if request.method == "POST":
        title = request.form["title"]
        content = request.form["content"]
        date = datetime.strptime(request.form["date"], "%Y-%m-%d").date()
        added_by = request.form.get("added_by")
        new_note = Note(title=title, content=content, date=date, added_by=added_by)
        db.session.add(new_note)
        db.session.commit()
        message = "Note added successfully"
    notes = Note.query.all()
    return render_template("add_note.html", message=message, notes=notes)

@notes.route("/notes/<int:id>")
def note_detail(id):
    note = Note.query.get(id)
    return render_template("detail_note.html", note=note)

@notes.route("/note/<int:id>", methods=["GET", "POST","DELETE", "PATCH"])
def note_api(id):
    if request.method == "GET":
        note = Note.query.get(id)
        message=None
    elif request.method == "POST":
        title = request.form.get("title")
        content = request.form.get("content")
        date = datetime.strptime(request.form["date"], "%Y-%m-%d").date()
        new_note = Note(title=title, content=content, date=date)
        db.session.add(new_note)
        db.session.commit()
        message = "Note added successfully"
        note=new_note
    elif request.method == "DELETE":
        note = Note.query.get(id)
        db.session.delete(note)
        db.session.commit()
        message = "Note deleted successfully"
        return render_template("notes.html", message=message)
    elif request.method == "PATCH":
        note = Note.query.get(id)
        note.title = request.form.get("title")
        note.content = request.form.get("content")
        note.date = datetime.strptime(request.form["date"], "%Y-%m-%d").date()
        db.session.commit()
    return render_template("notes.html", message=message)

@notes.route("/notes/dump")
@login_required
def dump_notes():
    notes = Note.query.all()
    return render_template("notes.html", notes=notes)

@notes.route("/notes/load", methods=["POST"])
@login_required
def load_notes():
    message = "Importing notes"
    category = "information"
    count = 1
    data = request.json
    for event_data in data:
        message += f"\nNote {count}: "

        if event_data["date_end"]:
            date_end = datetime.strptime(
                event_data["date_end"], "%Y-%m-%d"
            ).date()
        else:
            date_end = None
        if event_data["time_end"]:
            time_end = datetime.strptime(
                event_data["time_end"], "%H:%M:%S"
            ).time()
        else:
            time_end = None 
        try:
            event = Note(
                name=event_data["name"],
                cal_uid=event_data["cal_uid"],
                description=event_data["description"],
                date_start=datetime.strptime(
                    event_data["date_start"], "%Y-%m-%d"
                ).date(),
                time_start=datetime.strptime(
                    event_data["time_start"], "%H:%M:%S"
                ).time(),
                date_end=date_end,
                time_end=time_end,
                person=event_data["person"],
                location=event_data["location"],
                completed=event_data["completed"],
                added_by=event_data["added_by"],
            )
        except Exception as e:
            message += str(e)
            category = "error"
        else:
            message += "Successfully added to the database."
            db.session.add(event)
        count += 1
    db.session.commit()
    return jsonify({"category": category, "message": message})