class Admin2::CommunitiesController < Admin2::Admin2Controller
  def index
    @communities = Community.all

    @members_count = CommunitiesMembers.group(:community_id).where(:community_id => @communities).count
    @taggings_hash = {}
    taggings = ActsAsTaggableOn::Tagging.where(:taggable_id => @communities, :taggable_type => Community, :context => "kinds").includes(:tag)
    taggings.each do |tagging|
      @taggings_hash[tagging.taggable_id] ||= []
      @taggings_hash[tagging.taggable_id] << tagging.tag
    end
  end

  def show
    @community = Community.find(params[:id])
  end

  def add_coach
    @community = Community.find(params[:id])
    admin_user = AdminUser.find(params[:admin_user_id])
    @community.coaches << admin_user
    redirect_to :back
  end

  def remove_coach
    @community = Community.find(params[:id])
    admin_user = AdminUser.find(params[:admin_user_id])
    @community.coaches.destroy(admin_user)
    redirect_to :back
  end
end
