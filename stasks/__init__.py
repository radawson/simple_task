import os
from flask import Flask
from flask_migrate import Migrate
from flask_login import LoginManager
from dotenv import load_dotenv
from .models import db, seed_db
from .routes import auth, calendar, main, meals, notes, tasks, events, test, times


version = "0.2.1"

def create_app():
    # Initialize Flask app
    app = Flask(__name__)
    app.__version__ = version
    load_dotenv()
    # Set up the SQLAlchemy database URI
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tasks.db"
    # Set up the SQLAlchemy track modifications
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    # Add secret key for CSRF protection
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

    # Initialize the database with the app
    db.init_app(app)
    # Initialize Migrate with the app and the database
    migrate = Migrate(app, db)

    # Initialize the login manager
    login_manager = LoginManager()
    login_manager.login_view = "auth.login"
    login_manager.init_app(app)

    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        # since the user_id is just the primary key of our user table, use it in the query for the user
        return User.query.get(int(user_id))

    # Create all the database tables within the app context
    with app.app_context():
        db.create_all()

    # Register the blueprints
    app.register_blueprint(auth)
    app.register_blueprint(calendar)
    app.register_blueprint(events)
    app.register_blueprint(main)
    app.register_blueprint(meals)
    app.register_blueprint(notes)
    app.register_blueprint(tasks)
    app.register_blueprint(test)
    app.register_blueprint(times)

    @app.cli.command("seed-db")
    def seed_db_command():
        print(seed_db())

    # Run the app
    if __name__ == "__main__":
        db.create_all()
        app.run(debug=True)

    return app
