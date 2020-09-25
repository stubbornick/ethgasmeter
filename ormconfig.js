module.exports = {
  type: 'sqlite',
  database: process.env.SQLITE_DATABASE_PATH || 'data/db.sqlite',
  entities: ['dist/**/**.entity.js'],
  synchronize: true,
  logging: process.env.TYPEORM_LOGGING === 'true',
};
