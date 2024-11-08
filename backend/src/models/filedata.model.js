module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Filedata', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        sender: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        receiver: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        hash: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true,
        },
        size: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        filename: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
        }
    }, {
        tableName: 'filedata',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['sender', 'receiver', 'hash'],
            }
        ]
    });
};