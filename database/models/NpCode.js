const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
const BaseModel = require('../BaseModel');

class NpCode extends BaseModel {
    static init(sequelize) {
        super.init(
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                code: { type: DataTypes.STRING(8), allowNull: false, unique: true },
                duration: { type: DataTypes.STRING, allowNull: false },
                durationMs: { type: DataTypes.BIGINT, allowNull: true },
                createdBy: { type: DataTypes.STRING, allowNull: false },
                createdByUsername: { type: DataTypes.STRING, allowNull: false },
                expiresAt: { type: DataTypes.DATE, allowNull: false },
                claimedBy: { type: DataTypes.STRING, allowNull: true },
                claimedByUsername: { type: DataTypes.STRING, allowNull: true },
                claimedAt: { type: DataTypes.DATE, allowNull: true },
                isUsed: { type: DataTypes.BOOLEAN, defaultValue: false },
            },
            {
                sequelize,
                modelName: 'NpCode',
                tableName: 'np_codes',
                timestamps: true,
            }
        );

        return this;
    }

    static generateCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    static async findValidCode(code) {
        const record = await this.findOne({ 
            where: { 
                code: code.toUpperCase(),
                isUsed: false 
            } 
        });
        
        if (!record) return null;
        
        if (new Date() > new Date(record.expiresAt)) {
            await record.destroy();
            return null;
        }
        
        return record;
    }
}

NpCode.init(sequelize);

module.exports = NpCode;
