class CommunitiesController < ApplicationController
  # params:
  #   limit - defaults to 50
  #   offset - defaults to 0
  #   campus - blank, or enum in Community::CAMPUSES
  #   host_day - blank, or enum in Community::DAYS
  #   host_kind - blank, or enum in Community::MC_KINDS
  #   q - leader name full text search
  def index
    # pull params from the params hash
    limit = (params[:limit] || 50).to_i
    offset = (params[:offset] || 0).to_i
    query = params[:q]

    # normalize all filter values to lowercase
    filters = params.slice(:campus, :host_day, :host_kind)
    filters.each do |k, v|
      filters[k] = v.downcase
    end

    # get all the communities
    communities = Community
        .with_leader_like(query)
        .where(filters)
        .limit(limit)
        .offset(offset)
        .all

    @response = {}
    @response[:communites] = communities.map { |c|  c.output_json }

    @response[:paginate] = {}
    count = Community.with_leader_like(query).where(filters).count
    if count > communities.count + offset
      # there's more data to get
      @response[:paginate][:offset] = offset + [limit, communities.count].min
    end

    respond_to do |format|
      format.json { render :json => @response }
    end
  end

  # return all the points for all campuses in a minimal format
  def points
    @response = {community_points: []}
    Community.find_each do |community|
      @response[:community_points] << {
        # so the user can look up the full data later
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
