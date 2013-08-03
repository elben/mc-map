class CommunitiesController < ApplicationController
  # params:
  #   limit
  #   offset
  def index
    @r = {data: []}
    communities = Community.limit(params[:limit] || 50).offset(params[:offset] || 0).all
    communities.each do |c|
      @r[:data] << c.output_json
    end
    respond_to do |format|
      format.json { render :json => @r }
    end
  end
end
