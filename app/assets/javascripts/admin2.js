//= require jquery
//= require bootstrap-alert
//= require underscore
//= require backbone

var AdminViews = {};

$(function () {
  AdminViews.NavBarView = Backbone.View.extend({
    events: {
    },

    initialize: function (options) {
      var defaults = {};
      this.options = $.extend(defaults, options);

      this.selected = options.selected || "dashboard";
    },
    render: function () {
      // Highlight selected nav. Assumes others were unselected.
      this.$el.find("li[data-name='" + this.selected + "']").addClass("active");
      return this;
    }
  });

  var buildNavBarView = function (selected) {
    return new AdminViews.NavBarView({
      el: $("#navbar"),
      selected: selected
    }).render();
  };

  AdminViews.CommunitiesView = Backbone.View.extend({
    navBarView: null,

    initialize: function (options) {
      this.navBarView = buildNavBarView("communities");
    }
  });

  AdminViews.DashboardView = Backbone.View.extend({
    navBarView: null,

    initialize: function (options) {
      this.navBarView = buildNavBarView("dashboard");
    }
  });
})
