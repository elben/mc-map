class Admin2::Admin2Controller < ApplicationController
  layout 'admin2'

  before_filter :admin_login_required

  def index
  end
end
