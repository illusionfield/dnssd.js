"use strict";function _typeof(o){"@babel/helpers - typeof";return _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(o){return typeof o;}:function(o){return o&&"function"==typeof Symbol&&o.constructor===Symbol&&o!==Symbol.prototype?"symbol":typeof o;},_typeof(o);}function _classCallCheck(a,n){if(!(a instanceof n))throw new TypeError("Cannot call a class as a function");}function _defineProperties(e,r){for(var t=0;t<r.length;t++){var o=r[t];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,_toPropertyKey(o.key),o);}}function _createClass(e,r,t){return r&&_defineProperties(e.prototype,r),t&&_defineProperties(e,t),Object.defineProperty(e,"prototype",{writable:!1}),e;}function _toPropertyKey(t){var i=_toPrimitive(t,"string");return"symbol"==_typeof(i)?i:i+"";}function _toPrimitive(t,r){if("object"!=_typeof(t)||!t)return t;var e=t[Symbol.toPrimitive];if(void 0!==e){var i=e.call(t,r||"default");if("object"!=_typeof(i))return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return("string"===r?String:Number)(t);}var counter=0;var uniqueId=function uniqueId(){return++counter;};var MAX_DELAY=2147483647;/**
 * TimerContainer is a convenience wrapper for setting/clearing timers
 * plus "lazy" timers that won't fire after waking from sleep.
 * @class
 *
 *  Instead of this:
 *     this.timeout = setTimeout(this.stop.bind(this));
 *     this.doSomehting = setTimeout(...);
 *     this.doThat = setTimeout(...);
 *     ... x10
 *
 *     clearTimeout(this.timeout)      <-- have to keep track of each
 *     clearTimeout(this.doSomething)
 *     clearTimeout(this.doThat)
 *
 * Do this:
 *     this.timers = new TimerContext(this);
 *     this.timers.set('timeout', this.stop, 1000);
 *     this.timers.set(fn1, 100);
 *     this.timers.set(fn2, 200);
 *     ...
 *
 *     this.timers.clear(); <-- clears all, only need to track this.timers
 *
 * Lazy timers that won't fire when walking from sleep. If a js timer
 * is set and the machine goes to sleep the timer will fire as soon as the
 * machine wakes from sleep. This behavior isn't always wanted. Lazy timers
 * won't fire if they are going off later than they are supposed to.
 *
 * Ex:
 *     timers.setLazy(doTimeSensitive, 1000)
 *     > machine sleeps for 1hr
 *     > machine wakes
 *     > doTimeSensitive doesn't fire
 *
 */var TimerContainer=/*#__PURE__*/function(){/**
   * Optional context. If used timer functions will be applied with it.
   * @param {object} [context]
   */function TimerContainer(context){_classCallCheck(this,TimerContainer);this._context=context;this._timers={};this._lazyTimers={};}return _createClass(TimerContainer,[{key:"has",value:function has(id){return this._timers.hasOwnProperty(id)||this._lazyTimers.hasOwnProperty(id);}},{key:"count",value:function count(){return Object.keys(this._timers).length+Object.keys(this._lazyTimers).length;}/**
   * Set a normal timeout (like plain setTimeout)
   *
   * @param {string}   [id] - optional id for timer (so it can be cleared by id later)
   * @param {function} fn
   * @param {number}   delay
   */},{key:"set",value:function set(){var _this=this;for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}// The delay value is too high: ${delay}, reducing it to the maximum: ${MAX_DELAY}
var delay=args.pop();if(delay>MAX_DELAY){delay=MAX_DELAY;}var fn=args.pop();var id=args.length?args.pop():uniqueId();// clear previous duplicates
if(this._timers[id])this.clear(id);this._timers[id]=setTimeout(function(){// remove timer key BERORE running the fn
// (fn could set another timer with the same id, screwing everything up)
delete _this._timers[id];fn.call(_this._context);},delay);}/**
   * Set a 'lazy' timeout that won't call it's fn if the timer fires later
   * than expected. (Won't fire after waking from sleep.)
   *
   * @param {string}   [id] - optional id for timer (so it can be cleared by id later)
   * @param {function} fn
   * @param {number}   delay
   */},{key:"setLazy",value:function setLazy(){var _this2=this;for(var _len2=arguments.length,args=new Array(_len2),_key2=0;_key2<_len2;_key2++){args[_key2]=arguments[_key2];}// The delay value is too high: ${delay}, reducing it to the maximum: ${MAX_DELAY}
var delay=args.pop();if(delay>MAX_DELAY){delay=MAX_DELAY;}var fn=args.pop();var id=args.length?args.pop():uniqueId();// expect timer to fire after delay +- 5s fudge factor
// only fire fn if the timer is firing when it was expected to (not after
// waking from sleep)
var finish=Date.now()+delay+5*1000;// clear previous duplicates
if(this._lazyTimers[id])this.clear(id);this._lazyTimers[id]=setTimeout(function(){// remove timer key BERORE running the fn
// (fn could set another timer with the same id)
delete _this2._lazyTimers[id];if(Date.now()<finish)fn.call(_this2._context);},delay);}/**
   * Clear specific timer or clear all
   * @param {string} [id] - specific timer to clear
   */},{key:"clear",value:function clear(id){var _this3=this;if(!id){Object.keys(this._timers).forEach(function(timer){return _this3.clear(timer);});Object.keys(this._lazyTimers).forEach(function(timer){return _this3.clear(timer);});}if(this._timers.hasOwnProperty(id)){clearTimeout(this._timers[id]);delete this._timers[id];}if(this._lazyTimers.hasOwnProperty(id)){clearTimeout(this._lazyTimers[id]);delete this._lazyTimers[id];}}}]);}();module.exports=TimerContainer;