const winston = require('winston');

const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (stack) msg += `\n${stack}`;
          if (Object.keys(meta).length > 0) msg += ` ${JSON.stringify(meta)}`;
          return msg;
        })
      ),
    }),
  ],
});

module.exports = logger;
