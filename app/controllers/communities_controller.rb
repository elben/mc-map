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

    params[:limit] = params[:limit].to_i
    params[:offset] = params[:offset].to_i

    filters = params.slice(:campus, :host_day, :host_kind)
    filters.each do |k, v|
      filters[k] = v.downcase
    end

    @r = {data: []}
    communities = Community.with_leader_like(params[:q]).where(filters).limit(params[:limit]).offset(params[:offset]).all
    communities.each do |c|
      @r[:data] << c.output_json
    end

    @r[:paginate] = {}
    count = Community.with_leader_like(params[:q]).where(filters).count
    if count > @r[:data].count + params[:offset]
      # There's more data to get
      @r[:paginate][:offset] = params[:offset] + [params[:limit], @r[:data].count].min
    end

    respond_to do |format|
      format.json { render :json => @r }
    end
  end

  # return all the points for all campuses in a minimal formal
  def points
    @response = {data: []}
    Community.find_each do |community|
      @response[:data] << {
        # to look up the full data later
        slug: community.slug,

        # for the point location/color
        lat: community.lat.to_f,
        lng: community.lng.to_f,
        campus: community.campus
      }
    end

    respond_to do |format|
      format.json { render :json => @response }
    end
  end
end
