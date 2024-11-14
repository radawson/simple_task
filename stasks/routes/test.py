from flask import Blueprint, redirect, render_template, request, url_for, flash
from flask_login import login_required

test = Blueprint('test', __name__)

@test.route('/modal', methods=['GET'])
@login_required
def modal():
    flash('This is a flash message')
    return render_template('test/modal.html')