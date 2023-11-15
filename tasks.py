from flask import Blueprint, render_template, request
from models import Task, db
from datetime import datetime

tasks = Blueprint('tasks', __name__)

@tasks.route("/tasks/<date>")
def get_tasks_date(date):
    date = datetime.strptime(date, "%Y-%m-%d").date()
    tasks = Task.query.filter_by(date=date).all()
    return render_template("tasks.html", tasks=tasks)


@tasks.route("/tasks", methods=["GET", "POST"])
def add_task():
    if request.method == "GET":
        return render_template("add_task.html")
    elif request.method == "POST":
        name = request.form["name"]
        description = request.form["description"]
        date = datetime.strptime(request.form["date"], "%Y-%m-%d").date()
        new_task = Task(name=name, description=description, date=date)
        db.session.add(new_task)
        db.session.commit()
        return "Task added successfully"
