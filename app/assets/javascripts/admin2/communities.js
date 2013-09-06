$(function () {
  var communitiesView = new AdminViews.CommunitiesView({
    el: $("#communities"),
  });

  var CommunityView = Backbone.View.extend({
    events: {
      "click li[data-sheet] a": "handleSheetChange",
    },
    sheets: null, // Name of sheets
    currentSheetName: null,
    initialize: function (options) {
      this.sheets = $("li [data-sheet]").map(function (idx, li) { return $(li).data("sheet"); });

      this.changeSheet("info"); // Defaults to Info sheet
    },
    handleSheetChange: function (e) {
      var toSheetName = $(e.target).parent().data("sheet");
      this.changeSheet(toSheetName);
    },
    changeSheet: function (toSheetName) {
      this.$el.find("a[data-sheet='" + this.currentSheetName + "']").parent().removeClass("active");
      this.$el.find(".sheet[data-sheet='" + this.currentSheetName + "']").hide()

      this.$el.find("a[data-sheet='" + toSheetName + "']").parent().addClass("active");
      this.$el.find(".sheet[data-sheet='" + toSheetName + "']").show()

      this.currentSheetName = toSheetName;
    }
  });

  var communityView = new CommunityView({
    el: $("#community")
  });
});
