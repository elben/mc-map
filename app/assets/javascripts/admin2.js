//= require jquery
//= require bootstrap-alert
//= require underscore
//= require backbone
//= require jquery.dataTables.min
//= require dataTables_bootstrap_paging

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
    table: null,

    initialize: function (options) {
      this.navBarView = buildNavBarView("communities");
      this.table = $("table.communities");
      this.table.dataTable({
        // sDom and sPaginationType follows:
        // http://datatables.net/blog/Twitter_Bootstrap_2
        "sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>",
        "sPaginationType": "bootstrap", // Depends on dataTables_bootstrap_pagination.js
        "oLanguage": {
          "sLengthMenu": "Display _MENU_ records",
          "sInfo": "Showing _TOTAL_ _START_ to _END_ of _TOTAL_ communities",
          "sInfoEmpty": "No communities to show",
        },
        "bLengthChange": false, // Hide num rows dropdown
        // "bFilter": false, // Hide search bar since we're building our own
        "iDisplayLength": 50, // Display 50 rows at a time
        "aaSorting": [[ 1, "asc" ]], // Default to sort first column
        "aoColumns": [ {bSortable: false, bSearchable: false}, {}, {}, {}, {}, {}, {bSearchable: false} ]
      });

      // Hide default datatables search bar so we can use our own nicer one.
      $("#DataTables_Table_0_filter").hide();

      var self = this;
      $('#communities-search').keyup(function () {
        self.table.fnFilter($(this).val());
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
