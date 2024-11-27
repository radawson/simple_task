import BaseModel from './base.model.js';
import { DataTypes } from 'sequelize';

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
                field: 'first_name' // Maps to column 'first_name'
            },
            lastName: {
                type: DataTypes.STRING(20),
                field: 'last_name' // Maps to column 'last_name'
            },
            email: DataTypes.STRING,
            isAdmin: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: 'is_admin'
            },
            birthdate: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
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
                allowNull: true,
                field: 'first_name'
            },
            lastName: {
                type: DataTypes.STRING(20),
                field: 'last_name'
            },
            displayName: {
                type: DataTypes.STRING(30),
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: false,  
                validate: {
                    isEmail: true
                }
            },
            isAdmin: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: 'is_admin'
            },
            username: {
                type: DataTypes.STRING(30),
                allowNull: false,
                unique: true,  
                validate: {
                    notEmpty: true
                }
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
        this.hasMany(models.Event, { foreignKey: 'organizer', as: 'organizedEvents' });
        this.belongsTo(models.User, { foreignKey: 'owner', as: 'ownedBy' });
    }
}

export { Person, User };