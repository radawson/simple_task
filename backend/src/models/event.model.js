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
                allowNull: false,
                field: 'title'
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            dtstart: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                field: 'date_start'
            },
            dtend: {
                type: DataTypes.DATEONLY,
                allowNull: true,
                field: 'date_end'
            },
            timeStart: {
                type: DataTypes.TIME,
                allowNull: true,
                field: 'time_start'
            },
            timeEnd: {
                type: DataTypes.TIME,
                allowNull: true,
                field: 'time_end'
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
                    return raw ? JSON.parse(raw) : [];
                },
                set(value) {
                    this.setDataValue('participants', JSON.stringify(value || []));
                }
            },
            status: {
                type: DataTypes.ENUM('CONFIRMED', 'TENTATIVE', 'CANCELLED'),
                defaultValue: 'CONFIRMED'
            },
            organizer: {
                type: DataTypes.STRING(50),
                allowNull: true,
                field: 'person'
            },
            transp: {
                type: DataTypes.ENUM('OPAQUE', 'TRANSPARENT'),
                defaultValue: 'OPAQUE'
            },
            class: {
                type: DataTypes.STRING,
                allowNull: true,
                field: 'classification'
            },
            priority: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            url: {
                type: DataTypes.STRING(500),
                allowNull: true
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