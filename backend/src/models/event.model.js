import BaseModel from './base.model.js';
import { DataTypes } from 'sequelize';

class Event extends BaseModel {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            // Custom fields
            completed: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            addedBy: {
                type: DataTypes.STRING(30),
                field: 'added_by'
            },
            participants: {
                type: DataTypes.JSON,  // Changed from ARRAY to JSON for flexibility
                defaultValue: [],
                field: 'participants',
                validate: {
                    isValidParticipants(value) {
                        if (!Array.isArray(value) && typeof value !== 'string') {
                            throw new Error('Participants must be an array or string');
                        }
                        if (Array.isArray(value)) {
                            value.forEach(participant => {
                                if (typeof participant === 'object' && (!participant.firstName || !participant.lastName)) {
                                    throw new Error('Person objects must have firstName and lastName');
                                }
                                if (typeof participant !== 'object' && typeof participant !== 'string') {
                                    throw new Error('Participants must be Person objects or strings');
                                }
                            });
                        }
                    }
                }
            },
            // iCal standard fields
            summary: {
                type: DataTypes.STRING(200),
                allowNull: false,
                field: 'name'
            },
            description: DataTypes.TEXT,
            dtstart: {
                type: DataTypes.DATEONLY,
                field: 'date_start',
                allowNull: false
            },
            dtend: {
                type: DataTypes.DATEONLY,
                field: 'date_end'
            },
            timeStart: {
                type: DataTypes.TIME,
                field: 'time_start'
            },
            timeEnd: {
                type: DataTypes.TIME,
                field: 'time_end'
            },
            location: DataTypes.STRING(200),
            uid: {
                type: DataTypes.STRING(200),
                field: 'ical_uid',
                unique: true
            },
            sequence: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            status: {
                type: DataTypes.ENUM('CONFIRMED', 'TENTATIVE', 'CANCELLED'),
                defaultValue: 'CONFIRMED'
            },
            rrule: {
                type: DataTypes.STRING(200),
                field: 'recurrence_rule'
            },
            categories: {
                type: DataTypes.JSON,
                defaultValue: [],
                get() {
                    const rawValue = this.getDataValue('categories');
                    return rawValue ? JSON.parse(rawValue) : [];
                },
                set(value) {
                    this.setDataValue('categories', JSON.stringify(value));
                }
            },
            priority: {
                type: DataTypes.INTEGER,
                validate: {
                    min: 0,
                    max: 9
                }
            },
            url: DataTypes.STRING(500),
            organizer: {
                type: DataTypes.STRING(50),
                allowNull: false,
                field: 'person'
            },
            transp: {
                type: DataTypes.ENUM('OPAQUE', 'TRANSPARENT'),
                defaultValue: 'OPAQUE'
            },
            class: {
                type: DataTypes.ENUM('PUBLIC', 'PRIVATE', 'CONFIDENTIAL'),
                defaultValue: 'PUBLIC',
                field: 'classification'
            }
        }, {
            sequelize,
            modelName: 'Event',
            tableName: 'events',
            timestamps: true
        });
    }

    static fromICalEvent(icalEvent) {
        return {
            summary: icalEvent.summary,
            description: icalEvent.description,
            dtstart: icalEvent.start,
            dtend: icalEvent.end,
            location: icalEvent.location,
            uid: icalEvent.uid,
            status: icalEvent.status,
            sequence: icalEvent.sequence,
            rrule: icalEvent.rrule,
            categories: icalEvent.categories,
            priority: icalEvent.priority,
            url: icalEvent.url,
            organizer: icalEvent.organizer,
            transp: icalEvent.transp,
            class: icalEvent.class
        };
    }

    toICalEvent() {
        return {
            summary: this.summary,
            description: this.description,
            start: this.dtstart,
            end: this.dtend,
            location: this.location,
            uid: this.uid,
            status: this.status,
            sequence: this.sequence,
            rrule: this.rrule,
            categories: this.categories,
            priority: this.priority,
            url: this.url,
            organizer: this.organizer,
            transp: this.transp,
            class: this.class,
            created: this.createdAt,
            lastModified: this.updatedAt
        };
    }

    static associate(models) {
        this.belongsTo(models.User, {
            foreignKey: 'added_by',
            targetKey: 'username'
        });
        this.belongsTo(models.Person, {
            foreignKey: 'person',
            targetKey: 'id'
        });
        this.belongsTo(models.Calendar);
    }

    getParticipantNames() {
        if (typeof this.participants === 'string') {
            return this.participants;
        }
        return this.participants.map(p => {
            if (typeof p === 'string') return p;
            return `${p.firstName} ${p.lastName}`;
        }).join(', ');
    }

    addParticipant(participant) {
        if (!Array.isArray(this.participants)) {
            this.participants = [];
        }
        this.participants.push(participant);
    }

    removeParticipant(participant) {
        if (!Array.isArray(this.participants)) return;

        if (typeof participant === 'string') {
            this.participants = this.participants.filter(p =>
                typeof p === 'string' ? p !== participant :
                    `${p.firstName} ${p.lastName}` !== participant
            );
        } else {
            this.participants = this.participants.filter(p =>
                typeof p === 'string' ? true :
                    p.firstName !== participant.firstName ||
                    p.lastName !== participant.lastName
            );
        }
    }
}

export default Event;