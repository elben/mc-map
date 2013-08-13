class MembersController < ApplicationController
  def index
    @members = Member.all
  end

  def show
    @member = Member.find(params[:id])
  end

  def new
    @member = Member.new
  end

  def create
    @community = Community.where(id: params[:community_id]).first

    if @community.blank?
      flash[:notice] = "Missional community not specified. #{params[:community_id]}"
      redirect_to :back
      return
    end

    email = params[:member].try(:[], :email)
    @member = Member.where(email: email).first

    if @member.blank?
      @member = Member.new(params[:member])
      if @member.save
        flash[:notice] = "Successfully created member."
      end
    end

    members = @community.members << @member
    if !members.blank?
      # Sign up worked
      flash[:notice] = (flash[:notice] || "") + " Successfully added to community."
      MemberSignUpMailer.welcome_email(@member, @community).deliver
      MemberSignUpMailer.leaders_email(@member, @community).deliver
      redirect_to @member
    else
      flash[:notice] = (flash[:notice] || "") + " Could not add to community."
      render :action => 'new'
    end
  end

  def edit
    @member = Member.find(params[:id])
  end

  def update
    @member = Member.find(params[:id])
    if @member.update_attributes(params[:member])
      flash[:notice] = "Successfully updated member."
      redirect_to @member
    else
      render :action => 'edit'
    end
  end

  def destroy
    @member = Member.find(params[:id])
    @member.destroy
    flash[:notice] = "Successfully destroyed member."
    redirect_to members_url
  end
end
