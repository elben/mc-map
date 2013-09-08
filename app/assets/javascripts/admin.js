//= require jquery
//= require jquery_ujs
//= require bootstrap-alert
//= require underscore
//= require backbone
//= require jquery.dataTables.min
//= require dataTables_bootstrap_paging

var AdminViews = {};

// Prepares a DataTable, given a table container. Assumes certain look, feel and
// behavior consistent across our admin.
//
// $tableContainer   - A container that contains table element, and optionally:
//                     A .search-query input - To be used to as the search box.
//                     A .dataTables_filter - The defualt search; to be hidden.
// collectionName    - Noun used for pagination, etc. e.g. "communities"
// dataTablesOptions - Passed into datatables as options.
//
// Returns a DataTable.
var createDataTable = function ($tableContainer, collectionName, dataTablesOptions) {
  var defaults = {
    // sDom and sPaginationType follows:
    // http://datatables.net/blog/Twitter_Bootstrap_2
    "sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>",
    "sPaginationType": "bootstrap", // Depends on dataTables_bootstrap_pagination.js
    "oLanguage": {
      "sInfo": "Showing _START_ to _END_ of _TOTAL_ " + collectionName,
      "sInfoEmpty": "No " + collectionName + " to show",
    },
    "bLengthChange": false, // Hide num rows dropdown
    "iDisplayLength": 50, // Display 50 rows at a time
    "aaSorting": [[ 1, "asc" ]] // Default to sort first column
  }

  var options = $.extend(defaults, dataTablesOptions);

  var $table = $tableContainer.find("table").dataTable(options);

  // Hide default datatables search bar so we can use our own nicer one.
  $tableContainer.find(".dataTables_filter").hide();

  $tableContainer.find(".search-query").keyup(function () {
    $table.fnFilter($(this).val());
  });

  return $table;
};

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

      createDataTable($("#communities"), "communities", {
        "aaSorting": [[ 1, "asc" ]], // Default to sort first column
        "aoColumns": [ {bSortable: false, bSearchable: false}, {}, {}, {}, {}, {}, {bSearchable: false}, {} ]
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
