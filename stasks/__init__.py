from flask import Flask, render_template, request
from flask_migrate import Migrate
from datetime import datetime
from .models import db, Task, Event, Note
from .routes import notes, tasks, events

def create_app():
    # Initialize Flask app
    app = Flask(__name__)
    # Set up the SQLAlchemy database URI
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tasks.db"

    # Initialize the database with the app
    db.init_app(app)
    # Initialize Migrate with the app and the database
    migrate = Migrate(app, db)

    # Create all the database tables within the app context
    with app.app_context():
        db.create_all()

    # Define the route for the index page
    @app.route("/")
    def index():
        # Get the current date
        date = datetime.now().date()
        # Query the database for events, notes, and tasks for the current date
        events = Event.query.filter_by(date=date).all()
        notes = Note.query.filter_by(date=date).all()
        tasks = Task.query.filter_by(date=date).all()

        # If there are no events, set events to a default message
        if events == []:
            events = [{"name": "No events scheduled for today"}]
        if notes == []:
            notes = [{"title": "Nothing to show"}]
        if tasks == []:
            tasks = [{"name": "No tasks found for today"}]

        return render_template(
            "index.html", date=date, events=events, notes=notes, tasks=tasks
        )


    # Define the route for the date page
    @app.route("/date/<date>")
    def get_date(date):
        date = datetime.strptime(date, "%Y-%m-%d").date()
        tasks = Task.query.filter_by(date=date).all()
        events = Event.query.filter_by(date=date).all()
        return render_template("index.html", tasks=tasks, events=events)


    # Register the blueprints
    app.register_blueprint(notes)
    app.register_blueprint(tasks)
    app.register_blueprint(events)

    # Run the app
    if __name__ == "__main__":
        db.create_all()
        app.run(debug=True)

    return app
