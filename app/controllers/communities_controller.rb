class CommunitiesController < ApplicationController
  # params:
  #   limit
  #   offset
  def index
    params[:limit] ||= 50
    params[:offset] ||= 0
    @r = {data: [], params: params.slice(:limit, :offset)}
    communities = Community.limit(params[:limit]).offset(params[:offset]).all
    communities.each do |c|
      @r[:data] << c.output_json
    end
    respond_to do |format|
      format.json { render :json => @r }
    end
  end
end
