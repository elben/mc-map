// This is a manifest file that'll be compiled into application.js, which will
// include all the files listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts,
// vendor/assets/javascripts, or vendor/assets/javascripts of plugins, if any,
// can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at
// the bottom of the the compiled file.
//
// WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY
// BLANK LINE SHOULD GO AFTER THE REQUIRES BELOW.
//
//= require_self
//= require_tree .

// track an event using Google Analytics
var trackEvent = function (category, action, label, value) {
  // always call this in a separate stack frame, to prevent errors from borking
  // the calling context, if there are any.
  var args = Array.prototype.slice.call(arguments);
  setTimeout(function () {
    // log tracking events to the console when running locally
    if (window.location.href.match(/localhost/) && window.console) {
      window.console.log('trackEvent', args);
    } else {
      // otherwise, send them for real
      ga('send', 'event', category, action, label, value);
    }
  }, 0);
};
