class Admin2::Admin2Controller < ApplicationController
  layout 'admin2'

  before_filter :authenticate_admin_user!

  def index
  end
end
