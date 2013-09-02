class Admin2::CommunitiesController < Admin2::Admin2Controller
  def index
    @communities = Community.all
  end

  def show
    @community = Community.find(params[:id])
  end
end
