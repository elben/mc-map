class ApplicationController < ActionController::Base
  protect_from_forgery

  def admin_login_required
    return if current_admin_user
    redirect_to admin_root_path
  end
end
