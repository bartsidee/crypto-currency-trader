import * as colors from "colors";
import * as _ from "lodash";
import { StringIterator } from "lodash";
import * as util from "util";

export enum LoggerLevel {
  DEBUG = "[DEBUG]",
  INFO = "[INFO]",
  WARN = "[WARM]",
  ERROR = "[ERROR]"
}

class LoggerHelper {
  private logger = (text: any) => {};
  private level: LoggerLevel = LoggerLevel.INFO;

  setLogLevel(level: LoggerLevel) {
    this.level = level;
  }

  setLogger(loggerMethod: (text: any) => void) {
    this.logger = loggerMethod;
  }

  private log(level: string, msg: any) {
    this.logger(`${level} ${this.formatMessage(msg)}`);
  }

  private formatMessage(msg: any) {
    if (!msg) {
      return "";
    }

    if (_.isArray( msg )) {
      const list = _.map(msg, (item) => {
        if (_.isDate( item )) {
          return this.formatDate( item );
        } else {
          return this.formatObject( item );
        }
      });
      return list.join(" ");
    } else {
      return msg;
    }
  }

  private formatDate(value: Date) {
    return value.toJSON();
  }

  private formatObject(value: any) {
    if (!value) {
      return "";
    }

    if (_.isObject( value )) {
      if (value instanceof Error) {
        return [ value.message, value.stack ].join("\n");
      }
      try {
        return JSON.stringify( value );
      } catch (ignore) {
        return "json error: " + value.toString();
      }
    } else {
      let s = value.toString();
      if (s === "[object Object]") {
        return util.inspect( value );
      } else {
        return s;
      }
    }
  }

  info(...msg: any[]) {
    this.log(LoggerLevel.INFO, msg);
  }

  debug(...msg: any[]) {
    this.log(colors.blue(LoggerLevel.DEBUG), msg);
  }

  warn(...msg: any[]) {
    this.log(colors.yellow(LoggerLevel.WARN), msg);
  }

  error(...msg: any[]) {
    this.log(colors.red(LoggerLevel.ERROR), msg);
  }
}
export let Logger = new LoggerHelper();