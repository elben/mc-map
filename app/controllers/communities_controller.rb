class CommunitiesController < ApplicationController
  def index
    respond_to do |format|
      format.json { render :json => @asdf }
    end
  end
end
