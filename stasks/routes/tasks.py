from flask import Blueprint, render_template, request
from stasks.models import Task, db
from datetime import datetime

tasks = Blueprint('tasks', __name__)

@tasks.route("/tasks/<date>")
def get_tasks_date(date):
    date = datetime.strptime(date, "%Y-%m-%d").date()
    tasks = Task.query.filter_by(date=date).all()
    return render_template("tasks.html", tasks=tasks)


@tasks.route("/tasks", methods=["GET", "POST"])
def add_task():
    message = ""
    if request.method == "GET":
        tasks = Task.query.all()
        return render_template("add_task.html", tasks=tasks)
    elif request.method == "POST":
        name = request.form["name"]
        description = request.form["description"]
        date = datetime.strptime(request.form["date"], "%Y-%m-%d").date()
        new_task = Task(name=name, description=description, date=date)
        db.session.add(new_task)
        db.session.commit()
        message = "Task added successfully"
    return render_template("add_task.html", message=message)

@tasks.route("/task/<int:id>", methods=["DELETE", "GET", "PATCH"])
def task_api(id):
    task = Task.query.get(id)
    if task is None:
        print(f"No task found with id {id}")
        return "No task found", 404

    if request.method == "DELETE":
        print(f"Deleting task {id}")
        db.session.delete(task)
        db.session.commit()
        print(f"Task {id} deleted successfully")
        return "Task deleted", 200 
    elif request.method == "GET": 
        # troubleshooting
        print(f"received GET request for task {id}")  
        return render_template("detail_task.html", task=task)
    elif request.method == "PATCH":
        # troubleshooting
        print(f"received PATCH request for task {id}, {request.form.items()}")
        description = request.form["taskDescription"]
        date = datetime.strptime(request.form["taskDate"], "%Y-%m-%d").date()
        task.description = description
        task.date = date
        db.session.commit()
        message = "Task updated successfully"
        return render_template("detail_task.html", task=task, message=message)
    else:
        message = "Method not allowed"
        return render_template("detail_task.html", task=task, message=message)