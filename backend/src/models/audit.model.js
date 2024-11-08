const BaseModel = require('./base.model');
const { DataTypes } = require('sequelize');

class Audit extends BaseModel {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            action: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            tableName: {
                type: DataTypes.STRING(50),
                field: 'table_name'
            },
            recordId: {
                type: DataTypes.INTEGER,
                field: 'record_id'
            },
            oldValues: {
                type: DataTypes.JSON,
                field: 'old_values'
            },
            newValues: {
                type: DataTypes.JSON,
                field: 'new_values'
            },
            username: {
                type: DataTypes.STRING(30),
                allowNull: false
            },
            ipAddress: {
                type: DataTypes.STRING(45),
                field: 'ip_address'
            }
        }, {
            sequelize,
            modelName: 'Audit',
            tableName: 'audits'
        });
    }
}

module.exports = Audit;