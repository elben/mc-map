//= require jquery
//= require bootstrap-alert
//= require underscore
//= require backbone
//= require jquery.dataTables.min

var AdminViews = {};

$(function () {
  // Initialize datatables for Bootstrap
  // http://datatables.net/blog/Twitter_Bootstrap_2
  $.extend($.fn.dataTableExt.oStdClasses, {
    "sWrapper": "dataTables_wrapper form-inline"
  });

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
      $("table.communities").dataTable({
        "sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>"
      });
    }
  });

  AdminViews.DashboardView = Backbone.View.extend({
    navBarView: null,

    initialize: function (options) {
      this.navBarView = buildNavBarView("dashboard");
    }
  });
})
