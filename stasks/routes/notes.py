from flask import Blueprint, render_template, request
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
        new_note = Note(title=title, content=content, date=date)
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