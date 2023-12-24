from flask import Blueprint, jsonify, render_template, request
from stasks.models import Task, db
from datetime import datetime

tasks = Blueprint('tasks', __name__)

@tasks.route("/tasks")
def task_list():
    tasks = Task.query.all()
    return render_template("tasks.html", tasks=tasks)

@tasks.route("/tasks/<date>")
def get_tasks_date(date):
    date = datetime.strptime(date, "%Y-%m-%d").date()
    tasks = Task.query.filter_by(date=date).all()
    return render_template("tasks.html", tasks=tasks)

@tasks.route("/tasks/<int:id>")
def task_detail(id):
    task = Task.query.get(id)
    return render_template("detail_task.html", task=task)

@tasks.route("/tasks/add", methods=["GET", "POST"])
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

@tasks.route("/task/<int:id>", methods=["GET", "POST","DELETE", "PATCH"])
def task_api(id):
    if request.method == "GET":
        task = Task.query.get(id)
        message=None
    elif request.method == "POST":
        name = request.form.get("name")
        description = request.form.get("description")
        date = datetime.strptime(request.form["date"], "%Y-%m-%d").date()
        new_task = Task(name=name, description=description, date=date)
        db.session.add(new_task)
        db.session.commit()
        message = "Task added successfully"
        task=new_task
    elif request.method == "DELETE":
        task = Task.query.get(id)
        db.session.delete(task)
        db.session.commit()
        message = "Task deleted successfully"
        return render_template("tasks.html", message=message)
    elif request.method == "PATCH":
        task = Task.query.get(id)
        form_data = request.form.to_dict()
        print(form_data)
        if form_data.get("name"):
            task.name = form_data.get("name")
        if form_data.get("description"):
            task.description = form_data.get("description")
        raw_date = form_data.get("date")
        if raw_date:
            task.date = datetime.strptime(raw_date, "%Y-%m-%d").date()
        if form_data.get("completed") == "True":
            task.completed = True
        elif form_data.get("completed") == "False":
            task.completed = False
        elif form_data.get("completed"):
            task.completed = form_data.get("completed")
        if form_data.get("priority"):
            task.priority = form_data.get("priority")

        db.session.commit()
        message = "Task updated successfully"
        return jsonify(message)
    return render_template("detail_task.html", task=task, message=message)
