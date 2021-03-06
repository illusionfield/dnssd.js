"use strict";function _typeof(obj){"@babel/helpers - typeof";if(typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"){_typeof=function _typeof(obj){return typeof obj;};}else{_typeof=function _typeof(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};}return _typeof(obj);}function _toConsumableArray(arr){return _arrayWithoutHoles(arr)||_iterableToArray(arr)||_unsupportedIterableToArray(arr)||_nonIterableSpread();}function _nonIterableSpread(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}function _unsupportedIterableToArray(o,minLen){if(!o)return;if(typeof o==="string")return _arrayLikeToArray(o,minLen);var n=Object.prototype.toString.call(o).slice(8,-1);if(n==="Object"&&o.constructor)n=o.constructor.name;if(n==="Map"||n==="Set")return Array.from(o);if(n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return _arrayLikeToArray(o,minLen);}function _iterableToArray(iter){if(typeof Symbol!=="undefined"&&Symbol.iterator in Object(iter))return Array.from(iter);}function _arrayWithoutHoles(arr){if(Array.isArray(arr))return _arrayLikeToArray(arr);}function _arrayLikeToArray(arr,len){if(len==null||len>arr.length)len=arr.length;for(var i=0,arr2=new Array(len);i<len;i++){arr2[i]=arr[i];}return arr2;}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}function _createClass(Constructor,protoProps,staticProps){if(protoProps)_defineProperties(Constructor.prototype,protoProps);if(staticProps)_defineProperties(Constructor,staticProps);return Constructor;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function");}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,writable:true,configurable:true}});if(superClass)_setPrototypeOf(subClass,superClass);}function _setPrototypeOf(o,p){_setPrototypeOf=Object.setPrototypeOf||function _setPrototypeOf(o,p){o.__proto__=p;return o;};return _setPrototypeOf(o,p);}function _createSuper(Derived){var hasNativeReflectConstruct=_isNativeReflectConstruct();return function(){var Super=_getPrototypeOf(Derived),result;if(hasNativeReflectConstruct){var NewTarget=_getPrototypeOf(this).constructor;result=Reflect.construct(Super,arguments,NewTarget);}else{result=Super.apply(this,arguments);}return _possibleConstructorReturn(this,result);};}function _possibleConstructorReturn(self,call){if(call&&(_typeof(call)==="object"||typeof call==="function")){return call;}return _assertThisInitialized(self);}function _assertThisInitialized(self){if(self===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return self;}function _isNativeReflectConstruct(){if(typeof Reflect==="undefined"||!Reflect.construct)return false;if(Reflect.construct.sham)return false;if(typeof Proxy==="function")return true;try{Date.prototype.toString.call(Reflect.construct(Date,[],function(){}));return true;}catch(e){return false;}}function _getPrototypeOf(o){_getPrototypeOf=Object.setPrototypeOf?Object.getPrototypeOf:function _getPrototypeOf(o){return o.__proto__||Object.getPrototypeOf(o);};return _getPrototypeOf(o);}var EventEmitter=require('./EventEmitter');var TimerContainer=require('./TimerContainer');var filename=require('path').basename(__filename);var debug=require('./debug')("dnssd:".concat(filename));var ONE_SECOND=1000;/**
 * @class
 * @extends EventEmitter
 *
 * ExpiringRecordCollection is a set collection for resource records or
 * query records. Uniqueness is determined by a record's hash property,
 * which is a hash of a records name, type, class, and rdata. Records
 * are evicted from the collection as their TTLs expire.
 *
 * Since there may be several records with the same name, type, and class,
 * but different rdata, within a record set (e.g. PTR records for a service
 * type), related records are tracked in this._related.
 *
 * This collection emits 'reissue' and 'expired' events as records TTLs
 * decrease towards expiration. Reissues are emitted at 80%, 85%, 90% and 95%
 * of each records TTL. Re-adding a record refreshes the TTL.
 *
 * @emits 'expired'
 * @emits 'reissue'
 */var ExpiringRecordCollection=/*#__PURE__*/function(_EventEmitter){_inherits(ExpiringRecordCollection,_EventEmitter);var _super=_createSuper(ExpiringRecordCollection);/**
   * @param {ResourceRecord[]} [records] - optional starting records
   * @param {string} [description]       - optional description for debugging
   */function ExpiringRecordCollection(records,description){var _this;_classCallCheck(this,ExpiringRecordCollection);_this=_super.call(this);// make debugging easier, who owns this / what it is
_this._desc=description;_this._records={};// record.hash: record
_this._related={};// record.namehash: Set() of record hashes
_this._insertionTime={};// record.hash: Date.now()
_this._timerContainers={};// record.hash: new TimerContainer()
_this.size=0;if(records)_this.addEach(records);return _this;}/**
   * Adds record. Re-added records refresh TTL expiration timers.
   * @param {ResourceRecord} record
   */_createClass(ExpiringRecordCollection,[{key:"add",value:function add(record){var id=record.hash;var group=record.namehash;// expire TTL=0 goodbye records instead
if(record.ttl===0)return this.setToExpire(record);debug.v('#add(): %s',record);debug.v("    to: ".concat(this._desc));// only increment size if the record is new
if(!this._records[id])this.size++;// keep track of related records (same name, type, and class)
if(!this._related[group])this._related[group]=new Set();// remove any old timers
if(this._timerContainers[id])this._timerContainers[id].clear();this._records[id]=record;this._related[group].add(id);this._insertionTime[id]=Date.now();this._timerContainers[id]=new TimerContainer();// do reissue/expired timers
this._schedule(record);}},{key:"addEach",value:function addEach(records){var _this2=this;records.forEach(function(record){return _this2.add(record);});}},{key:"has",value:function has(record){return Object.hasOwnProperty.call(this._records,record.hash);}/**
   * Checks if a record was added to the collection within a given range
   *
   * @param  {ResourceRecord} record
   * @param  {number}         range - in *seconds*
   * @return {boolean}
   */},{key:"hasAddedWithin",value:function hasAddedWithin(record,range){var then=this._insertionTime[record.hash];return Number(parseFloat(then))===then&&range*ONE_SECOND>=Date.now()-then;}/**
   * Returns a *clone* of originally added record that matches requested record.
   * The clone's TTL is reduced to the current TTL. A clone is used so the
   * original record's TTL isn't modified.
   *
   * @param  {ResourceRecord} record
   * @return {ResourceRecord|undefined}
   */},{key:"get",value:function get(record){if(!this.has(record))return undefined;var then=this._insertionTime[record.hash];var elapsed=~~((Date.now()-then)/ONE_SECOND);var clone=record.clone();clone.ttl-=elapsed;return clone;}/**
   * @emits 'expired' w/ the expiring record
   */},{key:"delete",value:function _delete(record){if(!this.has(record))return;var id=record.hash;var group=record.namehash;this.size--;this._timerContainers[id].clear();delete this._records[id];delete this._insertionTime[id];delete this._timerContainers[id];if(this._related[group])this._related[group]["delete"](id);debug.v('deleting: %s',record);debug.v("    from: ".concat(this._desc));this.emit('expired',record);}/**
   * Deletes all records, clears all timers, resets size to 0
   */},{key:"clear",value:function clear(){debug.v('#clear()');this.removeAllListeners();Object.values(this._timerContainers).forEach(function(timers){return timers.clear();});this.size=0;this._records={};this._related={};this._insertionTime={};this._timerContainers={};}/**
   * Sets record to be deleted in 1s, but doesn't immediately delete it
   */},{key:"setToExpire",value:function setToExpire(record){var _this3=this;// can't expire unknown records
if(!this.has(record))return;// don't reset expire timer if this gets called again, say due to
// repeated goodbyes. only one timer (expire) would be set in this case
if(this._timerContainers[record.hash].count()===1)return;debug.v('#setToExpire(): %s',record);debug.v("            on: ".concat(this._desc));this._timerContainers[record.hash].clear();this._timerContainers[record.hash].set(function(){return _this3["delete"](record);},ONE_SECOND);}/**
   * Flushes any other records that have the same name, class, and type
   * from the collection *if* the records have been in the collection
   * longer than 1s.
   */},{key:"flushRelated",value:function flushRelated(record){var _this4=this;// only flush records that have cache-flush bit set
if(!record.isUnique)return;this._getRelatedRecords(record.namehash).forEach(function(related){// can't flush itself
if(related.equals(record))return;// only flush records added more than 1s ago
if(!_this4.hasAddedWithin(related,1))_this4.setToExpire(related);});}/**
   * Records with original TTLs (not reduced ttl clones)
   */},{key:"toArray",value:function toArray(){return Object.values(this._records);}/**
   * Checks if collection contains any other records with the same name, type,
   * and class but different rdata. Non-unique records always return false & a
   * record can't conflict with itself
   *
   * @param  {ResourceRecord} record
   * @return {boolean}
   */},{key:"hasConflictWith",value:function hasConflictWith(record){if(!record.isUnique)return false;return!!this._getRelatedRecords(record.namehash).filter(function(related){return!related.equals(record);}).length;}/**
   * Finds any records in collection that matches name, type, and class of a
   * given query. Rejects any records with a TTL below the cutoff percentage.
   * Returns clones of records to prevent changes to original objects.
   *
   * @param  {QueryRecord} query
   * @param  {number}      [cutoff] - percentage, 0.0 - 1.0
   * @return {ResourceRecords[]}
   */},{key:"find",value:function find(query){var cutoff=arguments.length>1&&arguments[1]!==undefined?arguments[1]:0.25;debug.v("#find(): \"".concat(query.name,"\" type: ").concat(query.qtype));debug.v("     in: ".concat(this._desc));return this._filterTTL(this._getRelatedRecords(query.namehash),cutoff);}/**
   * Gets all any records in collection with a TTL above the cutoff percentage.
   * Returns clones of records to prevent changes to original objects.
   *
   * @param  {number} [cutoff] - percentage, 0.0 - 1.0
   * @return {ResouceRecords[]}
   */},{key:"getAboveTTL",value:function getAboveTTL(){var cutoff=arguments.length>0&&arguments[0]!==undefined?arguments[0]:0.25;debug.v("#getAboveTTL(): %".concat(cutoff*100));return this._filterTTL(this.toArray(),cutoff);}/**
   * Gets records that have same name, type, and class.
   */},{key:"_getRelatedRecords",value:function _getRelatedRecords(namehash){var _this5=this;return this._related[namehash]&&this._related[namehash].size?_toConsumableArray(this._related[namehash]).map(function(id){return _this5._records[id];}):[];}/**
   * Filters given records by their TTL.
   * Returns clones of records to prevent changes to original objects.
   *
   * @param  {ResouceRecords[]} records
   * @param  {number}           cutoff - percentage, 0.0 - 1.0
   * @return {ResouceRecords[]}
   */},{key:"_filterTTL",value:function _filterTTL(records,cutoff){var _this6=this;return records.reduce(function(result,record){var then=_this6._insertionTime[record.hash];var elapsed=~~((Date.now()-then)/ONE_SECOND);var percent=(record.ttl-elapsed)/record.ttl;debug.v('└── %s @ %d%',record,~~(percent*100));if(percent>=cutoff){var clone=record.clone();clone.ttl-=elapsed;result.push(clone);}return result;},[]);}/**
   * Sets expiration/reissue timers for a record.
   *
   * Sets expiration at end of TTL.
   * Sets reissue events at 80%, 85%, 90%, 95% of records TTL, plus a random
   * extra 0-2%. (see rfc)
   *
   * @emits 'reissue' w/ the record that needs to be refreshed
   *
   * @param {ResouceRecords} record
   */},{key:"_schedule",value:function _schedule(record){var _this7=this;var id=record.hash;var ttl=record.ttl*ONE_SECOND;var expired=function expired(){return _this7["delete"](record);};var reissue=function reissue(){return _this7.emit('reissue',record);};var random=function random(min,max){return Math.random()*(max-min)+min;};this._timerContainers[id].setLazy(reissue,ttl*random(0.80,0.82));this._timerContainers[id].setLazy(reissue,ttl*random(0.85,0.87));this._timerContainers[id].setLazy(reissue,ttl*random(0.90,0.92));this._timerContainers[id].setLazy(reissue,ttl*random(0.95,0.97));this._timerContainers[id].set(expired,ttl);}}]);return ExpiringRecordCollection;}(EventEmitter);module.exports=ExpiringRecordCollection;