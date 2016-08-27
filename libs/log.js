module.exports = {
  info: function logInfo() {
    if (process.env.NODE_ENV !== 'test') {
      console.log.apply(console, arguments);
    }
  },
  warn: function logInfo() {
    console.log.apply(console, arguments);
  },
  error: function logInfo() {
    console.log.apply(console, arguments);
  },
  debug: function logInfo() {
    console.log.apply(console, arguments);
  }
}
