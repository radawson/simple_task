import BaseModel from './base.model.js';
import { DataTypes } from 'sequelize';

class Timecard extends BaseModel {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            timeIn: {
                type: DataTypes.DATE,
                allowNull: false,
                field: 'time_in',
                validate: {
                    isDate: true
                }
            },
            timeOut: {
                type: DataTypes.DATE,
                field: 'time_out',
                validate: {
                    isDate: true,
                    isAfterTimeIn(value) {
                        if (value && value <= this.timeIn) {
                            throw new Error('Time out must be after time in');
                        }
                    }
                }
            },
            breakStart: {
                type: DataTypes.DATE,
                field: 'break_start'
            },
            breakEnd: {
                type: DataTypes.DATE,
                field: 'break_end',
                validate: {
                    isAfterBreakStart(value) {
                        if (value && this.breakStart && value <= this.breakStart) {
                            throw new Error('Break end must be after break start');
                        }
                    }
                }
            },
            notes: DataTypes.TEXT,
            approved: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            approvedBy: {
                type: DataTypes.STRING(30),
                field: 'approved_by'
            },
            approvedAt: {
                type: DataTypes.DATE,
                field: 'approved_at'
            }
        }, {
            sequelize,
            modelName: 'Timecard',
            tableName: 'timecards',
            timestamps: true,
            hooks: {
                beforeUpdate: (timecard) => {
                    if (timecard.changed('approved') && timecard.approved) {
                        timecard.approvedAt = new Date();
                    }
                }
            }
        });
    }

    // Helper methods for time calculations
    getTotalHours() {
        if (!this.timeOut) return 0;
        
        let total = (this.timeOut - this.timeIn) / 3600000; // Convert ms to hours
        
        if (this.breakStart && this.breakEnd) {
            total -= (this.breakEnd - this.breakStart) / 3600000;
        }
        
        return Math.round(total * 100) / 100; // Round to 2 decimal places
    }

    getStatus() {
        if (this.approved) return 'Approved';
        if (this.timeOut) return 'Completed';
        if (this.timeIn) return 'In Progress';
        return 'Not Started';
    }

    static associate(models) {
        this.belongsTo(models.Person, {
            foreignKey: 'employee_id',
            as: 'employee'
        });
        
        this.belongsTo(models.User, {
            foreignKey: 'approved_by',
            targetKey: 'username',
            as: 'supervisor'
        });
    }
}

export default Timecard;