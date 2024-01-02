from .database import db

task_to_templates = db.Table(
    "task_to_templates",
    db.Column("task_id", db.Integer, db.ForeignKey("tasks.id")),
    db.Column("template_id", db.Integer, db.ForeignKey("templates.id")),
)

class Task(db.Model):
    __tablename__ = "tasks"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    date = db.Column(db.Date)
    completed = db.Column(db.Boolean, nullable=False, default=False)
    priority = db.Column(db.Integer, default=0)
    added_by = db.Column(db.String(30), nullable=True)
    template = db.Column(db.Boolean, nullable=False, default=False)
    templates = db.relationship('Template', secondary=task_to_templates, backref=db.backref('tasks', lazy='dynamic'))

    def __repr__(self):
        return f"<Task {self.id}: {self.name}>"


class Template(db.Model):
    __tablename__ = "templates"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    added_by = db.Column(db.String(30), nullable=True)

    def __repr__(self):
        return f"<Template {self.id}: {self.name}>"
    
    def __str__(self):
        return f"{self.name}"