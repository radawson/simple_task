module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Task', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: DataTypes.TEXT,
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      priority: DataTypes.INTEGER,
      template: DataTypes.BOOLEAN,
      added_by: DataTypes.STRING
    }, {
      tableName: 'tasks',
      timestamps: true,
    });
  };