// src/models/person.model.js
const BaseModel = require('./base.model');
const { DataTypes } = require('sequelize');

class Person extends BaseModel {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            firstName: {
                type: DataTypes.STRING(20),
                allowNull: false,
                field: 'first_name'
            },
            lastName: {
                type: DataTypes.STRING(20),
                field: 'last_name'
            },
            email: DataTypes.STRING,
            isAdmin: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: 'is_admin'
            }
        }, {
            sequelize,
            modelName: 'Person',
            tableName: 'persons'
        });
    }

    static associate(models) {
        this.hasMany(models.Timecard);
        this.hasMany(models.Event);
    }
}

class User extends BaseModel {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            firstName: {
                type: DataTypes.STRING(20),
                allowNull: false,
                field: 'first_name'
            },
            lastName: {
                type: DataTypes.STRING(20),
                field: 'last_name'
            },
            email: DataTypes.STRING,
            isAdmin: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: 'is_admin'
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            host: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            type: {
                type: DataTypes.ENUM('account', 'roster'),
                allowNull: true,
            },
            owner: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            }
        }, {
            sequelize,
            modelName: 'User',
            tableName: 'users',
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ['username', 'host'],
                }
            ]
        });
    }

    static associate(models) {
        this.hasMany(models.Timecard);
        this.hasMany(models.Event);
        this.belongsTo(models.User, { foreignKey: 'owner', as: 'ownedBy' });
    }
}

module.exports = { Person, User };