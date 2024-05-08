import winston, { transports, format } from 'winston';

const logger = winston.createLogger({
  level: 'debug',
  transports: [new transports.Console()],
  format: format.cli(),
});

export default logger;
