import BaseModel from './base.model.js';
import { DataTypes } from 'sequelize';

class Note extends BaseModel {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      content: DataTypes.TEXT,
      date: DataTypes.DATEONLY,
      added_by: {
        type: DataTypes.STRING(30),
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'Note',
      tableName: 'notes',
      timestamps: true
    });
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'added_by',
      targetKey: 'username'
    });
  }
}

export default Note;