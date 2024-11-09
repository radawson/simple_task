const { Model } = require('sequelize');

class BaseModel extends Model {
  static init(attributes, options) {
    return super.init(attributes, {
      ...options,
      underscored: true,
      timestamps: true
    });
  }
}

module.exports = BaseModel;