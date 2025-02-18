// src/models/eventParticipants.model.js

import { DataTypes, Model } from 'sequelize';

class EventParticipants extends Model {
  static init(sequelize) {
    return super.init(
      {
        event_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          references: {
            model: 'events',
            key: 'id'
          }
        },
        person_id: {
          type: DataTypes.UUID,
          primaryKey: true,
          references: {
            model: 'persons',
            key: 'id'
          }
        }
      },
      {
        sequelize,
        modelName: 'EventParticipants',
        tableName: 'event_participants',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    // No direct associations needed as this is a junction table
  }
}

export default EventParticipants;