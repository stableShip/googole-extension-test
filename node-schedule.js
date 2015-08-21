require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/*
  node-schedule
  A cron-like and not-cron-like job scheduler for Node.

  This file adds convenience functions for performing incremental date math
  in the Gregorian calendar.
*/

exports = module.exports.addDateConvenienceMethods = addDateConvenienceMethods;

function addDateConvenienceMethods(Date) {
  if (typeof Date.addYear !== 'function') {
    Date.addYear = function() {
      this.setFullYear(this.getFullYear() + 1);
    };

    Date.addMonth = function() {
      this.setMonth(this.getMonth() + 1);
    };

    Date.addDay = function() {
      this.setDate(this.getDate() + 1);
    };

    Date.addHour = function() {
      this.setTime(this.getTime() + (60 * 60 * 1000));
    };

    Date.addMinute = function() {
      this.setTime(this.getTime() + (60 * 1000));
    };

    Date.addSecond = function() {
      this.setTime(this.getTime() + 1000);
    };
  }
}

},{}],2:[function(require,module,exports){
'use strict';

/**
 * Extends Javascript Date class by adding
 * utility methods for basic date incrementation
 */

/**
 * Increment year
 */
Date.prototype.addYear = function addYear () {
  this.setFullYear(this.getFullYear() + 1);
};

/**
 * Increment month
 */
Date.prototype.addMonth = function addMonth () {
  this.setDate(1);
  this.setHours(0);
  this.setMinutes(0);
  this.setSeconds(0);
  this.setMonth(this.getMonth() + 1);
};

/**
 * Increment day
 */
Date.prototype.addDay = function addDay () {
  var day = this.getDate();
  this.setDate(day + 1);

  this.setHours(0);
  this.setMinutes(0);
  this.setSeconds(0);

  if (this.getDate() === day) {
    this.setDate(day + 2);
  }
};

/**
 * Increment hour
 */
Date.prototype.addHour = function addHour () {
  var hours = this.getHours();
  this.setHours(hours + 1);

  if (this.getHours() === hours) {
    this.setHours(hours + 2);
  }

  this.setMinutes(0);
  this.setSeconds(0);
};

/**
 * Increment minute
 */
Date.prototype.addMinute = function addMinute () {
  this.setMinutes(this.getMinutes() + 1);
  this.setSeconds(0);
};

/**
 * Increment second
 */
Date.prototype.addSecond = function addSecond () {
  this.setSeconds(this.getSeconds() + 1);
};

},{}],3:[function(require,module,exports){
'use strict';

// Load Date class extensions
require('./date');

/**
 * Construct a new expression parser
 *
 * Options:
 *   currentDate: iterator start date
 *   endDate: iterator end date
 *
 * @constructor
 * @private
 * @param {Object} fields  Expression fields parsed values
 * @param {Object} options Parser options
 */
function CronExpression (fields, options) {
  this._options = options;
  this._currentDate = new Date(options.currentDate);
  this._endDate = options.endDate ? new Date(options.endDate) : null;
  this._fields = {};
  this._isIterator = options.iterator || false;

  // Map fields
  for (var i = 0, c = CronExpression.map.length; i < c; i++) {
    var key = CronExpression.map[i];
    this._fields[key] = fields[i];
  }
}

/**
 * Field mappings
 * @type {Array}
 */
CronExpression.map = [ 'second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek' ];

/**
 * Prefined intervals
 * @type {Object}
 */
CronExpression.predefined = {
  '@yearly': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@hourly': '0 * * * *'
};

/**
 * Fields constraints
 * @type {Array}
 */
CronExpression.constraints = [
  [ 0, 59 ], // Second
  [ 0, 59 ], // Minute
  [ 0, 23 ], // Hour
  [ 1, 31 ], // Day of month
  [ 1, 12 ], // Month
  [ 0, 7 ] // Day of week
];

/**
 * Days in month
 * @type {number[]}
 */
CronExpression.daysInMonth = [
  31,
  28,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31
];

/**
 * Field aliases
 * @type {Object}
 */
CronExpression.aliases = {
  month: {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12
  },

  dayOfWeek: {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
  }
};

/**
 * Field defaults
 * @type {Array}
 */
CronExpression.parseDefaults = [ '0', '*', '*', '*', '*', '*' ];

/**
 * Parse input interval
 *
 * @param {String} field Field symbolic name
 * @param {String} value Field value
 * @param {Array} constraints Range upper and lower constraints
 * @return {Array} Sequence of sorted values
 * @private
 */
CronExpression._parseField = function _parseField (field, value, constraints) {
  // Replace aliases
  switch (field) {
    case 'month':
    case 'dayOfWeek':
      var aliases = CronExpression.aliases[field];

      value = value.replace(/[a-z]{1,3}/gi, function(match) {
        match = match.toLowerCase();

        if (aliases[match]) {
          return aliases[match];
        } else {
          throw new Error('Cannot resolve alias "' + match + '"')
        }
      });
      break;
  }

  // Check for valid characters.
  if (!(/^[\d|/|*|\-|,]+$/.test(value))) {
    throw new Error('Invalid characters, got value: ' + value)
  }

  // Replace '*'
  if (value.indexOf('*') !== -1) {
    value = value.replace(/\*/g, constraints.join('-'));
  }

  //
  // Inline parsing functions
  //
  // Parser path:
  //  - parseSequence
  //    - parseRepeat
  //      - parseRange

  /**
   * Parse sequence
   *
   * @param {String} val
   * @return {Array}
   * @private
   */
  function parseSequence (val) {
    var stack = [];

    function handleResult (result) {
      var max = stack.length > 0 ? Math.max.apply(Math, stack) : -1;

      if (result instanceof Array) { // Make sequence linear
        for (var i = 0, c = result.length; i < c; i++) {
          var value = result[i];

          // Check constraints
          if (value < constraints[0] || value > constraints[1]) {
            throw new Error(
                'Constraint error, got value ' + value + ' expected range ' +
                constraints[0] + '-' + constraints[1]
            );
          }

          if (value > max) {
            stack.push(value);
          }

          max = Math.max.apply(Math, stack);
        }
      } else { // Scalar value
        result = +result;

        // Check constraints
        if (result < constraints[0] || result > constraints[1]) {
          throw new Error(
            'Constraint error, got value ' + result + ' expected range ' +
            constraints[0] + '-' + constraints[1]
          );
        }

        if (field == 'dayOfWeek') {
          result = result % 7;
        }

        if (result > max) {
          stack.push(result);
        }
      }
    }

    var atoms = val.split(',');
    if (atoms.length > 1) {
      for (var i = 0, c = atoms.length; i < c; i++) {
        handleResult(parseRepeat(atoms[i]));
      }
    } else {
      handleResult(parseRepeat(val));
    }

    return stack;
  }

  /**
   * Parse repetition interval
   *
   * @param {String} val
   * @return {Array}
   */
  function parseRepeat (val) {
    var repeatInterval = 1;
    var atoms = val.split('/');

    if (atoms.length > 1) {
      return parseRange(atoms[0], atoms[atoms.length - 1]);
    }

    return parseRange(val, repeatInterval);
  }

  /**
   * Parse range
   *
   * @param {String} val
   * @param {Number} repeatInterval Repetition interval
   * @return {Array}
   * @private
   */
  function parseRange (val, repeatInterval) {
    var stack = [];
    var atoms = val.split('-');

    if (atoms.length > 1 ) {
      // Invalid range, return value
      if (atoms.length < 2 || !atoms[0].length) {
        return +val;
      }

      // Validate range
      var min = +atoms[0];
      var max = +atoms[1];

      if (Number.isNaN(min) || Number.isNaN(max) ||
          min < constraints[0] || max > constraints[1]) {
        throw new Error(
          'Constraint error, got range ' +
          min + '-' + max +
          ' expected range ' +
          constraints[0] + '-' + constraints[1]
        );
      } else if (min >= max) {
        throw new Error('Invalid range: ' + val);
      }

      // Create range
      var repeatIndex = repeatInterval;

      for (var index = min, count = max; index <= count; index++) {
        if (repeatIndex > 0 && (repeatIndex % repeatInterval) === 0) {
          repeatIndex = 1;
          stack.push(index);
        } else {
          repeatIndex++;
        }
      }

      return stack;
    }

    return +val;
  }

  return parseSequence(value);
};

/**
 * Find next matching schedule date
 *
 * @return {Date}
 * @private
 */
CronExpression.prototype._findSchedule = function _findSchedule () {
  /**
   * Match field value
   *
   * @param {String} value
   * @param {Array} sequence
   * @return {Boolean}
   * @private
   */
  function matchSchedule (value, sequence) {
    for (var i = 0, c = sequence.length; i < c; i++) {
      if (sequence[i] >= value) {
        return sequence[i] === value;
      }
    }

    return sequence[0] === value;
  }

  /**
   * Detect if input range fully matches constraint bounds
   * @param {Array} range Input range
   * @param {Array} constraints Input constraints
   * @returns {Boolean}
   * @private
   */
  function isWildcardRange (range, constraints) {
    if (range instanceof Array && !range.length) {
      return false;
    }

    if (constraints.length !== 2) {
      return false;
    }

    return range.length === (constraints[1] - (constraints[0] < 1 ? - 1 : 0));
  }

  var currentDate = new Date(this._currentDate);
  var endDate = this._endDate;

  // Find matching schedule
  while (true) {
    // Validate timespan
    if (endDate && (endDate.getTime() - currentDate.getTime()) < 0) {
      throw new Error('Out of the timespan range');
    }
    
    // Day of month and week matching:
    //
    // "The day of a command's execution can be specified by two fields --
    // day of month, and day of week.  If  both	 fields	 are  restricted  (ie,
    // aren't  *),  the command will be run when either field matches the cur-
    // rent time.  For example, "30 4 1,15 * 5" would cause a command to be
    // run at 4:30 am on the  1st and 15th of each month, plus every Friday."
    //
    // http://unixhelp.ed.ac.uk/CGI/man-cgi?crontab+5
    //

    var dayOfMonthMatch = matchSchedule(currentDate.getDate(), this._fields.dayOfMonth);
    var dayOfWeekMatch = matchSchedule(currentDate.getDay(), this._fields.dayOfWeek);

    var isDayOfMonthWildcardMatch = isWildcardRange(this._fields.dayOfMonth, CronExpression.constraints[3]);
    var isMonthWildcardMatch = isWildcardRange(this._fields.dayOfWeek, CronExpression.constraints[4]);
    var isDayOfWeekWildcardMatch = isWildcardRange(this._fields.dayOfWeek, CronExpression.constraints[5]);

    // Validate days in month if explicit value is given
    if (!isMonthWildcardMatch) {
      var currentYear = currentDate.getYear();
      var currentMonth = currentDate.getMonth() + 1;
      var previousMonth = currentMonth === 1 ? 11 : currentMonth - 1;
      var daysInPreviousMonth = CronExpression.daysInMonth[previousMonth - 1];
      var daysOfMontRangeMax = this._fields.dayOfMonth[this._fields.dayOfMonth.length - 1];

      // Handle leap year
      var isLeap = !((currentYear % 4) || (!(currentYear % 100) && (currentYear % 400)));
      if (isLeap) {
        daysInPreviousMonth = 29;
      }

      if (this._fields.month[0] === previousMonth && daysInPreviousMonth < daysOfMontRangeMax) {
        throw new Error('Invalid explicit day of month definition');
      }
    }

    // Add day if not day of month is set (and no match) and day of week is wildcard
    if (!isDayOfMonthWildcardMatch && isDayOfWeekWildcardMatch && !dayOfMonthMatch) {
      currentDate.addDay();
      continue;
    }

    // Add day if not day of week is set (and no match) and day of month is wildcard
    if (isDayOfMonthWildcardMatch && !isDayOfWeekWildcardMatch && !dayOfWeekMatch) {
      currentDate.addDay();
      continue;
    }

    // Add day if day of mont and week are non-wildcard values and both doesn't match
    if (!(isDayOfMonthWildcardMatch && isDayOfWeekWildcardMatch) &&
        !dayOfMonthMatch && !dayOfWeekMatch) {
      currentDate.addDay();
      continue;
    }

    // Match month
    if (!matchSchedule(currentDate.getMonth() + 1, this._fields.month)) {
      currentDate.addMonth();
      continue;
    }

    // Match hour
    if (!matchSchedule(currentDate.getHours(), this._fields.hour)) {
      currentDate.addHour();
      continue;
    }

    // Match minute
    if (!matchSchedule(currentDate.getMinutes(), this._fields.minute)) {
      currentDate.addMinute();
      continue;
    }

    // Match second
    if (!matchSchedule(currentDate.getSeconds(), this._fields.second)) {
      currentDate.addSecond();
      continue;
    }

    break;
  }

  // When internal date is not mutated, append one second as a padding
  var nextDate = new Date(currentDate);
  if (this._currentDate !== currentDate) {
    nextDate.addSecond();
  }

  this._currentDate = nextDate;
  return currentDate;
};

/**
 * Find next suitable date
 *
 * @public
 * @return {Date|Object}
 */
CronExpression.prototype.next = function next () {
  var schedule = this._findSchedule();

  // Try to return ES6 compatible iterator
  if (this._isIterator) {
    return {
      value: schedule,
      done: !this.hasNext()
    };
  }

  return schedule;
};

/**
 * Check if next suitable date exists
 *
 * @public
 * @return {Boolean}
 */
CronExpression.prototype.hasNext = function() {
  var current = this._currentDate;

  try {
    this.next();
    return true;
  } catch (err) {
    return false;
  } finally {
    this._currentDate = current;
  }
};

/**
 * Iterate over expression iterator
 *
 * @public
 * @param {Number} steps Numbers of steps to iterate
 * @param {Function} callback Optional callback
 * @return {Array} Array of the iterated results
 */
CronExpression.prototype.iterate = function iterate (steps, callback) {
  var dates = [];

  for (var i = 0, c = steps; i < c; i++) {
    try {
      var item = this.next();
      dates.push(item);

      // Fire the callback
      if (callback) {
        callback(item, i);
      }
    } catch (err) {
      break;
    }
  }

  return dates;
};

/**
 * Reset expression iterator state
 *
 * @public
 */
CronExpression.prototype.reset = function reset () {
  this._currentDate = new Date(this._options.currentDate);
};

/**
 * Parse input expression (async)
 *
 * @public
 * @param {String} expression Input expression
 * @param {Object} [options] Parsing options
 * @param {Function} [callback]
 */
CronExpression.parse = function parse (expression, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  function parse (expression, options) {
    if (!options) {
      options = {};
    }

    if (!options.currentDate) {
      options.currentDate = new Date();
    }

    // Is input expression predefined?
    if (CronExpression.predefined[expression]) {
      expression = CronExpression.predefined[expression];
    }

    // Split fields
    var fields = [];
    var atoms = expression.split(' ');

    // Resolve fields
    var start = (CronExpression.map.length - atoms.length);
    for (var i = 0, c = CronExpression.map.length; i < c; ++i) {
      var field = CronExpression.map[i]; // Field name
      var value = atoms[atoms.length > c ? i : i - start]; // Field value

      if (i < start || !value) {
        fields.push(CronExpression._parseField(
          field,
          CronExpression.parseDefaults[i],
          CronExpression.constraints[i])
        );
      } else { // Use default value
        fields.push(CronExpression._parseField(
          field,
          value,
          CronExpression.constraints[i])
        );
      }
    }

    return new CronExpression(fields, options);
  }

  return parse(expression, options);
};

module.exports = CronExpression;

},{"./date":2}],4:[function(require,module,exports){
'use strict';

var CronExpression = require('./expression');

function CronParser() {}

/**
 * Parse crontab entry
 *
 * @private
 * @param {String} entry Crontab file entry/line
 */
CronParser._parseEntry = function _parseEntry (entry) {
  var atoms = entry.split(' ');

  if (atoms.length === 6) {
    return {
      interval: CronExpression.parse(entry)
    };
  } else if (atoms.length > 6) {
    return {
      interval: CronExpression.parse(entry),
      command: atoms.slice(6, atoms.length)
    };
  } else {
    throw new Error('Invalid entry: ' + entry);
  }
};

/**
 * Wrapper for CronExpression.parser method
 *
 * @public
 * @param {String} expression Input expression
 * @param {Object} [options] Parsing options
 * @return {Object}
 */
CronParser.parseExpression = function parseExpression (expression, options, callback) {
  return CronExpression.parse(expression, options, callback);
};

/**
 * Parse content string
 *
 * @public
 * @param {String} data Crontab content
 * @return {Object}
 */
CronParser.parseString = function parseString (data) {
  var self = this;
  var blocks = data.split('\n');

  var response = {
    variables: {},
    expressions: [],
    errors: {}
  };

  for (var i = 0, c = blocks.length; i < c; i++) {
    var block = blocks[i];
    var matches = null;
    var entry = block.replace(/^\s+|\s+$/g, ''); // Remove surrounding spaces

    if (entry.length > 0) {
      if (entry.match(/^#/)) { // Comment
        continue;
      } else if ((matches = entry.match(/^(.*)=(.*)$/))) { // Variable
        response.variables[matches[1]] = matches[2];
      } else { // Expression?
        var result = null;

        try {
          result = self._parseEntry('0 ' + entry);
          response.expressions.push(result.interval);
        } catch (err) {
          response.errors[entry] = err;
        }
      }
    }
  }

  return response;
};

/**
 * Parse crontab file
 *
 * @public
 * @param {String} filePath Path to file
 * @param {Function} callback
 */
CronParser.parseFile = function parseFile (filePath, callback) {
  require('fs').readFile(filePath, function(err, data) {
    if (err) {
      callback(err);
      return;
    }

    return callback(null, CronParser.parseString(data.toString()));
  });
};

module.exports = CronParser;

},{"./expression":3,"fs":6}],5:[function(require,module,exports){

var TIMEOUT_MAX = 2147483647; // 2^31-1

exports.setTimeout = function(listener, after) {
  return new Timeout(listener, after)
}
exports.clearTimeout = function(timer) {
  if (timer) timer.close()
}

exports.Timeout = Timeout

function Timeout(listener, after) {
  this.listener = listener
  this.after = after
  this.start()
}

Timeout.prototype.start = function() {
  if (this.after <= TIMEOUT_MAX) {
    this.timeout = setTimeout(this.listener, this.after)
  } else {
    var self = this
    this.timeout = setTimeout(function() {
      self.after -= TIMEOUT_MAX
      self.start()
    }, TIMEOUT_MAX)
  }
}

Timeout.prototype.close = function() {
  clearTimeout(this.timeout)
}

},{}],6:[function(require,module,exports){

},{}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],8:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],9:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],10:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],11:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":10,"_process":9,"inherits":8}],"node-schedule":[function(require,module,exports){
(function (process){
'use strict';

/*
  node-schedule
  A cron-like and not-cron-like job scheduler for Node.
*/

var events = require('events'),
  util = require('util'),
  increment = require('./increment.js'),
  cronParser = require('cron-parser'),
  lt = require('long-timeout');

/* Job object */
var anonJobCounter = 0;

function Job() {
  var name;

  // process arguments to the constructor
  var arg;
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i];
    if (typeof arg == 'string' || arg instanceof String) {
      name = arg;
    } else {
      this.job = arg;
    }
  }

  // give us a random name if one wasn't provided
  if (name == null) {
    name = '<Anonymous Job ' + (++anonJobCounter) + '>';
  }

  // setup a private pendingInvocations variable
  var pendingInvocations = [];

  // define properties
  Object.defineProperty(this, 'name', {
    value: name,
    writable: false,
    enumerable: true
  });

  // method that require private access
  this.trackInvocation = function(invocation) {
    // add to our invocation list
    pendingInvocations.push(invocation);

    // and sort
    pendingInvocations.sort(sorter);

    return true;
  };
  this.stopTrackingInvocation = function(invocation) {
    var invIdx = pendingInvocations.indexOf(invocation);
    if (invIdx > -1) {
      pendingInvocations.splice(invIdx, 1);
      return true;
    }

    return false;
  };
  this.cancel = function(reschedule) {
    reschedule = (typeof reschedule == 'boolean') ? reschedule : false;

    var inv, newInv;
    var newInvs = [];
    for (var j = 0; j < pendingInvocations.length; j++) {
      inv = pendingInvocations[j];

      cancelInvocation(inv);

      if (reschedule && inv.recurrenceRule.recurs) {
        newInv = scheduleNextRecurrence(inv.recurrenceRule, this, inv.fireDate);
        if (newInv !== null) {
          newInvs.push(newInv);
        }
      }
    }

    pendingInvocations = [];

    for (var k = 0; k < newInvs.length; k++) {
      this.trackInvocation(newInvs[k]);
    }

    // remove from scheduledJobs if reschedule === false
    if (!reschedule) {
      if (this.name) {
        scheduledJobs[this.name] = null;
      }
    }

    return true;
  };
  this.cancelNext = function(reschedule) {
    reschedule = (typeof reschedule == 'boolean') ? reschedule : true;

    if (!pendingInvocations.length) {
      return false;
    }

    var newInv;
    var nextInv = pendingInvocations.shift();

    cancelInvocation(nextInv);

    if (reschedule && nextInv.recurrenceRule.recurs) {
      newInv = scheduleNextRecurrence(nextInv.recurrenceRule, this, nextInv.fireDate);
      if (newInv !== null) {
        this.trackInvocation(newInv);
      }
    }

    return true;
  };
  this.nextInvocation = function() {
    if (!pendingInvocations.length) {
      return null;
    }
    return pendingInvocations[0].fireDate;
  };
  this.pendingInvocations = function() {
    return pendingInvocations;
  };
}

util.inherits(Job, events.EventEmitter);

Job.prototype.invoke = function() {
  if (typeof this.job == 'function') {
    this.job();
  } else {
    this.job.execute();
  }
};

Job.prototype.runOnDate = function(date) {
  return this.schedule(date);
};

Job.prototype.schedule = function(spec) {
  var self = this;
  var success = false;
  var inv;
  try {
    var res = cronParser.parseExpression(spec);
    inv = scheduleNextRecurrence(res, self);
    if (inv !== null) {
      success = self.trackInvocation(inv);
    }

  } catch (err) {
    var type = typeof spec;
    if (type === 'string') {
      spec = new Date(spec);
    }

    if (spec instanceof Date) {
      inv = new Invocation(self, spec);
      scheduleInvocation(inv);
      success = self.trackInvocation(inv);
    } else if (type === 'object') {
      if (!(spec instanceof RecurrenceRule)) {
        var r = new RecurrenceRule();
        if ('year' in spec) {
          r.year = spec.year;
        }
        if ('month' in spec) {
          r.month = spec.month;
        }
        if ('date' in spec) {
          r.date = spec.date;
        }
        if ('dayOfWeek' in spec) {
          r.dayOfWeek = spec.dayOfWeek;
        }
        if ('hour' in spec) {
          r.hour = spec.hour;
        }
        if ('minute' in spec) {
          r.minute = spec.minute;
        }
        if ('second' in spec) {
          r.second = spec.second;
        }

        spec = r;
      }

      inv = scheduleNextRecurrence(spec, self);
      if (inv !== null) {
        success = self.trackInvocation(inv);
      }
    }
  }

  return success;
};

/* API
  invoke()
  runOnDate(date)
  schedule(date || recurrenceRule || cronstring)
  cancel(reschedule = false)
  cancelNext(reschedule = true)

   Property constraints
  name: readonly
  job: readwrite
*/

/* DoesntRecur rule */
var DoesntRecur = new RecurrenceRule();
DoesntRecur.recurs = false;

/* Invocation object */
function Invocation(job, fireDate, recurrenceRule) {
  this.job = job;
  this.fireDate = fireDate;
  this.recurrenceRule = recurrenceRule || DoesntRecur;

  this.timerID = null;
}

function sorter(a, b) {
  return (a.fireDate.getTime() - b.fireDate.getTime());
}

/* Range object */
function Range(start, end, step) {
  this.start = start || 0;
  this.end = end || 60;
  this.step = step || 1;
}

Range.prototype.contains = function(val) {
  if (this.step === null || this.step === 1) {
    return (val >= this.start && val <= this.end);
  } else {
    for (var i = this.start; i < this.end; i += this.step) {
      if (i === val) {
        return true;
      }
    }

    return false;
  }
};

/* RecurrenceRule object */
/*
  Interpreting each property:
  null - any value is valid
  number - fixed value
  Range - value must fall in range
  array - value must validate against any item in list

  NOTE: Cron months are 1-based, but RecurrenceRule months are 0-based.
*/
function RecurrenceRule(year, month, date, dayOfWeek, hour, minute, second) {
  this.recurs = true;

  this.year = (year == null) ? null : year;
  this.month = (month == null) ? null : month;
  this.date = (date == null) ? null : date;
  this.dayOfWeek = (dayOfWeek == null) ? null : dayOfWeek;
  this.hour = (hour == null) ? null : hour;
  this.minute = (minute == null) ? null : minute;
  this.second = (second == null) ? 0 : second;
}

RecurrenceRule.prototype.nextInvocationDate = function(base) {
  base = (base instanceof Date) ? base : (new Date());
  increment.addDateConvenienceMethods(base);
  if (!this.recurs) {
    return null;
  }

  var now = new Date();
  increment.addDateConvenienceMethods(now);
  if (this.year !== null && (typeof this.year == 'number') && this.year < now.getFullYear()) {
    return null;
  }

  var next = new Date(base.getTime());
  increment.addDateConvenienceMethods(next);
  next.addSecond();

  while (true) {
    if (this.year != null && !recurMatch(next.getFullYear(), this.year)) {
      next.addYear();
      next.setMonth(0);
      next.setDate(1);
      next.setHours(0);
      next.setMinutes(0);
      next.setSeconds(0);
      continue;
    }
    if (this.month != null && !recurMatch(next.getMonth(), this.month)) {
      next.addMonth();
      continue;
    }
    if (this.date != null && !recurMatch(next.getDate(), this.date)) {
      next.addDay();
      continue;
    }
    if (this.dayOfWeek != null && !recurMatch(next.getDay(), this.dayOfWeek)) {
      next.addDay();
      continue;
    }
    if (this.hour != null && !recurMatch(next.getHours(), this.hour)) {
      next.addHour();
      continue;
    }
    if (this.minute != null && !recurMatch(next.getMinutes(), this.minute)) {
      next.addMinute();
      continue;
    }
    if (this.second != null && !recurMatch(next.getSeconds(), this.second)) {
      next.addSecond();
      continue;
    }

    break;
  }

  return next;
};

function recurMatch(val, matcher) {
  if (matcher == null) {
    return true;
  }

  if (typeof matcher === 'number' || typeof matcher === 'string') {
    return (val === matcher);
  } else if (matcher instanceof Range) {
    return matcher.contains(val);
  } else if (Array.isArray(matcher) || (matcher instanceof Array)) {
    for (var i = 0; i < matcher.length; i++) {
      if (recurMatch(val, matcher[i])) {
        return true;
      }
    }
  }

  return false;
}

/* Date-based scheduler */
function runOnDate(date, job) {
  var now = (new Date()).getTime();
  var then = date.getTime();

  if (then < now) {
    process.nextTick(job);
    return null;
  }

  return lt.setTimeout(job, (then - now));
}

var invocations = [];
var currentInvocation = null;

function scheduleInvocation(invocation) {
  invocations.push(invocation);
  invocations.sort(sorter);
  prepareNextInvocation();
  invocation.job.emit('scheduled', invocation.fireDate);
}

function prepareNextInvocation() {
  if (invocations.length > 0 && currentInvocation !== invocations[0]) {
    if (currentInvocation !== null) {
      lt.clearTimeout(currentInvocation.timerID);
      currentInvocation.timerID = null;
      currentInvocation = null;
    }

    currentInvocation = invocations[0];

    var job = currentInvocation.job;
    var cinv = currentInvocation;
    currentInvocation.timerID = runOnDate(currentInvocation.fireDate, function() {
      currentInvocationFinished();

      if (cinv.recurrenceRule.recurs || cinv.recurrenceRule._endDate === null) {
        var inv = scheduleNextRecurrence(cinv.recurrenceRule, cinv.job, cinv.fireDate);
        if (inv !== null) {
          inv.job.trackInvocation(inv);
        }
      }

      job.stopTrackingInvocation(cinv);

      job.invoke();
      job.emit('run');
    });
  }
}

function currentInvocationFinished() {
  invocations.shift();
  currentInvocation = null;
  prepareNextInvocation();
}

function cancelInvocation(invocation) {
  var idx = invocations.indexOf(invocation);
  if (idx > -1) {
    invocations.splice(idx, 1);
    if (invocation.timerID !== null) {
      lt.clearTimeout(invocation.timerID);
    }

    if (currentInvocation === invocation) {
      currentInvocation = null;
    }

    invocation.job.emit('canceled', invocation.fireDate);
    prepareNextInvocation();
  }
}

/* Recurrence scheduler */
function scheduleNextRecurrence(rule, job, prevDate) {
  prevDate = (prevDate instanceof Date) ? prevDate : (new Date());

  var date = (rule instanceof RecurrenceRule) ? rule.nextInvocationDate(prevDate) : rule.next();
  if (date === null) {
    return null;
  }

  var inv = new Invocation(job, date, rule);
  scheduleInvocation(inv);

  return inv;
}

/* Convenience methods */
var scheduledJobs = {};

function scheduleJob() {
  if (arguments.length < 2) {
    return null;
  }

  var name = (arguments.length >= 3) ? arguments[0] : null;
  var spec = (arguments.length >= 3) ? arguments[1] : arguments[0];
  var method = (arguments.length >= 3) ? arguments[2] : arguments[1];

  var job = new Job(name, method);

  if (job.schedule(spec)) {
    scheduledJobs[job.name] = job;
    return job;
  }

  return null;
}

function cancelJob(job) {
  var success = false;
  if (job instanceof Job) {
    success = job.cancel();
  } else if (typeof job == 'string' || job instanceof String) {
    if (job in scheduledJobs && scheduledJobs.hasOwnProperty(job)) {
      success = scheduledJobs[job].cancel();
    }
  }

  return success;
}

/* Public API */
exports.Job = Job;
exports.Range = Range;
exports.RecurrenceRule = RecurrenceRule;
exports.Invocation = Invocation;
exports.scheduleJob = scheduleJob;
exports.scheduledJobs = scheduledJobs;
exports.cancelJob = cancelJob;
exports.addDateConvenienceMethods = increment.addDateConvenienceMethods;

}).call(this,require('_process'))
},{"./increment.js":1,"_process":9,"cron-parser":4,"events":7,"long-timeout":5,"util":11}]},{},[]);
