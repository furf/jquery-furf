/**
 * BACK-COMPAT FOR jQuery v1.3.2
 */
;(function (window, document, jQuery) {

  /**
   * The following two functions are required for a good amount of
   * functionality below. They are provided for compatibility with jQuery
   * versions less than 1.4. If you are using jQuery 1.4 or later, feel free
   * to delete them from the code.
   */

  /**
   * proxy function lifted from jQuery 1.4 for backward compatibility
   */
  jQuery.proxy = jQuery.proxy || function( fn, proxy, thisObject ) {
    if ( arguments.length === 2 ) {
      if ( typeof proxy === "string" ) {
        thisObject = fn;
        fn = thisObject[ proxy ];
        proxy = undefined;

      } else if ( proxy && !jQuery.isFunction( proxy ) ) {
        thisObject = proxy;
        proxy = undefined;
      }
    }

    if ( !proxy && fn ) {
      proxy = function() {
        return fn.apply( thisObject || this, arguments );
      };
    }

    // Set the guid of unique handler to the same of original handler, so it
    // can be removed
    if ( fn ) {
      proxy.guid = fn.guid = fn.guid || proxy.guid || jQuery.guid++;
    }

    // So proxy can be declared as an argument
    return proxy;
  };

  /**
   * jQuery.parseJSON lifted from jQuery 1.4 for backward compatibility
   */
  jQuery.parseJSON = jQuery.parseJSON || function( data ) {
		if ( typeof data !== "string" || !data ) {
			return null;
		}

		// Make sure leading/trailing whitespace is removed (IE can't handle it)
		data = jQuery.trim( data );

		// Make sure the incoming data is actual JSON
		// Logic borrowed from http://json.org/json2.js
		if ( /^[\],:{}\s]*$/.test(data.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
			.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
			.replace(/(?:^|:|,)(?:\s*\[)+/g, "")) ) {

			// Try to use the native JSON parser first
			return window.JSON && window.JSON.parse ?
				window.JSON.parse( data ) :
				(new Function("return " + data))();

		} else {
			jQuery.error( "Invalid JSON: " + data );
		}
	};

  /* END BACK-COMPAT */
})(this, this.document, this.jQuery);


/**
 * jQuery.furf extensions to jQuery
 */
;(function (window, document, jQuery) {


  /**
   * Chrome loses original sort order when using a sort function
   */
  jQuery.support.arraySortMaintainsIndex = ![0,1].sort(function () {
    return 0;
  })[0];


  /**
   * Duck punch regular expression support into jQuery.fn.removeClass
   */
  var removeClass = jQuery.fn.removeClass;

  jQuery.fn.removeClass = function (value) {
    if (value instanceof RegExp) {
      return this.each(function () {
        this.className = jQuery.white(jQuery.grep(jQuery.unwhite(this.className), function (className) {
          return !value.test(className);
        }));
      });
    } else {
      return removeClass.apply(this, arguments);
    }
  };




  /**
   * proxy function for event callbacks - omits event argument for better
   * compatibility with external APIs
   */
  jQuery.eventProxy = function (fn, proxy, context) {
    fn = jQuery.proxy.apply(this, arguments);
    return function () {
      return fn.apply(this, Array.prototype.slice.call(arguments, 1));
    };
  };


  /**
   * Converts an array to a whitespace-delimited string
   * @param Array arr
   */
  jQuery.white = function (arr) {
    return arr.join(' ');
  };


  /**
   * Converts a whitespace-delimited string to an array
   * @param String str
   */
  var rwhite = /\s+/;

  jQuery.unwhite = function (str) {
    str = jQuery.trim(str);
    return str.length ? str.split(rwhite) : [];
  };


  /**
   * Set and get deeply nested properties from an object
   */
  var toString = Object.prototype.toString;

  jQuery.deep = function (obj, prop, val) {

    var props = prop.split('.'),
        root, i = 0, n, p;

    // Set deep value
    if (arguments.length > 2) {

      root = obj;
      n = props.length - 1;

      while (i < n) {
        p = props[i++];
        obj = obj[p] = (typeof obj[p] === 'object' || toString.call(obj[p]) === '[object Function]') ? obj[p] : {};
      }

      obj[props[i]] = val;

      return root;

    // Get deep value
    } else {
      n = props.length;
      while (typeof (obj = obj[props[i]]) !== 'undefined' && ++i < n){}
      return obj;
    }
  };


  /**
   * Create a namespace on a supplied object
   */
  jQuery.namespace = function (obj, ns) {

    var props = (ns || obj).split('.'),
        i = 0, n = props.length, p;

    obj = (ns && obj) || window;

    while (i < n) {
      p = props[i++];
      obj = obj[p] = (typeof obj[p] === 'object' || toString.call(obj[p]) === '[object Function]') ? obj[p] : {};
    }

    return obj;
  };


  /**
   * Ensure that we have an array to iterate
   */
  jQuery.ensureArray = function (arr) {
    return jQuery.isArray(arr) ? arr : typeof arr !== 'undefined' ? [arr] : [];
  };


  /**
   * Ensure that we have a date to the prom
   */
  jQuery.ensureDate = function (date) {
    return date ? date instanceof Date ? date : new Date(date) : new Date();
  };


  // @todo incorporate ensureDate
  jQuery.floorDate = function (floor /*, date, clone */) {

    var clone = (arguments[2] === true),
        date  = (typeof arguments[1] !== 'undefined') ? arguments[1] : new Date();
  
    if (clone || !(date instanceof Date)) {
      date = new Date(date);
    }

    switch(floor) {
      case 'year':   date.setMonth(0);
      case 'month':  date.setDate(1);
      case 'day':    date.setHours(0);
      case 'hour':   date.setMinutes(0);
      case 'minute': date.setSeconds(0);
      default:       date.setMilliseconds(0);
    }
  
    return date;
  };

  /**
   * Re-index an object, optionally maintaining the original index and/or
   * modifying the original object (instead of a clone)
   */
  jQuery.rehash = function (source, property, maintainSourceKey, modifySource) {

    var target = modifySource ? source : {}, sourceKey, sourceVal, targetKey;

    for (sourceKey in source) {
      if (source.hasOwnProperty(sourceKey)) {

        sourceVal = source[sourceKey];

        // Convert to string to allow rehashing by booleans!
        targetKey = '' + jQuery.deep(sourceVal, property);

        if (targetKey) {

          if (targetKey in target) {
            (target[targetKey] = jQuery.ensureArray(target[targetKey])).push(sourceVal);
          } else {
            target[targetKey] = sourceVal;
          }

          if (modifySource && !maintainSourceKey) {
            delete target[sourceKey];
          } else if (maintainSourceKey && !modifySource) {
            target[sourceKey] = sourceVal;
          }
        }

      }
    }

    return target;
  };


  jQuery.truncate = function (str, n) {
    return str.length < n ? str : (new RegExp('^(.{0,' + (n - 1) + '}\\S)(\\s|jQuery)')).exec(str)[1] + '...';
  };


  jQuery.ordinal = function (n) {
    return ['th', 'st', 'nd', 'rd'][(n = n < 0 ? -n : n) > 10 && n < 14 || !(n = ~~n % 10) || n > 3 ? 0 : n];
  };


  /**
   * Adds or creates an abstract interface to an object literal or prototype
   * @param Object obj
   * @param String methods
   */
  jQuery.specify = function (obj, methods) {

    obj = jQuery.isFunction(obj) ? obj.prototype : obj;

    jQuery.each(jQuery.unwhite(methods), function (i, name) {
      if (!jQuery.isFunction(obj[name])) {
        obj[name] = function () {
          throw new Error(name + ' is an abstract method which must be implemented or overloaded.');
        };
      }
    });
  };


  /**
   * Lifted from YUI 2.6.0
   * IE will not enumerate native functions in a derived object even if the
   * function was overridden.  This is a workaround for specific functions
   * we care about on the Object prototype.
   */
  jQuery.support.nativeEnum = (function () {

    var target = { valueOf: function () { return false; } },
        source = { valueOf: function () { return true; } },
        name;

    for (name in source) {
      if (source.hasOwnProperty(name)) {
        target[name] = source[name];
      }
    }

    return target.valueOf();
  })();

  jQuery.IENativeEnumFix = function (target, source) {
    jQuery.each(['toString', 'valueOf'], function (i, name) {
      var fn = source[name];
      if (jQuery.isFunction(fn) && fn !== Object.prototype[name]) {
        target[name] = fn;
      }
    });
  };


  /**
   * Pseudo-classical OOP inheritance
   * @param Function child
   * @param Function parent
   * @param Object overrides
   */
  jQuery.inherit = function (child, parent, overrides) {

    if (!jQuery.isFunction(parent) || !jQuery.isFunction(child)) {
      throw new Error('jQuery.inherit failed, please check that all dependencies are included.');
    }

    var name;

    function F () {
      this._parent = parent.prototype;
    }

    F.prototype = parent.prototype;

    child.prototype = new F ();
    child.prototype.constructor = child;
    child.parent = parent.prototype;

    if (parent.prototype.constructor === Object.prototype.constructor) {
      parent.prototype.constructor = parent;
    }

    if (overrides) {
      for (name in overrides) {
        if (overrides.hasOwnProperty(name)) {
          child.prototype[name] = overrides[name];
        }
      }

      if (!jQuery.support.nativeEnum) {
        jQuery.IENativeEnumFix(child.prototype, overrides);
      }
    }
  };


  /**
   * Add jQuery custom events to any object
   * @param Object obj
   * @param String types
   */
  jQuery.bindable = function (obj, types) {

    /**
     * Allow use of prototype for shorthanding the augmentation of classes
     */
    obj = jQuery.isFunction(obj) ? obj.prototype : obj;

    /**
     * Augment the object with jQuery's bind, one, and unbind event methods
     */
    jQuery(['bind', 'one', 'unbind']).each(function (i, method) {
      obj[method] = function (type, data, fn, thisObject) {
        jQuery(this)[method](type, data, fn, thisObject);
        return this;
      };
    });

    /**
     * The trigger event must be augmented separately because it requires a new
     * Event to prevent unexpected triggering of a method (and possibly
     * infinite recursion) when the event type matches the method name
     */
    obj.trigger = function (type, data) {
      var event = new jQuery.Event(type);
      event.preventDefault();
      jQuery(this).trigger(event, data);
      return this;
    };

    /**
     * Create convenience methods for event subscription which bind callbacks
     * to specified events
     */
    if (typeof types === 'string') {
      jQuery.each(jQuery.unwhite(types), function (i, type) {
        obj[type] = function (data, fn, thisObject) {
          return arguments.length ? this.bind(type, data, fn, thisObject) : this.trigger(type);
        };
      });
    }

    return obj;
  };


  /**
   * jQuery.loadable
   *
   * @param Object obj Object to be augmented with bindable behavior
   * @param Object defaultCfg Default jQuery.ajax configuration object
   */
  jQuery.loadable = function (obj, defaultCfg) {

    // @todo support instantiation without obj

    // Implement bindable behavior, adding custom methods for Ajax events
    obj = jQuery.bindable(obj, 'onLoadBeforeSend onLoadAbort onLoadSuccess onLoadError onLoadComplete');

    // Allow URL as config (shortcut)
    if (typeof defaultCfg === 'string') {
      defaultCfg = {
        url: defaultCfg
      };
    }

    jQuery.extend(obj, {
      
      /**
       * Merge runtime config with default config
       * Refactored out of load() for easier integration with everyone's
       * favorite sequential AJAX library...
       */
      loadableConfig: function (cfg) {

        var beforeSend, dataFilter, success, error, complete;

        // If one parameter is passed, it's either a config or a callback
        // @todo take (url, callback)
        if (typeof cfg === 'string') {
          cfg = {
            url: cfg
          };
        } else if (jQuery.isFunction(cfg)) {
          cfg = {
            success: cfg
          };
        }

        // Extend default config with runtime config
        cfg = jQuery.extend(true, {}, defaultCfg, cfg);

        // Cache configured callbacks so they can be called from wrapper
        // functions below.
        beforeSend = cfg.beforeSend;
        dataFilter = cfg.dataFilter;
        success    = cfg.success;
        error      = cfg.error;
        complete   = cfg.complete;

        // Overload each of the configured jQuery.ajax callback methods with an
        // evented wrapper function. Each wrapper function executes the
        // configured callback in the scope of the loadable object and then
        // fires the corresponding event, passing to it the return value of
        // the configured callback or the unmodified arguments if no callback
        // is supplied or the return value is undefined.
        return jQuery.extend(cfg, {

          /**
           * @param XMLHTTPRequest xhr
           * @param Object cfg
           */
          beforeSend: jQuery.proxy(function (xhr, cfg) {

            // If defined, execute the beforeSend callback and store its return
            // value for later return from this proxy function -- used for
            // aborting the XHR
            var ret = beforeSend && beforeSend.apply(this, arguments);

            // Trigger the onLoadBeforeSend event listeners
            this.trigger('onLoadBeforeSend', arguments);

            // If the request is explicitly aborted from the beforeSend
            // callback, trigger the onLoadAbort event listeners
            if (ret === false) {
              this.trigger('onLoadAbort', arguments);
            }

            return ret;

          }, this),


          // just added -- doc it up
          dataFilter: dataFilter && jQuery.proxy(function (response, type) {
            return dataFilter.apply(this, arguments);
          }, this),


          /**
           * @param Object data
           * @param String status
           * @param XMLHTTPRequest xhr
           */
          success: jQuery.proxy(function (data, status, xhr) {

            var ret;
            
            // If defined, execute the success callback
            if (success) {
              ret = success.apply(this, arguments);
            }

            // Trigger the onLoadSuccess event listeners
            this.trigger('onLoadSuccess',  arguments);

            return ret;
            
          }, this),

          /**
           * @param XMLHTTPRequest xhr
           * @param String status
           * @param Error e
           */
          error: jQuery.proxy(function (xhr, status, e) {

            var ret;
            
            // If defined, execute the error callback
            if (error) {
              ret = error.apply(this, arguments);
            }

            // Trigger the onLoadError event listeners
            this.trigger('onLoadError', arguments);

            return ret;
            
          }, this),

          /**
           * @param XMLHTTPRequest xhr
           * @param String status
           */
          complete: jQuery.proxy(function (xhr, status) {

            var ret;
            
            // If defined, execute the complete callback
            if (complete) {
              ret = complete.apply(this, arguments);
            }

            // Trigger the onLoadComplete event listeners
            this.trigger('onLoadComplete', arguments);

            return ret;
            
          }, this)
        });        
      },
      
      /**
       * Execute the XMLHTTPRequest
       * @param Object cfg Overload jQuery.ajax configuration object
       */
      load: function (cfg) {
        return jQuery.ajax(this.loadableConfig(cfg));
      }
      
    });

    return obj;
  };


  /**
   * jQuery.renderable
   *
   * @param Object obj Object to be augmented with renderable behavior
   * @param String tpl Template or URL to template file
   * @param Various elem (optional) Target DOM element
   */
  jQuery.renderable = function (obj, tpl, elem) {

    // Implement bindable behavior, adding custom methods for render events
    obj = jQuery.bindable(obj, 'onBeforeRender onRender');

    // Create a jQuery target to handle DOM load
    if (typeof elem !== 'undefined') {
      elem = jQuery(elem);
    }

    // Create renderer function from supplied template
    var renderer = jQuery.template(tpl);

    // Augment the object with a render method
    obj.render = function (data, raw) {

      this.trigger('onBeforeRender', [data]);

      // Force raw HTML if elem exists (saves effort)
      var ret = renderer(data, !!elem || raw);

      if (elem) {
        elem.html(ret);
      }

      this.trigger('onRender', [ret]);

      return ret;
    };

    return obj;
  };


  /**
   * jQuery.pollable
   * @todo add passing of anon function to start?
   * @param Object obj Object to be augmented with pollable behavior
   */
  jQuery.pollable = function (obj) {

    // Implement bindable behavior, adding custom methods for pollable events
    obj = jQuery.bindable(obj, 'onStart onExecute onStop');

    // Augment the object with an pollable methods
    jQuery.extend(obj, {

      /**
       * @param String method
       * @return Boolean
       */
      isExecuting: function (method) {
        var timers = jQuery(this).data('pollable.timers') || {};
        return method in timers;
      },

      /**
       * @param String method
       * @param Number interval
       * @param Boolean immediately
       */
      start: function (method, interval, data, immediately) {

        var self, timers;

        if (typeof data === 'boolean') {
          immediately = data;
          data = null;
        }

        data = data || [];

        if (!this.isExecuting(method) && jQuery.isFunction(this[method]) && interval > 0) {

          self   = jQuery(this);
          timers = self.data('pollable.timers') || {};

          // Store the proxy method as a property of the original method
          // for later removal
          this[method].proxy = jQuery.proxy(function () {
            this.trigger('onExecute', [method, this[method].apply(this, data)]);
          }, this);

          // Start timer and add to hash
          timers[method] = window.setInterval(this[method].proxy, interval);

          self.data('pollable.timers', timers);

          // Fire onStart event with method name
          this.trigger('onStart', [method]);

          if (immediately) {
            this[method].proxy();
          }
        }

        return this;
      },

      /**
       * @param String method
       */
      stop: function (method) {

        var self, timers;

        if (this.isExecuting(method)) {

          self   = jQuery(this);
          timers = self.data('pollable.timers') || {};

          // Clear timer
          window.clearInterval(timers[method]);

          // Remove timer from hash
          delete timers[method];

          // Remove proxy method from original method
          delete this[method].proxy;

          self.data('pollable.timers', timers);

          // Fire onStop event with method name
          this.trigger('onStop', [method]);
        }
        return this;
      }
    });

    return obj;
  };


  jQuery.now = function () {
    return (new Date()).getTime();
  };


  /**
   * jQuery.cacheable
   *
   * @param Object obj Object to be augmented with cacheable behavior
   */
  jQuery.cacheable = function (obj, defaultTtl) {
  
    // Allow use of prototype for shorthanding the augmentation of classes
    obj = obj.prototype || obj;
  
    // I love using Infinity
    defaultTtl = defaultTtl || Infinity;
  
    jQuery.extend(obj, {
  
      cacheSet: function(key, value, ttl) {
  
        var self    = jQuery(this),
            cache   = self.data('cacheable.cache') || {},
            expires = jQuery.now() + (typeof ttl !== 'undefined' ? ttl : defaultTtl);

        cache[key] = {
          value:   value,
          expires: expires
        };
  
        self.data('cacheable.cache', cache);
      },
  
      cacheGet: function(key) {
  
        var cache = jQuery(this).data('cacheable.cache') || {},
            data;
  
        if (key) {
  
          if (key in cache) {
  
            data = cache[key];
  
            if (data.expires < jQuery.now()) {
              this.cacheUnset(key);
            } else {
              return data.value;
            }
          }
  
        } else {
          return cache;
        }
      },
  
      cacheHas: function(key) {
        var cache = jQuery(this).data('cacheable.cache');
        return (key in cache);
      },
  
      cacheUnset: function(key) {
  
        var self  = jQuery(this),
            cache = self.data('cacheable.cache');
  
        if (cache && key in cache) {
  
          cache[key] = null;
          delete cache[key];
  
          self.data('cacheable.cache', cache);
        }
      },
  
      cacheEmpty: function() {
        jQuery(this).data('cacheable.cache', {});
      }
  
    });
  
    return obj;
  };


  /**
   * Singleton sugar!
   * Allows you to call prototypal methods statically from the constructor
   * on a global instance -- allowing for singleton AND classical use.
   */
  jQuery.singleton = function (constructor) {

    var instance;

    jQuery.each(constructor.prototype, function (key, val) {
      if ($.isFunction(val)) {
        constructor[key] = function () {          
          if (!instance) {
            instance = new constructor();
          }
          return val.apply(instance, arguments);
        };
      }
    });

    return constructor;
  };

})(this, this.document, this.jQuery);
