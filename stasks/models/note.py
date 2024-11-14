from .database import db

class Note(db.Model):
    __tablename__ = "notes"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text)
    date = db.Column(db.Date)
    added_by = db.Column(db.String(30), nullable=True)