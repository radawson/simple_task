from flask import Blueprint, jsonify, render_template, request
from flask_login import login_required
from stasks.models import Event, db, Person


meals = Blueprint("meals", __name__)


@meals.route("/meals", methods=["GET"])
def meals_all():
    return render_template("meals.html")