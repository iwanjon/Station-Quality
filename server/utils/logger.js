// // import winston from 'winston';  // Importing winston using ES module syntax

// // // Create a logger instance
// // const logger = winston.createLogger({
// //   level: 'info',  // Set the default log level to 'info'
// //   transports: [
// //     // Log to console
// //     new winston.transports.Console({
// //       format: winston.format.combine(
// //         winston.format.colorize(),
// //         winston.format.simple()
// //       ),
// //     }),
// //     // Log to a file
// //     new winston.transports.File({
// //       filename: '../app.log',
// //       level: 'info',  // You can change this to 'debug', 'warn', etc.
// //       format: winston.format.combine(
// //         winston.format.timestamp(),
// //         winston.format.json()
// //       ),
// //     }),
// //   ],
// // });

// // // Export the logger as the default export
// // export default logger;



// // logger.js
// import winston from 'winston';

// // Custom format to include the stack trace in the log entry
// // const errorStackFormat = winston.format.printf(({ timestamp, level, message, stack }) => {
// //   return stack
// //     ? `${timestamp} ${level}: ${message}\n${stack}`  // If it's an error, log the stack trace
// //     : `${timestamp} ${level}: ${message}`;  // Otherwise, just log the message
// // });

// // Create a logger with custom error logging format
// const createLogger = () => {
//   return winston.createLogger({
//     level: 'info',
//     transports: [
//       new winston.transports.Console({
//         format: winston.format.combine(
//           winston.format.colorize(),
//           winston.format.timestamp(),
//         ),
//       }),
//       new winston.transports.File({
//         filename: '../app.log',
//         level: 'info',
//         format: winston.format.combine(
//           winston.format.timestamp(),
//         ),
//       }),
//     ],
//     exceptionHandlers: [
//       new winston.transports.Console({
//         format: winston.format.combine(
//           winston.format.colorize(),
//           winston.format.timestamp(),
//         ),
//       }),
//       new winston.transports.File({
//         filename: '../app.log',
//         format: winston.format.combine(
//           winston.format.timestamp(),
//         ),
//       })
//     ],
//     rejectionHandlers: [
//       new winston.transports.Console({
//         format: winston.format.combine(
//           winston.format.colorize(),
//           winston.format.timestamp(),
//         ),
//       }),
//       new winston.transports.File({
//         filename: '../app.log',
//         format: winston.format.combine(
//           winston.format.timestamp(),
//         ),
//       })
//     ],
//     exitOnError: false, // Prevent process exit after handled errors
//   });
// };

// const logger = createLogger();
// export default logger;




import winston from 'winston';

const consoleFmt = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) =>
    stack
      ? `${timestamp} [${level}] ${message}\n${stack}`
      : `${timestamp} [${level}] ${message}${Object.keys(meta).length ? " " + JSON.stringify(meta) : ""}`
  )
);

const fileJson = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const createLogger = () => winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ format: consoleFmt }),
    new winston.transports.File({
      filename: '../app.log', // keep if this path is correct for your CWD
      level: 'info',
      format: fileJson,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({ format: consoleFmt }),
    new winston.transports.File({ filename: '../app.log', format: fileJson }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({ format: consoleFmt }),
    new winston.transports.File({ filename: '../app.log', format: fileJson }),
  ],
  exitOnError: false,
});

const logger = createLogger();
export default logger;
