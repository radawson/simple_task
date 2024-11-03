from datetime import datetime
from sqlite3 import IntegrityError
from flask import flash, jsonify
from flask import Blueprint, current_app, redirect, render_template, request, url_for, session
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
from stasks.models import db, User
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
    # If already logged in, redirect to index
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        remember = True if request.form.get("remember") else False

        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user, remember=remember)
            next_page = request.args.get('next')
            return redirect(next_page or url_for("main.index"))
            
        flash("Invalid username or password", "danger")
        return redirect(url_for("auth.login"))

    # Show login page with both options
    return render_template("login.html", enable_sso=current_app.config.get('ENABLE_SSO'))


@auth.route("/oidc_login")
def oidc_login():
    if not current_app.config.get('ENABLE_SSO'):
        flash("SSO login is not enabled", "danger")
        return redirect(url_for("auth.login"))
    return current_app.oidc.redirect_to_auth_server()

@auth.route('/oidc_callback')
def oidc_callback():
    info = current_app.oidc.user_getinfo(['email', 'preferred_username'])
    
    user = User.query.filter_by(email=info.get('email')).first()
    if not user:
        # Create new user from OIDC info
        user = User(
            username=info.get('preferred_username'),
            email=info.get('email'),
            admin=True  # Make SSO users administrators
        )
        db.session.add(user)
        db.session.commit()
    else:
        # Temporarily promote existing user to admin for this session
        session['admin'] = True
    
    login_user(user)
    return redirect(url_for('main.index'))

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
    if current_app.config.get('ENABLE_SSO') and current_app.oidc.user_loggedin:
        logout_user()
        session.clear()
        return current_app.oidc.logout()
    
    logout_user()
    session.clear()
    return redirect(url_for("main.index"))

@auth.route("/oidc_logout")
def oidc_logout():
    oidc = auth.oidc
    logger.debug("Performing OIDC logout...")
    
    # Call the OIDC logout method, which should redirect to Keycloak's logout endpoint
    oidc.logout()
    
    # Redirect back to the main page after OIDC logout
    flash("Successfully logged out from Keycloak.", "success")
    return redirect(url_for("main.index"))

@auth.route('/oidc_logout_callback')
def oidc_logout_callback():
    return redirect(url_for('index'))

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