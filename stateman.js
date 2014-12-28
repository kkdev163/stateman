/**
@author	undefined
@version	0.1.2
@homepage	https://github.com/leeluolee/maze
*/
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["StateMan"] = factory();
	else
		root["StateMan"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var StateMan = __webpack_require__(1);





	StateMan.Histery = __webpack_require__(2);
	StateMan.util = __webpack_require__(3);
	StateMan.State = __webpack_require__(4);

	module.exports = StateMan;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var State = __webpack_require__(4),
	  Histery = __webpack_require__(2),
	  brow = __webpack_require__(5),
	  _ = __webpack_require__(3),
	  stateFn = State.prototype.state;



	function StateMan(options){
	  if(this instanceof StateMan === false){ return new StateMan(options)}
	  options = options || {};
	  if(options.history) this.history = options.history;
	  this._states = {};
	  this.current = this.pending = this;
	}


	_.extend( _.emitable( StateMan ), {
	    // start StateMan

	    state: function(stateName, config){
	      var pending = this.pending;
	      if(typeof stateName === "string" && pending.name){
	         stateName = stateName.replace("~", pending.name)
	         if(pending.parent) stateName = stateName.replace("^", pending.parent.name || "");
	      }
	      // ^ represent current.parent
	      // ~ represent  current
	      // only 
	      return stateFn.apply(this, arguments);
	    },
	    start: function(options){
	      if( !this.history ) this.history = new Histery(options); 
	      this.history.on("change", _.bind(this._afterPathChange, this));

	      // if the history service is not runing, start it
	      if(!this.history.isStart) this.history.start();
	      return this;
	    },
	    // @TODO direct go the point state
	    go: function(state, option, callback){
	      option = option || {};
	      if(typeof state === "string") state = this.state(state);
	      if(option.encode !== false){
	        var url = state.encode(option.param)
	        this.nav(url, {silent: true, replace: option.replace});
	        this.path = url;
	      }
	      this._go(state, option, callback);
	      return this;
	    },
	    nav: function(url, options, callback){
	      callback && (this._cb = callback)
	      this.history.nav( url, options);
	      this._cb = null;
	      return this;
	    },
	    decode: function(path){
	      var pathAndQuery = path.split("?");
	      var query = this._findQuery(pathAndQuery[1]);
	      path = pathAndQuery[0];
	      var state = this._findState(this, path);
	      if(state) _.extend(state.param, query);
	      return state;
	    },
	    encode: State.prototype.encode,
	    // notify specify state
	    notify: function(path, param){
	      return this.state(path).emit("notify", param);
	    },
	    // check the pending statename whether to match the passed condition (stateName and param)
	    is: function(stateName, param, isStrict){
	      if(!stateName) return false;
	      var stateName = (stateName.name || stateName).trim();
	      var pending = this.pending, pendingName = pending.name;
	      var matchPath = isStrict? pendingName === stateName : (pendingName + ".").indexOf(stateName + ".")===0;
	      return matchPath && (!param || _.eql(param, this.param)); 
	    },
	    // after pathchange changed
	    // @TODO: afterPathChange need based on decode
	    _afterPathChange: function(path){

	      this.emit("history:change", path);


	      var found = this.decode(path), callback = this._cb;

	      this.path = path;

	      if(!found){
	        // loc.nav("$default", {silent: true})
	        var $notfound = this.state("$notfound");
	        if($notfound) this._go($notfound, {path: path}, callback);

	        return this.emit("404", {path: path});
	      }


	      this._go( found, { param: found.param}, callback );
	    },

	    // goto the state with some option
	    _go: function(state, option, callback){

	      if(typeof state === "string") state = this.state(state);

	      if(!state) return _.log("destination is not defined")

	      // not touch the end in previous transtion

	      if(this.pending !== this.current){
	        // we need return

	        if(this.pending._pending){
	          
	          _.log("beacuse "+ this.pending.name+" is pending, the nav to [" +state.name+ "] is be forbit");

	          this.emit("forbid", state);

	          return this.nav(this.current.encode(this.param), {silent: true})
	        }else{
	          _.log("naving to [" + this.current.name + "] will be stoped, trying to ["+state.name+"] now");
	          this.current = this.pending;
	        }
	        // back to before
	      }
	      this.param = option.param || {};

	      var current = this.current,
	        baseState = this._findBase(current, state),
	        self = this;


	      if(current !== state){
	        this.previous = current;
	        this.current = state;
	        self.emit("begin")
	        this._leave(baseState, option, function(){
	          self._enter(state, option, function(){
	            self.emit("end")
	            if(typeof callback === "function") callback.call(self);
	          })
	        })
	      }
	      this._checkQueryAndParam(baseState, option);
	    },
	    _findQuery: function(querystr){
	      var queries = querystr && querystr.split("&"), query= {};
	      if(queries){
	        var len = queries.length;
	        var query = {};
	        for(var i =0; i< len; i++){
	          var tmp = queries[i].split("=");
	          query[tmp[0]] = tmp[1];
	        }
	      }
	      return query;
	    },
	    _findState: function(state, path){
	      var states = state._states, found, param;

	      // leaf-state has the high priority upon branch-state
	      if(state.hasNext){
	        for(var i in states) if(states.hasOwnProperty(i)){
	          found = this._findState( states[i], path );
	          if( found ) return found;
	        }
	      }
	      param = state.regexp && state.decode(path);
	      if(param){
	        state.param = param;
	        return state;
	      }else{
	        return false;
	      }
	    },
	    // find the same branch;
	    _findBase: function(now, before){
	      if(!now || !before || now == this || before == this) return this;
	      var np = now, bp = before, tmp;
	      while(np && bp){
	        tmp = bp;
	        while(tmp){
	          if(np === tmp) return tmp;
	          tmp = tmp.parent;
	        }
	        np = np.parent;
	      }
	      return this;
	    },
	    _enter: function(end, options, callback){

	      callback = callback || _.noop;

	      var pending = this.pending;

	      if(pending == end) return callback();
	      var stage = [];
	      while(end !== pending && end){
	        stage.push(end);
	        end = end.parent;
	      }
	      this._enterOne(stage, options, callback)
	    },
	    _enterOne: function(stage, options, callback){

	      var cur = stage.pop(), self = this;
	      if(!cur) return callback();

	      this.pending = cur;

	      cur.done = function(){
	        self._enterOne(stage, options, callback)
	        cur._pending = false;
	        cur.done = null;
	        cur.visited = true;
	      }

	      if(!cur.enter) cur.done();
	      else {
	        cur.enter(options);
	        if(!cur._pending && cur.done) cur.done();
	      }
	    },
	    _leave: function(end, options, callback){
	      callback = callback || _.noop;
	      if(end == this.pending) return callback();
	      this._leaveOne(end, options,callback)
	    },
	    _leaveOne: function(end, options, callback){
	      if( end === this.pending ) return callback();
	      var cur = this.pending, self = this;
	      cur.done = function(){
	        if(cur.parent) self.pending = cur.parent;
	        self._leaveOne(end, options, callback)
	        cur._pending = false;
	        cur.done = null;
	      }
	      if(!cur.leave) cur.done();
	      else{
	        cur.leave(options);
	        if(!cur._pending && cur.done) cur.done();
	      }
	    },
	    // check the query and Param
	    _checkQueryAndParam: function(baseState, options){
	      var from = baseState;
	      while( from !== this ){
	        from.update && from.update(options);
	        from = from.parent;
	      }
	    }

	}, true)



	module.exports = StateMan;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	
	// MIT
	// Thx Backbone.js 1.1.2  and https://github.com/cowboy/jquery-hashchange/blob/master/jquery.ba-hashchange.js
	// for iframe patches in old ie.

	var browser = __webpack_require__(5);
	var _ = __webpack_require__(3);


	// the mode const
	var QUIRK = 3,
	  HASH = 1,
	  HISTORY = 2;



	// extract History for test
	// resolve the conficlt with the Native History
	function Histery(options){
	  options = options || {};

	  // Trick from backbone.history for anchor-faked testcase 
	  this.location = options.location || browser.location;

	  // mode config, you can pass absolute mode (just for test);
	  this.mode = options.mode || (options.html5 && browser.history ? HISTORY: HASH); 
	  this.html5 = options.html5;
	  if( !browser.hash ) this.mode = this.mode | HISTORY;

	  // hash prefix , used for hash or quirk mode
	  this.prefix = "#" + (options.prefix || "") ;
	  this.rPrefix = new RegExp(this.prefix + '(.*)$');
	  this.interval = options.interval || 1000;

	  // the root regexp for remove the root for the path. used in History mode
	  this.root = options.root ||  "/" ;
	  this.rRoot = new RegExp("^" +  this.root);

	  this._fixInitState();

	  this.autolink = options.autolink!==false;

	  this.curPath = undefined;
	}

	_.extend( _.emitable(Histery), {
	  // check the 
	  start: function(){
	    var path = this.getPath();
	    this._checkPath = _.bind(this.checkPath, this);

	    if( this.isStart ) return;
	    this.isStart = true;

	    if(this.mode === QUIRK){
	      this._fixHashProbelm(path); 
	    }

	    switch ( this.mode ){
	      case HASH: 
	        browser.on(window, "hashchange", this._checkPath); break;
	      case HISTORY:
	        browser.on(window, "popstate", this._checkPath);
	        break;
	      case QUIRK:
	        this._checkLoop();
	    }
	    // event delegate
	    this.autolink && this._autolink();

	    this.curPath = path;

	    this.emit("change", path);
	  },
	  // the history teardown
	  stop: function(){

	    browser.off(window, 'hashchange', this._checkPath)  
	    browser.off(window, 'popstate', this._checkPath)  
	    clearTimeout(this.tid);
	    this.isStart = false;
	    this._checkPath = null;
	  },
	  // get the path modify
	  checkPath: function(ev){

	    var path = this.getPath(), curPath = this.curPath;

	    //for oldIE hash history issue
	    if(path === curPath && this.iframe){
	      curPath = this.getPath(this.iframe.location);
	    }

	    if( path !== curPath ) {
	      this.iframe && this.nav(path, {silent: true});
	      this.emit('change', (this.curPath=path));
	    }
	  },
	  // get the current path
	  getPath: function(location){
	    var location = location || this.location, tmp;
	    if( this.mode !== HISTORY ){
	      tmp = location.href.match(this.rPrefix);
	      return tmp && tmp[1]? tmp[1]: "";

	    }else{
	      return _.cleanPath(( location.pathname + location.search || "" ).replace( this.rRoot, "/" ))
	    }
	  },

	  nav: function(to, options ){

	    var iframe = this.iframe;

	    options = options || {};

	    to = _.cleanPath(to);

	    if(this.curPath == to) return;

	    // pushState wont trigger the checkPath
	    // but hashchange will
	    // so we need set curPath before to forbit the CheckPath
	    this.curPath = to;

	    // 3 or 1 is matched
	    if( this.mode !== HISTORY ){
	      this._setHash(this.location, to, options.replace)
	      if( iframe && this.getPath(iframe.location) !== to ){
	        //
	        if(!options.replace) iframe.document.open().close();
	        this._setHash(this.iframe.location, to, options.replace)
	      }
	    }else{
	      history[options.replace? 'replaceState': 'pushState']( {}, options.title || "" , _.cleanPath( this.root + to ) )
	    }

	    if( !options.silent ) this.emit('change', to);
	  },
	  _autolink: function(){
	    // only in html5 mode, the autolink is works
	    // if(this.mode !== 2) return;
	    var prefix = this.prefix, self = this;
	    browser.on( document.body, "click", function(ev){
	      var target = ev.target || ev.srcElement;
	      if( target.tagName.toLowerCase() !== "a" ) return;
	      var tmp = (browser.getHref(target)||"").match(self.rPrefix);
	      var hash = tmp && tmp[1]? tmp[1]: "";

	      if(!hash) return;
	      
	      ev.preventDefault && ev.preventDefault();
	      self.nav( hash , {force: true})
	      return (ev.returnValue = false);
	    } )
	  },
	  _setHash: function(location, path, replace){
	    var href = location.href.replace(/(javascript:|#).*$/, '');
	    if (replace){
	      location.replace(href + this.prefix+ path);
	    }
	    else location.hash = this.prefix+ path;
	  },
	  // for browser that not support onhashchange
	  _checkLoop: function(){
	    var self = this; 
	    this.tid = setTimeout( function(){
	      self._checkPath();
	      self._checkLoop();
	    }, this.interval );
	  },
	  // if we use real url in hash env( browser no history popstate support)
	  // or we use hash in html5supoort mode (when paste url in other url)
	  // then , histery should repara it
	  _fixInitState: function(){
	    var pathname = _.cleanPath(this.location.pathname), hash, hashInPathName;

	    // dont support history popstate but config the html5 mode
	    if( this.mode !== HISTORY && this.html5){

	      hashInPathName = pathname.replace(this.rRoot, "")
	      if(hashInPathName) this.location.replace(this.root + this.prefix + hashInPathName);

	    }else if( this.mode === HISTORY /* && pathname === this.root*/){

	      hash = this.location.hash.replace(this.prefix, "");
	      if(hash) history.replaceState({}, document.title, _.cleanPath(this.root + hash))

	    }
	  },
	  // Thanks for backbone.history and https://github.com/cowboy/jquery-hashchange/blob/master/jquery.ba-hashchange.js
	  // for helping stateman fixing the oldie hash history issues when with iframe hack
	  _fixHashProbelm: function(path){
	    var iframe = document.createElement('iframe'), body = document.body;
	    iframe.src = 'javascript:;';
	    iframe.style.display = 'none';
	    iframe.tabIndex = -1;
	    iframe.title = "";
	    this.iframe = body.insertBefore(iframe, body.firstChild).contentWindow;
	    this.iframe.document.open().close();
	    this.iframe.location.hash = '#' + path;
	  }
	  
	})





	module.exports = Histery;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var _ = module.exports = {};
	var slice = [].slice, o2str = ({}).toString;


	// merge o2's properties to Object o1. 
	_.extend = function(o1, o2, override){
	  for(var i in o2) if(override || o1[i] === undefined){
	    o1[i] = o2[i]
	  }
	  return o1;
	}


	// Object.create shim
	_.ocreate = Object.create || function(o) {
	  var Foo = function(){};
	  Foo.prototype = o;
	  return new Foo;
	}


	_.slice = function(arr, index){
	  return slice.call(arr, index);
	}

	_.typeOf = function typeOf (o) {
	  return o == null ? String(o) : o2str.call(o).slice(8, -1).toLowerCase();
	}

	//strict eql
	_.eql = function(o1, o2){
	  var t1 = _.typeOf(o1), t2 = _.typeOf(o2);
	  if( t1 !== t2) return false;
	  if(t1 === 'object'){
	    var equal = true;
	    for(var i in o1){
	      if( !_.eql(o1[i], o2[i]) ) equal = false;
	    }
	    for(var j in o2){
	      if( !_.eql(o1[j], o2[j]) ) equal = false;
	    }
	    return equal;
	  }
	  return o1 === o2;
	}


	// small emitter 
	_.emitable = (function(){
	  var API = {
	    on: function(event, fn) {
	      if(typeof event === 'object'){
	        for (var i in event) {
	          this.on(i, event[i]);
	        }
	      }else{
	        var handles = this._handles || (this._handles = {}),
	          calls = handles[event] || (handles[event] = []);
	        calls.push(fn);
	      }
	      return this;
	    },
	    off: function(event, fn) {
	      if(!event || !this._handles) this._handles = {};
	      if(!this._handles) return;

	      var handles = this._handles , calls;

	      if (calls = handles[event]) {
	        if (!fn) {
	          handles[event] = [];
	          return this;
	        }
	        for (var i = 0, len = calls.length; i < len; i++) {
	          if (fn === calls[i]) {
	            calls.splice(i, 1);
	            return this;
	          }
	        }
	      }
	      return this;
	    },
	    emit: function(event){
	      var args = _.slice(arguments, 1),
	        handles = this._handles, calls;

	      if (!handles || !(calls = handles[event])) return this;
	      for (var i = 0, len = calls.length; i < len; i++) {
	        calls[i].apply(this, args)
	      }
	      return this;
	    }
	  }
	  return function(obj){
	      obj = typeof obj == "function" ? obj.prototype : obj;
	      return _.extend(obj, API)
	  }
	})();


	_.noop = function(){}

	_.bind = function(fn, context){
	  return function(){
	    return fn.apply(context, arguments);
	  }
	}

	var rDbSlash = /\/+/g, // double slash
	  rEndSlash = /\/$/;    // end slash

	_.cleanPath = function (path){
	  return ("/" + path).replace( rDbSlash,"/" ).replace( rEndSlash, "" ) || "/";
	}

	// normalize the path
	function normalizePath(path) {
	  // means is from 
	  // (?:\:([\w-]+))?(?:\(([^\/]+?)\))|(\*{2,})|(\*(?!\*)))/g
	  var preIndex = 0;
	  var keys = [];
	  var index = 0;
	  var matches = "";

	  path = _.cleanPath(path);

	  var regStr = path
	    //  :id(capture)? | (capture)   |  ** | * 
	    .replace(/\:([\w-]+)(?:\(([^\/]+?)\))?|(?:\(([^\/]+)\))|(\*{2,})|(\*(?!\*))/g, 
	      function(all, key, keyformat, capture, mwild, swild, startAt) {
	        // move the uncaptured fragment in the path
	        if(startAt > preIndex) matches += path.slice(preIndex, startAt);
	        preIndex = startAt + all.length;
	        if( key ){
	          matches += "(" + key + ")";
	          keys.push(key)
	          return "("+( keyformat || "[\\w-]+")+")";
	        }
	        matches += "(" + index + ")";

	        keys.push( index++ );

	        if( capture ){
	           // sub capture detect
	          return "(" + capture +  ")";
	        } 
	        if(mwild) return "(.*)";
	        if(swild) return "([^\\/]*)";
	    })

	  if(preIndex !== path.length) matches += path.slice(preIndex)

	  return {
	    regexp: new RegExp("^" + regStr +"/?$"),
	    keys: keys,
	    matches: matches || path
	  }
	}

	_.log = function(msg, type){
	  typeof console !== "undefined" && console[type || "log"](msg)
	}


	_.normalize = normalizePath;



/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(3);

	function State(option){
	  this._states = {};
	  this._pending = false;
	  this.visited = false;
	  if(option) this.config(option);
	}


	//regexp cache
	State.rCache = {};

	_.extend( _.emitable( State ), {
	  
	  state: function(stateName, config){
	    if(_.typeOf(stateName) === "object"){
	      for(var i in stateName){
	        this.state(i, stateName[i])
	      }
	      return this;
	    }
	    var current, next, nextName, states = this._states, i=0;

	    if( typeof stateName === "string" ) stateName = stateName.split(".");

	    var slen = stateName.length, current = this;
	    var stack = [];


	    do{
	      nextName = stateName[i];
	      next = states[nextName];
	      stack.push(nextName);
	      if(!next){
	        if(!config) return;
	        next = states[nextName] = new State();
	        _.extend(next, {
	          parent: current,
	          manager: current.manager || current,
	          name: stack.join("."),
	          currentName: nextName
	        })
	        current.hasNext = true;
	        next.configUrl();
	      }
	      current = next;
	      states = next._states;
	    }while((++i) < slen )

	    if(config){
	       next.config(config);
	       return this;
	    } else {
	      return current;
	    }
	  },

	  config: function(configure){
	    if(!configure ) return;
	    configure = this._getConfig(configure);

	    for(var i in configure){
	      var prop = configure[i];
	      switch(i){
	        case "url": 
	          if(typeof prop === "string"){
	            this.url = prop;
	            this.configUrl();
	          }
	          break;
	        case "events": 
	          this.on(prop)
	          break;
	        default:
	          this[i] = prop;
	      }
	    }
	  },

	  // children override
	  _getConfig: function(configure){
	    return typeof configure === "function"? {enter: configure} : configure;
	  },

	  //from url 

	  configUrl: function(){
	    var url = "" , base = this, currentUrl;
	    var _watchedParam = [];

	    while( base ){

	      url = (typeof base.url === "string" ? base.url: (base.currentName || "")) + "/" + url;

	      if(base === this){
	        // url.replace(/\:([-\w]+)/g, function(all, capture){
	        //   _watchedParam.push()
	        // })
	        this._watchedParam = _watchedParam.concat(this.watched || []);
	      }
	      // means absolute;
	      if(url.indexOf("^/") === 0) {
	        url = url.slice(1);
	        break;
	      }
	      base = base.parent;
	    }
	    this.path = _.cleanPath("/" + url);
	    var pathAndQuery = this.path.split("?");
	    this.path = pathAndQuery[0];
	    // some Query we need watched
	    if(pathAndQuery[1]){
	      this._watchedQuery = pathAndQuery[1].split("&");
	    }

	    _.extend(this, _.normalize(this.path), true);
	  },
	  encode: function(stateName, param){
	    var state;
	    if(typeof param === "undefined"){
	      state = this;
	      param = stateName;
	    }else{
	      state = this.state(stateName);
	    }
	    var param = param || {};

	    var matched = "%";

	    var url = state.matches.replace(/\(([\w-]+)\)/g, function(all, capture){
	      var sec = param[capture] || "";
	      matched+= capture + "%";
	      return sec;
	    }) + "?";

	    // remained is the query, we need concat them after url as query
	    for(var i in param) {
	      if( matched.indexOf("%"+i+"%") === -1) url += i + "=" + param[i] + "&";
	    }
	    return _.cleanPath( url.replace(/(?:\?|&)$/,"") )
	  },
	  decode: function( path ){
	    var matched = this.regexp.exec(path),
	      keys = this.keys;

	    if(matched){

	      var param = {};
	      for(var i =0,len=keys.length;i<len;i++){
	        param[keys[i]] = matched[i+1] 
	      }
	      return param;
	    }else{
	      return false;
	    }
	  },
	  async: function(){
	    var self = this;
	    this._pending = true;
	    return this.done;
	  }

	})


	module.exports = State;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	
	var win = window, 
	  doc = document;



	var b = module.exports = {
	  hash: "onhashchange" in win && (!doc.documentMode || doc.documentMode > 7),
	  history: win.history && "onpopstate" in win,
	  location: win.location,
	  getHref: function(node){
	    return "href" in node ? node.getAttribute("href", 2) : node.getAttribute("href");
	  },
	  on: "addEventListener" in win ?  // IE10 attachEvent is not working when binding the onpopstate, so we need check addEventLister first
	      function(node,type,cb){return node.addEventListener( type, cb )}
	    : function(node,type,cb){return node.attachEvent( "on" + type, cb )},
	    
	  off: "removeEventListener" in win ? 
	      function(node,type,cb){return node.removeEventListener( type, cb )}
	    : function(node,type,cb){return node.detachEvent( "on" + type, cb )}
	}

	b.msie = parseInt((/msie (\d+)/.exec(navigator.userAgent.toLowerCase()) || [])[1]);
	if (isNaN(b.msie)) {
	  b.msie = parseInt((/trident\/.*; rv:(\d+)/.exec(navigator.userAgent.toLowerCase()) || [])[1]);
	}


/***/ }
/******/ ])
});
