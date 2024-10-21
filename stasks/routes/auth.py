from datetime import datetime
from sqlite3 import IntegrityError
from flask import flash, jsonify
from flask import Blueprint, redirect, render_template, request, url_for
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
from stasks.models import db, User
from flask import current_app
from logger import Logger

logger = Logger().get_logger()

auth = Blueprint("auth", __name__)

@auth.before_app_request
def setup_oidc():
    """Ensure OIDC is set up properly."""
    if not hasattr(auth, 'oidc'):
        auth.oidc = current_app.oidc

# Traditional Username/Password Login
@auth.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        # Handle traditional login
        username = request.form.get("username").lower()
        password = request.form.get("password")
        remember = True if request.form.get("remember") else False

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password, password):
            flash("Please check your login details and try again.", "danger")
            return redirect(url_for("auth.login"))

        login_user(user, remember=remember)
        return redirect(url_for("main.index"))
    
    # If GET request, render the login page with options
    return render_template("login.html")

# New Route for OIDC-based Login
@auth.route("/oidc_login")
def oidc_login():
    oidc = auth.oidc
    logger.debug("Entering OIDC login route.")
    
    if oidc.user_loggedin:
        logger.debug("User successfully logged in via OIDC.")
        
        # Extract user info and roles from OIDC
        oidc_user_info = oidc.user_getinfo(["email", "sub", "roles"])
        email = oidc_user_info.get("email")
        sub = oidc_user_info.get("sub")
        roles = oidc_user_info.get("roles", [])

        logger.debug(f"OIDC user email: {email}, roles: {roles}")

        # Check if 'admin' role is present in roles
        is_admin = 'admin' in roles

        # Check if the user already exists in the database
        user = User.query.filter_by(email=email).first()
        if not user:
            # Register a new user if they do not exist
            user = User(
                first_name=email.split('@')[0],
                email=email,
                username=email.split('@')[0],
                oidc_sub=sub,
                password="",  # No password needed for OIDC users
                admin=is_admin
            )
            db.session.add(user)
            db.session.commit()
            logger.debug(f"New user registered: {user.username}, admin: {is_admin}")
        else:
            # Update the admin flag if the user already exists
            user.admin = is_admin
            db.session.commit()
            logger.debug(f"Existing user updated: {user.username}, admin: {is_admin}")

        login_user(user)
        flash("Successfully logged in with Keycloak!", "success")
        return redirect(url_for("main.index"))
    
    return redirect(url_for("auth.login"))

@auth.route('/oidc_callback')
def oidc_callback():
    oidc = auth.oidc
    # Handle the callback logic here, e.g., finalize login
    if oidc.user_loggedin:
        return redirect(url_for('main.index'))
    return redirect(url_for('auth.oidc_login'))

@auth.route('/password', methods=['POST'])
@login_required
def password():
    if request.method == "POST":
        username = request.form.get("username").lower()
        password = request.form.get("password")
        new_password = request.form.get("new_password")
        confirm_password = request.form.get("confirm_password")
        if new_password != confirm_password:
            flash("New password and confirm password do not match.","danger")
            return redirect(url_for("main.profile"))
        user = User.query.filter_by(username=username).first()
        if not user or not check_password_hash(user.password, password):
            flash("Please check your current password and try again.", "danger")
            return redirect(url_for("main.profile"))
        user.password = generate_password_hash(new_password)
        db.session.commit()
        flash("Password changed successfully.", "success")
        return redirect(url_for("main.profile"))


@auth.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        email = request.form.get("email")
        username = request.form.get("username").lower()
        password = request.form.get("password")
        first_name = request.form.get("first_name")
        last_name = request.form.get("last_name")
        admin = True if request.form.get("admin") else False
        employee = True if request.form.get("employee") else False

        user = User.query.filter_by(username=username).first()
        if user:
            flash("Username already exists", "warning")
            return redirect(url_for("auth.register"))

        new_user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            username=username,
            password=generate_password_hash(password),
            admin=admin,
            employee=employee,
        )
        db.session.add(new_user)
        db.session.commit()
        flash("Account created successfully", "success")

        if current_user.is_authenticated:
            return redirect(url_for("main.index"))
        else:
            return redirect(url_for("auth.login"))
    return render_template("signup.html")


@auth.route("/logout")
@login_required
def logout():
    oidc = auth.oidc
    logout_user()
    if oidc.user_loggedin:
        oidc.logout()
        return redirect(url_for("auth.oidc_logout"))
    return redirect(url_for("main.index"))

@auth.route("/oidc_logout")
def oidc_logout():
    oidc = auth.oidc
    oidc.logout()
    return redirect(url_for("main.index"))

@auth.route("/users")
@login_required
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@auth.route("/user/<int:user_id>", methods=["GET", "PATCH", "DELETE"])
@login_required
def user_api(user_id):
    message = {"message": "User not found", "category": "warning"}
    if request.method == "GET":
        users = User.query.get(user_id)
        return jsonify([user.to_dict() for user in users])
    elif request.method == "PATCH":
        print(request.form.to_dict())
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found",
                            "category": "danger"}), 404
        if request.form.get("first_name"):
            user.first_name = request.form.get("first_name")
        if request.form.get("last_name"):
            user.last_name = request.form.get("last_name")
        if request.form.get("goes_by"):
            user.goes_by = request.form.get("goes_by")
        if request.form.get("email"):
            user.email = request.form.get("email")
        if request.form.get("username"):
            user.username = request.form.get("username")
        if request.form.get("phone"):
            user.phone = request.form.get("phone")
        if request.form.get("base_pay"):
            user.base_pay = request.form.get("base_pay")
        if request.form.get("address"):
            user.address = request.form.get("address")
        if request.form.get("city"):
            user.city = request.form.get("city")
        if request.form.get("state"):
            user.state = request.form.get("state")
        if request.form.get("zip_code"):
            user.zip_code = request.form.get("zip_code")
        if request.form.get("country"):
            user.country = request.form.get("country")
        if request.form.get("birthdate"):
            user.birthdate = datetime.strptime(request.form.get("birthdate"), "%Y-%m-%d"
            ).date()
        if request.form.get("info"):
            user.info = request.form.get("info")
        if request.form.get("admin") == "true":
            user.admin = True
        else:
            user.admin = False
        if request.form.get("employee") == "true":
            user.employee = True
        else:
            user.employee = False
        db.session.commit()
        message = {"message": f"User {user.id} updated successfully", "category": "success"}
    elif request.method == "DELETE":
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found",
                            "category": "danger"}), 404
        try:
            db.session.delete(user)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            message = {"message": f"User {user.id} could not be deleted\n{e}", "category": "danger"}
        else:
            message = {"message": f"User {user.id} deleted successfully", "category": "success"}
    return jsonify(message)

@auth.route("/users/dump")
@login_required
def dump_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@auth.route("/users/load", methods=["POST"])
@login_required
def load_users():
    message = "Importing users"
    category = "information"
    count = 1
    data = request.json
    for event_data in data:
        message += f"\nUser {count}: "
        try:
            event = User(
                name=event_data["name"],
                description=event_data["description"],
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