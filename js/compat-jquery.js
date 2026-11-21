
    // Compatibilité jQuery 4.x pour les anciens plugins (fancybox, imagesloaded)
    if (window.jQuery) {
      if (!jQuery.isFunction) jQuery.isFunction = function (o) { return typeof o === 'function'; };
      if (!jQuery.isArray) jQuery.isArray = Array.isArray;
      if (!jQuery.trim) jQuery.trim = function (s) { return s == null ? '' : String.prototype.trim.call(s); };
    }
  