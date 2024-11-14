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
                allowNull: true // Allow null for template tasks
            },
            template: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            templateId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                field: 'template_id'
            },
            addedBy: {
                type: DataTypes.STRING(30),
                field: 'added_by'
            }
        }, {
            sequelize,
            modelName: 'Task',
            tableName: 'tasks'
        });
    }

    static associate(models) {
        this.belongsTo(models.Template, {
            foreignKey: 'templateId',
            as: 'sourceTemplate'
        });
    }
}

export default Task;