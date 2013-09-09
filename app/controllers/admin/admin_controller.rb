class Admin::AdminController < ApplicationController
  layout 'admin'

  before_filter :authenticate_admin_user!

  def index
    @communities = current_admin_user.communities
    @members_count = CommunitiesMembers.group(:community_id).where(:community_id => @communities).count
    @taggings_hash = {}
    taggings = ActsAsTaggableOn::Tagging.where(:taggable_id => @communities, :taggable_type => Community, :context => "kinds").includes(:tag)
    taggings.each do |tagging|
      @taggings_hash[tagging.taggable_id] ||= []
      @taggings_hash[tagging.taggable_id] << tagging.tag
    end
  end
end
