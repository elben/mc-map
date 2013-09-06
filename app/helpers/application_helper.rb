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
end
