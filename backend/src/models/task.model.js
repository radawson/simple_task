import BaseModel from './base.model.js';
import { DataTypes } from 'sequelize';

class Task extends BaseModel {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING(200),
                allowNull: false
            },
            description: DataTypes.TEXT,
            completed: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            priority: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: true 
            },
            template: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            template_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            addedBy: {
                type: DataTypes.STRING(30),
                field: 'added_by',
                allowNull: true
            }
        }, {
            sequelize,
            modelName: 'Task',
            tableName: 'tasks'
        });
    }

    static associate(models) {
        // Many-to-Many relationship with Template
        this.belongsToMany(models.Template, {
            through: 'TaskTemplates',
            foreignKey: 'taskId',
            as: 'templates'
        });
    }
}

export default Task;