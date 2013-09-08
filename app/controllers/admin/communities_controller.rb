class Admin::CommunitiesController < Admin::AdminController
  before_filter :prepare_kind_list, only: [:update, :create]
  before_filter :find_community, only: [:show, :edit, :update]

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
  end

  def new
    @community = Community.new
  end

  def edit
  end

  def update
    if params[:community]["kind_list"].nil?
      # No kinds were given, so no checkbox values were sent. Add a blank list
      # so Community validations will work.
      params[:community]["kind_list"] = []
    end

    respond_to do |format|
      if @community.update_attributes(params[:community])
        format.html { redirect_to admin_community_path(@community), notice: "Community was successfully updated." }
        format.json { head :no_content }
      else
        flash[:alert] = "Please fix the errors below."
        @error_keys = @community.errors.keys
        format.html { render action: "edit" }
        format.json { render json: @community.errors, status: :unprocessable_entity }
      end
    end
  end

  def create
    if params[:community]["kind_list"].nil?
      # No kinds were given, so no checkbox values were sent. Add a blank list
      # so Community validations will work.
      params[:community]["kind_list"] = []
    end

    respond_to do |format|
      @community = Community.create(params[:community])

      if @community.valid?
        format.html { redirect_to admin_community_path(@community), notice: "Community was successfully created." }
        format.json { head :no_content }
      else
        flash[:alert] = "Please fix the errors below."
        @error_keys = @community.errors.keys
        format.html { render action: "new" }
        format.json { render json: @community.errors, status: :unprocessable_entity }
      end
    end
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

  private

  def prepare_kind_list
    if params[:community]["kind_list"].nil?
      # No kinds were given, so no checkbox values were sent. Add a blank list
      # so Community validations will work.
      params[:community]["kind_list"] = []
    end
  end

  def find_community
    @community = Community.find(params[:id])
  end
end
