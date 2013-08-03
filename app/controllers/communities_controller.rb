class CommunitiesController < ApplicationController
  # params:
  #   limit - defaults to 50
  #   offset - defaults to 0
  #   campus - blank, or enum in Community::CAMPUSES
  #   host_day - blank, or enum in Community::DAYS
  #   host_kind - blank, or enum in Community::MC_KIND
  #   q - leader name full text search
  def index
    params[:limit] ||= 50
    params[:offset] ||= 0

    filters = params.slice(:campus, :host_day, :host_kind)

    @r = {data: []}
    communities = Community.with_leader_like(params[:q]).where(filters).limit(params[:limit]).offset(params[:offset]).all
    communities.each do |c|
      @r[:data] << c.output_json
    end

    @r[:paginate] = {offset: params[:offset] + [params[:limit], @r[:data].count].min}
    respond_to do |format|
      format.json { render :json => @r }
    end
  end
end
