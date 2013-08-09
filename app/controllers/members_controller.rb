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
    ap params[:community_id]
    ap Community.where(id: params[:community_id]).first
    @community = Community.where(id: params[:community_id]).first

    if @community.blank?
      flash[:notice] = "Missional community not specified. #{params[:community_id]}"
      redirect_to :back
      return
    end

    @member = Member.new(params[:member])
    if @member.save
      flash[:notice] = "Successfully created member."
      MemberSignUpMailer.welcome_email(@member, @community).deliver
      redirect_to @member
    else
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
