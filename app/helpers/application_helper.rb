module ApplicationHelper
  # Public: Converts Rails flash name to Bootstrap class.
  #
  # flash_name - Rails flash name. Use "flash", "notice" or "alert".
  #
  # Returns CSS class name.
  def bootstrap_alert_class(flash_name)
    case flash_name.to_s
    when "flash"
      return "alert-info"
    when "notice"
      return "alert-success"
    when "alert"
      return "alert-error"
    end
  end

  def error_classes_for_attributes(*attributes)
    if @error_keys && !(@error_keys.to_set & attributes.to_set).blank?
      "error"
    end
  end
end
