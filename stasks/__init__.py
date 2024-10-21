import os
from flask import Flask, redirect, url_for, request
from flask_migrate import Migrate
from flask_login import LoginManager, current_user
from flask_cors import CORS
from flask_oidc import OpenIDConnect
from dotenv import load_dotenv
from logger import Logger
from .models import db, seed_db
from .routes import auth, calendar, main, meals, notes, tasks, events, test, times

version = "0.3.2"

logger = Logger().get_logger()

def create_app():
    logger.debug("Initializing Flask app...")

    # Initialize Flask app
    app = Flask(__name__)
    app.config['DEBUG'] = True
    app.config['PROPAGATE_EXCEPTIONS'] = True
    logger.debug(f"Flask app initialized with version {version}")

    # Enable CORS
    CORS(app)
    logger.debug("CORS enabled")

    app.__version__ = version
    load_dotenv()

    # Set up the SQLAlchemy database URI
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tasks.db"
    logger.debug("SQLAlchemy configured with URI: sqlite:///tasks.db")

    # Set up the SQLAlchemy track modifications
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    logger.debug("SQLAlchemy track modifications disabled")

    # Add secret key for CSRF protection
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    logger.debug("Secret key loaded from environment")

    # OpenID Connect configurations
    app.config['OIDC_CLIENT_SECRETS'] = 'client_secrets.json'
    app.config['OIDC_COOKIE_SECURE'] = False
    app.config['OIDC_SCOPES'] = ['openid', 'email', 'profile']
    app.config['OIDC_INTROSPECTION_AUTH_METHOD'] = 'client_secret_post'
    logger.debug("OIDC configurations set")

    # Initialize the database with the app
    db.init_app(app)
    logger.debug("Database initialized with Flask app")

    # Initialize Migrate with the app and the database
    migrate = Migrate(app, db)
    logger.debug("Migrate initialized")

    # Initialize OIDC
    # oidc = OpenIDConnect(app)
    # app.oidc = oidc
    # logger.debug("OIDC initialized")

    # Initialize the login manager
    login_manager = LoginManager()
    login_manager.login_view = "auth.login"
    login_manager.init_app(app)
    logger.debug("Login manager initialized")

    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        user = User.query.get(int(user_id))
        logger.debug(f"User loaded: {user}")
        return user

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
    logger.debug("Blueprints registered")

    # Create all the database tables within the app context
    with app.app_context():
        db.create_all()
        logger.debug("Database tables created")

    @app.cli.command("seed-db")
    def seed_db_command():
        logger.debug("Seeding database...")
        print(seed_db())
        logger.debug("Database seeded")

    # Run the app
    if __name__ == "__main__":
        logger.debug("Running Flask app in debug mode")
        db.create_all()
        app.run(debug=True)

    return app
