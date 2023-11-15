from flask import Flask, render_template, request
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from models import db, Task, Event
from tasks import tasks
from events import events

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tasks.db"

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route("/")
def index():
    date = datetime.now().date()
    tasks = Task.query.filter_by(date=date).all()
    events = Event.query.filter_by(date=date).all()
    return render_template("index.html", tasks=tasks, events=events)

@app.route("/date/<date>")
def get_date(date):
    date = datetime.strptime(date, "%Y-%m-%d").date()
    tasks = Task.query.filter_by(date=date).all()
    events = Event.query.filter_by(date=date).all()
    return render_template("index.html", tasks=tasks, events=events)


app.register_blueprint(tasks)
app.register_blueprint(events)

if __name__ == "__main__":
    db.create_all()
    app.run(debug=True)
