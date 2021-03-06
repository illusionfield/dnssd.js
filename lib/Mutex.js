"use strict";function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}function _createClass(Constructor,protoProps,staticProps){if(protoProps)_defineProperties(Constructor.prototype,protoProps);if(staticProps)_defineProperties(Constructor,staticProps);return Constructor;}/**
 * const mutex = new Mutex();
 *
 * function limitMe() {
 *   mutex.lock((unlock) => {
 *     asyncFn().then(unlock);
 *   });
 * }
 *
 * limitMe();
 * limitMe(); // <-- will wait for first call to finish & unlock
 *
 */var Mutex=/*#__PURE__*/function(){function Mutex(){_classCallCheck(this,Mutex);this._queue=[];this.locked=false;}_createClass(Mutex,[{key:"lock",value:function lock(fn){var _this=this;var unlock=function unlock(){var nextFn=_this._queue.shift();if(nextFn)nextFn(unlock);else _this.locked=false;};if(!this.locked){this.locked=true;fn(unlock);}else{this._queue.push(fn);}}}]);return Mutex;}();module.exports=Mutex;