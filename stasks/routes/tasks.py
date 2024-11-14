from flask import Blueprint, flash, jsonify, redirect, render_template, request, url_for
from flask_login import login_required
from stasks.models import Task, Template, db
from datetime import datetime

tasks = Blueprint("tasks", __name__)


@tasks.route("/tasks")
def task_list():
    # tasks = Task.query.all()
    return render_template("tasks.html")


@tasks.route("/tasks/<date>")
def get_tasks_date(date):
    if date == "future":
        tasks = Task.query.filter(Task.date > datetime.now().date()).all()
    elif date == "all":
        tasks = Task.query.all()
    else:
        date = datetime.strptime(date, "%Y-%m-%d").date()
        tasks = Task.query.filter_by(date=date).all()
    return jsonify([task.to_dict() for task in tasks])


@tasks.route("/tasks/<int:id>")
def task_detail(id):
    task = Task.query.get(id)
    if len(task.templates) > 0:
        templates = Template.query.all()
        return render_template("detail_task.html", task=task, templates=templates)
    return render_template("detail_task.html", task=task)


@tasks.route("/tasks/add", methods=["GET", "POST"])
@login_required
def add_task():
    message = ""
    if request.method == "GET":
        tasks = Task.query.all()
        templates = Template.query.all()
        return render_template("add_task.html", tasks=tasks, templates=templates)
    elif request.method == "POST":
        message = ""
        print(request.form.getlist("template_select[]"))
        name = request.form.get("name")
        description = request.form.get("description")
        if request.form.get("date"):
            date = datetime.strptime(request.form.get("date"), "%Y-%m-%d").date()
        added_by = request.form.get("added_by")
        if request.form.get("template") == "on":
            template = True
            new_task = Task(
                name=name,
                description=description,
                added_by=added_by,
                template=template,
            )
            for template in request.form.getlist("template_select[]"):
                new_task.templates.append(Template.query.get(template))
                print(f"Task {new_task.id} added to template {template}")
            message = f"Template task {new_task.id}"
        else:
            template = False
            new_task = Task(
                name=name,
                description=description,
                date=date,
                added_by=added_by,
                template=template,
            )
            message = f"Task {new_task.id}"
        db.session.add(new_task)
        db.session.commit()
        message += " added successfully"
    return render_template("tasks.html", message=message)


@tasks.route("/task/<int:id>", methods=["GET", "POST", "DELETE", "PATCH"])
def task_api(id):
    message = None
    if request.method == "GET":
        task = Task.query.get(id)
    elif request.method == "POST":
        name = request.form.get("name")
        description = request.form.get("description")
        date = datetime.strptime(request.form["date"], "%Y-%m-%d").date()
        new_task = Task(name=name, description=description, date=date)
        db.session.add(new_task)
        db.session.commit()
        message = "Task added successfully"
        task = new_task
    elif request.method == "DELETE":
        task = Task.query.get(id)
        db.session.delete(task)
        db.session.commit()
        message = f"Task {task.id} deleted successfully"
        flash(message)
        return jsonify(message)
    elif request.method == "PATCH":
        task = Task.query.get(id)
        form_data = request.form.to_dict()
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
        if form_data.get("added_by"):
            task.added_by = form_data.get("added_by")
        if form_data.get("template") == "on":
            task.template = True
        else:
            task.template = False

        db.session.commit()
        message = f"Task {task.id} updated successfully"
        return jsonify({'message': message, 'category': 'success'})
    return render_template("detail_task.html", task=task, message=message)

@tasks.route("/tasks/dump")
@login_required
def dump_tasks():
    tasks = Task.query.all()
    return jsonify([task.to_dict() for task in tasks])

@tasks.route("/tasks/load", methods=["POST"])
@login_required
def load_tasks():
    message = "Importing tasks"
    category = "information"
    count = 1
    data = request.json
    for event_data in data:
        message += f"\nTask {count}: "

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
            event = Task(
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

## Templates


@tasks.route("/templates")
@login_required
def template_list():
    tasks = Task.query.filter(Task.templates != None).all()
    templates = Template.query.all()
    return render_template("templates.html", tasks=tasks, templates=templates)


@tasks.route("/templates/<int:id>")
@login_required
def template_detail(id):
    template = Template.query.get(id)
    return render_template("detail_template.html", template=template)


@tasks.route("/template/<int:id>/add-task", methods=["GET", "POST"])
@login_required
def template_add_task(id):
    if request.method == "POST":
        task_id = request.form.get("task_id")
        template_id = id

        if task_id:
            task = Task.query.get(id)
            task.templates.append(Template.query.get(template_id))
            db.session.commit()
            return task.jsonify()
    flash("Get not currently supported")
    return redirect(url_for("tasks.templates"))


@tasks.route("/template/<int:id>/tasks", methods=["GET", "POST"])
def template_tasks_api(id):
    if request.method == "GET":
        if id == 0:
            tasks = Task.query.filter(Task.templates != None).all()
        else:
            template = Template.query.get(id)
            tasks = template.tasks
        return jsonify([task.to_dict() for task in tasks])
    elif request.method == "POST":
        task_id = request.form.get("task_id")
        template_id = id

        if task_id:
            task = Task.query.get(id)
            task.templates.append(Template.query.get(template_id))
            db.session.commit()
            return task.jsonify()


@tasks.route("/template/task", methods=["POST"])
def template_task_api():
    if request.method == "POST":
        print(request.form.to_dict())
        task_id = request.form.get("task_id")
        raw_date = request.form.get("date")
        if raw_date:
            date = datetime.strptime(raw_date, "%Y-%m-%d").date()
        base_task = Task.query.get(task_id)

        if base_task:
            new_task = Task(
                name=base_task.name,
                description=base_task.description,
                date=date,
                added_by="Template API",
                template=False,
            )
            db.session.add(new_task)
            db.session.commit()

            return jsonify(str(new_task))

    return jsonify({"error": "Invalid data"}), 422
