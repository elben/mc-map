$(function () {
  var communitiesView = new AdminViews.CommunitiesView({
    el: $("#communities"),
  });

  var CommunityView = Backbone.View.extend({
    events: {
      "click li[data-sheet] a": "handleSheetChange",
    },
    currentSheetName: null,
    initialize: function (options) {
      this.changeSheet("info"); // Defaults to Info sheet

      ///////////////////////
      // DataTable for members
      //

      var membersTable = this.$el.find("#community-members table").dataTable({
        // sDom and sPaginationType follows:
        // http://datatables.net/blog/Twitter_Bootstrap_2
        "sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>",
        "sPaginationType": "bootstrap", // Depends on dataTables_bootstrap_pagination.js
        "oLanguage": {
          "sLengthMenu": "Display _MENU_ records",
          "sInfo": "Showing _TOTAL_ _START_ to _END_ of _TOTAL_ members",
          "sInfoEmpty": "No members to show",
        },
        "bLengthChange": false, // Hide num rows dropdown
        // "bFilter": false, // Hide search bar since we're building our own
        "iDisplayLength": 50, // Display 50 rows at a time
        "aaSorting": [[ 0, "asc" ]], // Default to sort first column
        "aoColumns": [ {}, {}, {} ]
      });

      // Hide default datatables search bar so we can use our own nicer one.
      $("#community-members .dataTables_filter").hide();

      var self = this;
      $('#members-search').keyup(function () {
        membersTable.fnFilter($(this).val());
      });


      ///////////////////////
      // DataTable for coaches
      //

      var coachesTable = this.$el.find("#community-coaches table").dataTable({
        // sDom and sPaginationType follows:
        // http://datatables.net/blog/Twitter_Bootstrap_2
        "sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>",
        "sPaginationType": "bootstrap", // Depends on dataTables_bootstrap_pagination.js
        "oLanguage": {
          "sLengthMenu": "Display _MENU_ records",
          "sInfo": "Showing _TOTAL_ _START_ to _END_ of _TOTAL_ coaches",
          "sInfoEmpty": "No coaches to show",
        },
        "bLengthChange": false, // Hide num rows dropdown
        // "bFilter": false, // Hide search bar since we're building our own
        "iDisplayLength": 50, // Display 50 rows at a time
        "aaSorting": [[ 0, "asc" ]], // Default to sort first column
        "aoColumns": [ {}, {}, {}, {bSearchable: false, bSortable: false} ]
      });

      // Hide default datatables search bar so we can use our own nicer one.
      $("#community-coaches .dataTables_filter").hide();

      $('#coaches-search').keyup(function () {
        coachesTable.fnFilter($(this).val());
      });
    },
    handleSheetChange: function (e) {
      var toSheetName = $(e.target).parent().data("sheet");
      this.changeSheet(toSheetName);
    },
    changeSheet: function (toSheetName) {
      // Hide old sheet and unhighlight nav
      this.$el.find("a[data-sheet='" + this.currentSheetName + "']").parent().removeClass("active");
      this.$el.find(".sheet[data-sheet='" + this.currentSheetName + "']").hide()

      // Show new sheet and highlight nav
      this.$el.find("a[data-sheet='" + toSheetName + "']").parent().addClass("active");
      this.$el.find(".sheet[data-sheet='" + toSheetName + "']").show()

      this.currentSheetName = toSheetName;
    }
  });

  var communityView = new CommunityView({
    el: $("#community")
  });
});
