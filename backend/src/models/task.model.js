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
            date: DataTypes.DATEONLY,
            template: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
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
        if (models.Template) {
            this.belongsToMany(models.Template, {
                through: 'TaskTemplates',
                foreignKey: 'taskId',
                otherKey: 'templateId'
            });
        }
    }
}

export default Task;