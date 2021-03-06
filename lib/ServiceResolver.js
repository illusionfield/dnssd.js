"use strict";function _typeof(obj){"@babel/helpers - typeof";if(typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"){_typeof=function _typeof(obj){return typeof obj;};}else{_typeof=function _typeof(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};}return _typeof(obj);}function _toConsumableArray(arr){return _arrayWithoutHoles(arr)||_iterableToArray(arr)||_unsupportedIterableToArray(arr)||_nonIterableSpread();}function _nonIterableSpread(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}function _unsupportedIterableToArray(o,minLen){if(!o)return;if(typeof o==="string")return _arrayLikeToArray(o,minLen);var n=Object.prototype.toString.call(o).slice(8,-1);if(n==="Object"&&o.constructor)n=o.constructor.name;if(n==="Map"||n==="Set")return Array.from(o);if(n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return _arrayLikeToArray(o,minLen);}function _iterableToArray(iter){if(typeof Symbol!=="undefined"&&Symbol.iterator in Object(iter))return Array.from(iter);}function _arrayWithoutHoles(arr){if(Array.isArray(arr))return _arrayLikeToArray(arr);}function _arrayLikeToArray(arr,len){if(len==null||len>arr.length)len=arr.length;for(var i=0,arr2=new Array(len);i<len;i++){arr2[i]=arr[i];}return arr2;}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}function _createClass(Constructor,protoProps,staticProps){if(protoProps)_defineProperties(Constructor.prototype,protoProps);if(staticProps)_defineProperties(Constructor,staticProps);return Constructor;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function");}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,writable:true,configurable:true}});if(superClass)_setPrototypeOf(subClass,superClass);}function _setPrototypeOf(o,p){_setPrototypeOf=Object.setPrototypeOf||function _setPrototypeOf(o,p){o.__proto__=p;return o;};return _setPrototypeOf(o,p);}function _createSuper(Derived){var hasNativeReflectConstruct=_isNativeReflectConstruct();return function(){var Super=_getPrototypeOf(Derived),result;if(hasNativeReflectConstruct){var NewTarget=_getPrototypeOf(this).constructor;result=Reflect.construct(Super,arguments,NewTarget);}else{result=Super.apply(this,arguments);}return _possibleConstructorReturn(this,result);};}function _possibleConstructorReturn(self,call){if(call&&(_typeof(call)==="object"||typeof call==="function")){return call;}return _assertThisInitialized(self);}function _assertThisInitialized(self){if(self===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return self;}function _isNativeReflectConstruct(){if(typeof Reflect==="undefined"||!Reflect.construct)return false;if(Reflect.construct.sham)return false;if(typeof Proxy==="function")return true;try{Date.prototype.toString.call(Reflect.construct(Date,[],function(){}));return true;}catch(e){return false;}}function _getPrototypeOf(o){_getPrototypeOf=Object.setPrototypeOf?Object.getPrototypeOf:function _getPrototypeOf(o){return o.__proto__||Object.getPrototypeOf(o);};return _getPrototypeOf(o);}var misc=require('./misc');var EventEmitter=require('./EventEmitter');var QueryRecord=require('./QueryRecord');var Query=require('./Query');var TimerContainer=require('./TimerContainer');var StateMachine=require('./StateMachine');var filename=require('path').basename(__filename);var debug=require('./debug')("dnssd:".concat(filename));var RType=require('./constants').RType;/**
 * Service Resolver
 *
 * In order to actually use a service discovered on the network, you need to
 * know the address of the service, the port its on, and any TXT data.
 * ServiceResponder takes a description of a service and any initial known
 * records and tries to find the missing pieces.
 *
 * ServiceResolver is a state machine with 3 states: unresolved, resolved, and
 * stopped. The resolver will stay active as long as knowledge about the
 * service is needed. The resolve will check for updates as service records go
 * stale and will notify if records expire and the service goes down.
 *
 */var resovlverStates={unresolved:{enter:function enter(){var _this=this;debug('Service is unresolved');// Give resolver 10s to query and resolve. If it can't find
// all the records it needs in 10s then something is probably wrong
this._timers.set('timeout',function(){debug('Resolver timed out.');_this.transition('stopped');},10*1000);this._queryForMissing();},incomingRecords:function incomingRecords(records){var wasUpdated=this._processRecords(records);if(this.isResolved())this.transition('resolved');else if(wasUpdated)this._queryForMissing();},reissue:function reissue(record){this._batchReissue(record);},exit:function exit(){this._cancelQueries();this._timers.clear('timeout');}},resolved:{enter:function enter(){debug('Service is resolved');this.emit('resolved');},incomingRecords:function incomingRecords(records){var wasUpdated=this._processRecords(records);if(!this.isResolved())this.transition('unresolved');else if(wasUpdated)this.emit('updated');},reissue:function reissue(record){this._batchReissue(record);},exit:function exit(){this._cancelQueries();}},stopped:{enter:function enter(){debug("Stopping resolver \"".concat(this.fullname,"\""));this._cancelQueries();this._removeListeners();this.emit('down');// override this.transition, because resolver is down now
// (shouldn't be a problem anyway, more for debugging)
this.transition=function(){return debug("Service is down! Can't transition.");};}}};/**
 * Creates a new ServiceResolver
 * @class
 *
 * Fullname is the string describing the service to resolve, like:
 * 'Instance (2)._http._tcp.local.'
 *
 * @emits 'resovled'
 * @emits 'updated'
 * @emits 'down'
 *
 * @param  {string} fullname
 * @param  {Networkinterfaces} intf
 * @return {ServiceResolver}
 */var ServiceResolver=/*#__PURE__*/function(_StateMachine){_inherits(ServiceResolver,_StateMachine);var _super=_createSuper(ServiceResolver);function ServiceResolver(fullname,intf){var _this2;_classCallCheck(this,ServiceResolver);debug("Creating new resolver for \"".concat(fullname,"\""));_this2=_super.call(this,resovlverStates);_this2.fullname=fullname;_this2._interface=intf;var parts=misc.parse(fullname);_this2.instance=parts.instance;_this2.serviceType=parts.service;_this2.protocol=parts.protocol;_this2.domain=parts.domain;// e.g. _http._tcp.local.
_this2.ptrname=misc.fqdn(_this2.serviceType,_this2.protocol,_this2.domain);// info required for resolution
_this2.addresses=[];_this2.target=null;_this2.port=null;_this2.txt=null;_this2.txtRaw=null;// keep one consistent service object so they resolved services can be
// compared by object reference or kept in a set/map
_this2._service={};// dirty flag to track changes to service info. gets reset to false before
// each incoming answer packet is checked.
_this2._changed=false;// offswitch used to communicate with & stop child queries instead of
// holding onto a reference for each one
_this2._offswitch=new EventEmitter();_this2._batch=[];_this2._timers=new TimerContainer(_assertThisInitialized(_this2));return _this2;}/**
   * Starts the resolver and parses optional starting records
   * @param {ResourceRecords[]} records
   */_createClass(ServiceResolver,[{key:"start",value:function start(records){debug('Starting resolver');this._addListeners();if(records){debug.verbose('Adding initial records: %r',records);this._processRecords(records);}this.isResolved()?this.transition('resolved'):this.transition('unresolved');}},{key:"stop",value:function stop(){debug('Stopping resolver');this.transition('stopped');}/**
   * Returns the service that has been resolved. Always returns the same obj
   * reference so they can be included in sets/maps or be compared however.
   *
   * addresses/txt/txtRaw are all cloned so any accidental changes to them
   * won't cause problems within the resolver.
   *
   * Ex: {
   *   fullname : 'Instance (2)._http._tcp.local.',
   *   name     : 'Instance (2)',
   *   type     : {name: 'http', protocol: 'tcp'},
   *   domain   : 'local',
   *   host     : 'target.local.',
   *   port     : 8888,
   *   addresses: ['192.168.1.1', '::1'],
   *   txt      : {key: 'value'},
   *   txtRaw   : {key: <Buffer 76 61 6c 75 65>},
   * }
   *
   * @return {object}
   */},{key:"service",value:function service(){// remove any leading underscores
var serviceType=this.serviceType.replace(/^_/,'');var protocol=this.protocol.replace(/^_/,'');// re-assign/update properties
this._service.fullname=this.fullname;this._service.name=this.instance;this._service.type={name:serviceType,protocol:protocol};this._service.domain=this.domain;this._service.host=this.target;this._service.port=this.port;this._service.addresses=this.addresses.slice();this._service.txt=this.txt?Object.assign({},this.txt):{};this._service.txtRaw=this.txtRaw?Object.assign({},this.txtRaw):{};// always return same obj
return this._service;}},{key:"isResolved",value:function isResolved(){return!!this.addresses.length&&!!this.target&&Number.isInteger(this.port)&&!!this.txtRaw;}/**
   * Listen to new answers coming to the interfaces. Do stuff when interface
   * caches report that a record needs to be refreshed or when it expires.
   * Stop on interface errors.
   */},{key:"_addListeners",value:function _addListeners(){var _this3=this;this._interface.using(this).on('answer',this._onAnswer).once('error',function(err){return _this3.transition('stopped',err);});this._interface.cache.using(this).on('reissue',this._onReissue).on('expired',this._onExpired);}},{key:"_removeListeners",value:function _removeListeners(){this._interface.removeListenersCreatedBy(this);this._interface.cache.removeListenersCreatedBy(this);}},{key:"_onAnswer",value:function _onAnswer(packet){this.handle('incomingRecords',[].concat(_toConsumableArray(packet.answers),_toConsumableArray(packet.additionals)));}/**
   * As cached records go stale they need to be refreshed. The cache will ask
   * for updates to records as they reach 80% 85% 90% and 95% of their TTLs.
   * This listens to all reissue events from the cache and checks if the record
   * is relevant to this resolver. If it is, the fsm will handle it based on
   * what state its currently in.
   *
   * If the SRV record needs to be updated the PTR is queried too. Some dumb
   * responders seem more likely to answer the PTR question.
   */},{key:"_onReissue",value:function _onReissue(record){var isRelevant=record.matches({name:this.fullname})||record.matches({name:this.ptrname,PTRDName:this.fullname})||record.matches({name:this.target});var isSRV=record.matches({rrtype:RType.SRV,name:this.fullname});if(isRelevant){this.handle('reissue',record);}if(isSRV){this.handle('reissue',{name:this.ptrname,rrtype:RType.PTR});}}/**
   * Check records as they expire from the cache. This how the resolver learns
   * that a service has died instead of from goodbye records with TTL=0's.
   * Goodbye's only tell the cache to purge the records in 1s and the resolver
   * should ignore those.
   */},{key:"_onExpired",value:function _onExpired(record){// PTR/SRV: transition to stopped, service is down
var isDown=record.matches({rrtype:RType.SRV,name:this.fullname})||record.matches({rrtype:RType.PTR,name:this.ptrname,PTRDName:this.fullname});// A/AAAA: remove address & transition to unresolved if none are left
var isAddress=record.matches({rrtype:RType.A,name:this.target})||record.matches({rrtype:RType.AAAA,name:this.target});// TXT: remove txt & transition to unresolved
var isTXT=record.matches({rrtype:RType.TXT,name:this.fullname});if(isDown){debug('Service expired, resolver going down. (%s)',record);this.transition('stopped');}if(isAddress){debug('Address record expired, removing. (%s)',record);this.addresses=this.addresses.filter(function(add){return add!==record.address;});if(!this.addresses.length)this.transition('unresolved');}if(isTXT){debug('TXT record expired, removing. (%s)',record);this.txt=null;this.txtRaw=null;this.transition('unresolved');}}/**
   * Checks incoming records for changes or updates. Returns true if anything
   * happened.
   *
   * @param  {ResourceRecord[]} incoming
   * @return {boolean}
   */},{key:"_processRecords",value:function _processRecords(incoming){var _this4=this;// reset changes flag before checking records
this._changed=false;// Ignore TTL 0 records. Get expiration events from the caches instead
var records=incoming.filter(function(record){return record.ttl>0;});if(!records.length)return false;var findOne=function findOne(params){return records.find(function(record){return record.matches(params);});};var findAll=function findAll(params){return records.filter(function(record){return record.matches(params);});};// SRV/TXT before A/AAAA, since they contain the target for A/AAAA records
var SRV=findOne({rrtype:RType.SRV,name:this.fullname});var TXT=findOne({rrtype:RType.TXT,name:this.fullname});if(SRV)this._processSRV(SRV);if(TXT)this._processTXT(TXT);if(!this.target)return this._changed;var As=findAll({rrtype:RType.A,name:this.target});var AAAAs=findAll({rrtype:RType.AAAA,name:this.target});if(As.length)As.forEach(function(A){return _this4._processAddress(A);});if(AAAAs.length)AAAAs.forEach(function(AAAA){return _this4._processAddress(AAAA);});return this._changed;}},{key:"_processSRV",value:function _processSRV(record){if(this.port!==record.port){this.port=record.port;this._changed=true;}// if the target changes the addresses are no longer valid
if(this.target!==record.target){this.target=record.target;this.addresses=[];this._changed=true;}}},{key:"_processTXT",value:function _processTXT(record){if(!misc.equals(this.txtRaw,record.txtRaw)){this.txtRaw=record.txtRaw;this.txt=record.txt;this._changed=true;}}},{key:"_processAddress",value:function _processAddress(record){if(this.addresses.indexOf(record.address)===-1){this.addresses.push(record.address);this._changed=true;}}/**
   * Tries to get info that is missing and needed for the service to resolve.
   * Checks the interface caches first and then sends out queries for whatever
   * is still missing.
   */},{key:"_queryForMissing",value:function _queryForMissing(){debug('Getting missing records');var questions=[];// get missing SRV
if(!this.target)questions.push({name:this.fullname,qtype:RType.SRV});// get missing TXT
if(!this.txtRaw)questions.push({name:this.fullname,qtype:RType.TXT});// get missing A/AAAA
if(this.target&&!this.addresses.length){questions.push({name:this.target,qtype:RType.A});questions.push({name:this.target,qtype:RType.AAAA});}// check interface caches for answers first
this._checkCache(questions);// send out queries for what is still unanswered
// (_checkCache may have removed all/some questions from the list)
if(questions.length)this._sendQueries(questions);}/**
   * Checks the cache for missing records. Tells the fsm to handle new records
   * if it finds anything
   */},{key:"_checkCache",value:function _checkCache(questions){var _this5=this;debug('Checking cache for needed records');var answers=[];// check cache for answers to each question
questions.forEach(function(question,index){var results=_this5._interface.cache.find(new QueryRecord(question));if(results&&results.length){// remove answered questions from list
questions.splice(index,1);answers.push.apply(answers,_toConsumableArray(results));}});// process any found records
answers.length&&this.handle('incomingRecords',answers);}/**
   * Sends queries out on each interface for needed records. Queries are
   * continuous, they keep asking until they get the records or until they
   * are stopped by the resolver with `this._cancelQueries()`.
   */},{key:"_sendQueries",value:function _sendQueries(questions){debug('Sending queries for needed records');// stop any existing queries, they might be stale now
this._cancelQueries();// no 'answer' event handler here because this resolver is already
// listening to the interface 'answer' event
new Query(this._interface,this._offswitch).ignoreCache(true).add(questions).start();}/**
   * Reissue events from the cache are slightly randomized for each record's TTL
   * (80-82%, 85-87% of the TTL, etc) so reissue queries are batched here to
   * prevent a bunch of outgoing queries from being sent back to back 10ms apart.
   */},{key:"_batchReissue",value:function _batchReissue(record){var _this6=this;debug('Batching record for reissue %s',record);this._batch.push(record);if(!this._timers.has('batch')){this._timers.setLazy('batch',function(){_this6._sendReissueQuery(_this6._batch);_this6._batch=[];},1*1000);}}/**
   * Asks for updates to records. Only sends one query out (non-continuous).
   */},{key:"_sendReissueQuery",value:function _sendReissueQuery(records){debug('Reissuing query for cached records: %r',records);var questions=records.map(function(_ref){var name=_ref.name,rrtype=_ref.rrtype;return{name:name,qtype:rrtype};});new Query(this._interface,this._offswitch).continuous(false)// only send query once, don't need repeats
.ignoreCache(true)// ignore cache, trying to renew this record
.add(questions).start();}},{key:"_cancelQueries",value:function _cancelQueries(){debug('Sending stop signal to active queries & canceling batched');this._offswitch.emit('stop');this._timers.clear('batch');}}]);return ServiceResolver;}(StateMachine);module.exports=ServiceResolver;