class CommunitiesController < ApplicationController
  # params:
  #   limit
  #   offset
  #   campus
  #   host_day
  #   host_kind
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
