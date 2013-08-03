class HomeController < ApplicationController
  def show
    redirect_to admin_root_path
  end
end

