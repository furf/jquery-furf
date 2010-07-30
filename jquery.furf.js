/**
 * $.furf extensions to jQuery
 */
(function (window, document, $) {

  /**
   * proxy function lifted from jQuery 1.4 for backward compatibility 
   */
  $.proxy = $.proxy || function( fn, proxy, thisObject ) {
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
   * proxy function for event callbacks - omits event argument for better
   * compatibility with external APIs
   */
  $.eventProxy = function (fn, proxy, thisObject) {
    fn = $.proxy.apply(this, arguments);
    return function () {
      return fn.apply(this, Array.prototype.slice.call(arguments, 1));
    };
  };

  /**
   * Converts an array to a whitespace-delimited string
   * @param Array arr
   */
  $.white = function (arr) {
    return arr.join(' ');
  };
  
  /**
   * Converts a whitespace-delimited string to an array
   * @param String str
   */
  $.unwhite = function (str) {
    str = $.trim(str);
    return str.length ? str.split(/\s+/) : [];
  };

  /**
   * Adds or creates an abstract interface to an object literal or prototype
   * @param Object obj
   * @param String methods
   */
  $.specify = function (obj, methods) {

    obj = $.isFunction(obj) ? z : obj;
    
    $.each($.unwhite(methods), function (i, name) {
      if (!$.isFunction(obj[name])) {
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
  $.support.nativeEnum = (function () {
  
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

  $.IENativeEnumFix = function (target, source) {
    $.each(['toString', 'valueOf'], function (i, name) {
      var fn = source[name];
      if ($.isFunction(fn) && fn !== Object.prototype[name]) {
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
  $.inherit = function (child, parent, overrides) {

    if (!$.isFunction(parent) || !$.isFunction(child)) {
      throw new Error('$.inherit failed, please check that all dependencies are included.');
    }

    var name;

    function F () {
      this._parent_ = parent.prototype;
    }
    
    F.prototype = parent.prototype;
    
    child.prototype = new F ();
    child.prototype.constructor = child;
    child._parent_ = parent.prototype;
    
    if (parent.prototype.constructor === Object.prototype.constructor) {
      parent.prototype.constructor = parent;
    }
    
    if (overrides) {
      for (name in overrides) {
        if (overrides.hasOwnProperty(name)) {
          child.prototype[name] = overrides[name];
        }
      }

      if (!$.support.nativeEnum) {
        $.IENativeEnumFix(child.prototype, overrides);
      }
    }
  };

  /**
   * Add jQuery custom events to any object
   * @param Object obj
   * @param String types
   */
  $.bindable = function (obj, types) {

    /**
     * Allow use of prototype for shorthanding the augmentation of classes
     */
    obj = $.isFunction(obj) ? obj.prototype : obj;

    /**
     * Augment the object with jQuery's bind, one, and unbind event methods
     */
    $(['bind', 'one', 'unbind']).each(function (i, method) {
      obj[method] = function (type, data, fn, thisObject) {
        $(this)[method](type, data, fn, thisObject);
        return this;
      };
    });

    /**
     * The trigger event must be augmented separately because it requires a new
     * Event to prevent unexpected triggering of a method (and possibly
     * infinite recursion) when the event type matches the method name
     */ 
    obj.trigger = function (type, data) {
      var event = new $.Event(type);
      event.preventDefault();
      $(this).trigger(event, data);
      return this;
    };

    /**
     * Create convenience methods for event subscription which bind callbacks
     * to specified events
     */
    if (typeof types === 'string') {
      $.each($.unwhite(types), function (i, type) {
        obj[type] = function (data, fn, thisObject) {
          return arguments.length ? this.bind(type, data, fn, thisObject) : this.trigger(type);
        };
      });
    }

    return obj;
  };
  
  /**
   * $.loadable
   *
   * @param Object obj Object to be augmented with bindable behavior
   * @param Object defaultCfg Default $.ajax configuration object
   */
  $.loadable = function (obj, defaultCfg) {

    // Implement bindable behavior, adding custom methods for Ajax events
    obj = $.bindable(obj, 'onLoadBeforeSend onLoadAbort onLoadSuccess onLoadError onLoadComplete');

    // Allow URL as config (shortcut)
    if (typeof defaultCfg === 'string') {
      defaultCfg = {
        url: defaultCfg
      };
    }

    /**
     * Execute the XMLHTTPRequest
     * @param Object cfg Overload $.ajax configuration object
     */
    obj.load = function (cfg) {   

      var beforeSend, success, error, complete;

      // Allow URL as config (shortcut)
      if (typeof cfg === 'string') {
        cfg = {
          url: cfg
        };
      }
      
      // Extend default config with runtime config
      cfg = $.extend(true, {}, defaultCfg, cfg);
      
      // Cache configured callbacks so they can be called from wrapper
      // functions below.
      beforeSend = cfg.beforeSend;
      success    = cfg.success;
      error      = cfg.error;
      complete   = cfg.complete;

      // Overload each of the configured $.ajax callback methods with an
      // evented wrapper function. Each wrapper function executes the
      // configured callback in the scope of the loadable object and then
      // fires the corresponding event, passing to it the return value of
      // the configured callback or the unmodified arguments if no callback
      // is supplied or the return value is undefined.
      $.extend(cfg, {
        
        /**
         * @param XMLHTTPRequest xhr
         * @param Object cfg
         */
        beforeSend: $.proxy(function (xhr, cfg) {

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

        /**
         * @param Object data
         * @param String status
         * @param XMLHTTPRequest xhr
         */
        success: $.proxy(function (data, status, xhr) {

          var ret;

          // If defined, execute the success callback
          if (success) {

            // Any value explicitly returned from the success callback will 
            // supercede the original Ajax response
            ret = success.apply(this, arguments);

            // ...but only if the value is explicitly returned
            if (typeof ret !== 'undefined') {

              // Setting the value of a function parameter will automatically
              // update the corresponding member of the arguments "array"
              data = ret;
            }
          }
          
          // Trigger the onLoadSuccess event listeners
          this.trigger('onLoadSuccess',  arguments);
          
        }, this),
        
        /**
         * @param XMLHTTPRequest xhr
         * @param String status
         * @param Error e
         */
        error: $.proxy(function (xhr, status, e) {
          
          // If defined, execute the error callback
          error && error.apply(this, arguments);

          // Trigger the onLoadError event listeners
          this.trigger('onLoadError', arguments);

        }, this),
        
        /**
         * @param XMLHTTPRequest xhr
         * @param String status
         */
        complete: $.proxy(function (xhr, status) {

          // If defined, execute the complete callback
          complete && complete.apply(this, arguments);

          // Trigger the onLoadComplete event listeners
          this.trigger('onLoadComplete', arguments);
          
        }, this)
      });

      return $.ajax(cfg);        
    };

    return obj;
  };

})(this, this.document, this.jQuery);
