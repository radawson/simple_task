from flask import Blueprint, render_template, request
from stasks.models import Note, db
from datetime import datetime

notes = Blueprint('notes', __name__)

@notes.route("/notes/<date>")
def get_notess_date(date):
    date = datetime.strptime(date, "%Y-%m-%d").date()
    notes = Note.query.filter_by(date=date).all()
    return render_template("notes.html", notes=notes)


@notes.route("/notes", methods=["GET", "POST"])
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