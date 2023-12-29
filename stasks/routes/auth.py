from flask import flash
from flask import Blueprint, redirect, render_template, request, url_for
from flask_login import login_user, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
from stasks.models import db, User

auth = Blueprint("auth", __name__)


@auth.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        remember = True if request.form.get("remember") else False

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password, password):
            flash("Please check your login details and try again.")
            return redirect(url_for("auth.login"))

        login_user(user, remember=remember)
        return redirect(url_for("main.index"))
    return render_template("login.html")


@auth.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        email = request.form.get("email")
        username = request.form.get("username")
        password = request.form.get("password")
        first_name = request.form.get("first_name")
        last_name = request.form.get("last_name")
        if not first_name:
            first_name = username.split()[0]
        print(request.form.get('admin'))
        if request.form.get("admin"):
            admin = True
        else:
            admin = False
        user = User.query.filter_by(
            username=username
        ).first()  # if this returns a user, then the email already exists in database

        if user:
            flash("Username already exists")
            return redirect(url_for("auth.register"))

        new_user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            username=username,
            password=generate_password_hash(password),
            admin=admin
        )
        db.session.add(new_user)
        db.session.commit()

        return redirect(url_for("auth.login"))
    return render_template("signup.html")


@auth.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("main.index"))
