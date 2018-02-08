export class Log {
  public static info(...args: any[]) {
    if (process.env.NODE_ENV !== 'test') {
      console.log(...args);
    }
  }

  public static warn(...args: any[]) {
    console.log(...args);  }

  public static error(...args: any[]) {
    console.log(...args);  }

  public static debug(...args: any[]) {
    console.log(...args);  }
}
