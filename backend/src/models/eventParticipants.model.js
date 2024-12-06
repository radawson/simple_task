// src/models/eventParticipants.model.js

import { DataTypes, Model } from 'sequelize';

class EventParticipants extends Model {
  static init(sequelize) {
    return super.init(
      {
        eventId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
        },
        personId: {
          type: DataTypes.UUID,
          primaryKey: true,
        },
      },
      {
        sequelize,
        modelName: 'EventParticipants',
        tableName: 'event_participants',
        timestamps: false,
      }
    );
  }
}

export default EventParticipants;