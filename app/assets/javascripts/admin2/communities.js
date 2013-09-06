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
