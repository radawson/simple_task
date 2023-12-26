from flask import Blueprint, redirect, render_template, request, url_for, flash
from flask_login import login_user, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
from stasks.models import  db, User

test = Blueprint('test', __name__)

@test.route('/modal', methods=['GET'])
def modal():
    flash('This is a flash message')
    return render_template('test/modal.html')