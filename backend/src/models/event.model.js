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
            summary: {
                type: DataTypes.STRING(200),
                allowNull: false
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            date_start: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                set(value) {
                    // Handle ISO date string format
                    if (typeof value === 'string') {
                        const date = new Date(value);
                        this.setDataValue('date_start', date.toISOString().split('T')[0]);
                    } else {
                        this.setDataValue('date_start', value);
                    }
                }
            },
            date_end: {
                type: DataTypes.DATEONLY,
                allowNull: true,
                set(value) {
                    if (typeof value === 'string') {
                        const date = new Date(value);
                        this.setDataValue('date_end', date.toISOString().split('T')[0]);
                    } else {
                        this.setDataValue('date_end', value);
                    }
                }
            },
            time_start: {
                type: DataTypes.STRING(5),
                allowNull: true
            },
            time_end: {
                type: DataTypes.STRING(5),
                allowNull: true
            },
            location: {
                type: DataTypes.STRING(200),
                allowNull: true
            },
            participants: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: [],
                get() {
                    const raw = this.getDataValue('participants');
                    if (!raw) return [];
                    try {
                        return typeof raw === 'string' ? JSON.parse(raw) : raw;
                    } catch (e) {
                        return [];
                    }
                },
                set(value) {
                    try {
                        const toStore = Array.isArray(value) ? value : [];
                        this.setDataValue('participants', JSON.stringify(toStore));
                    } catch (e) {
                        this.setDataValue('participants', '[]');
                    }
                }
            },
            status: {
                type: DataTypes.ENUM('CONFIRMED', 'TENTATIVE', 'CANCELLED'),
                defaultValue: 'CONFIRMED'
            },
            organizer: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            transp: {
                type: DataTypes.ENUM('OPAQUE', 'TRANSPARENT'),
                defaultValue: 'OPAQUE'
            },
            classification: {
                type: DataTypes.STRING,
                allowNull: true
            },
            priority: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            url: {
                type: DataTypes.STRING(500),
                allowNull: true
            },
            added_by: {
                type: DataTypes.STRING(30),
                allowNull: true
            },
            calendar_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            }
        }, {
            sequelize,
            modelName: 'Event',
            tableName: 'events',
            timestamps: true,
            underscored: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        });
    }

    static fromICalEvent(icalEvent) {
        return {
            summary: icalEvent.summary,
            description: icalEvent.description,
            date_start: icalEvent.start,
            date_end: icalEvent.end,
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
            start: this.date_start,
            end: this.date_end,
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
            as: 'Organizer',  
            foreignKey: 'organizer',
            targetKey: 'id'
        });
        this.belongsTo(models.Calendar, {
            foreignKey: 'calendarId',
            as: 'calendar'
        });
        this.belongsToMany(models.Person, {
            through: 'EventParticipants',
            foreignKey: 'eventId',
            as: 'participants'
        });
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