class CommunitiesController < ApplicationController
  # params:
  #   limit - number of results per page, defaults to 50
  #   page - page of results to get, defaults to 1 (NOT zero-based)
  #   campus - blank, or enum value from Community::CAMPUSES
  #   host_day - blank, or enum value from Community::DAYS
  #   kinds - blank, or comma-seperated list of enum value from
  #           Community::MC_KINDS
  def index
    # pull params from the params hash
    limit = (params[:limit] || 50).to_i
    page = (params[:page] || 1).to_i

    # normalize all filter values to lowercase
    filters = params.slice(:campus, :host_day, :host_kind)
    filters.each do |k, v|
      filters[k] = v.downcase
    end

    communities = Community.where(filters).with_kinds(params[:kinds]).page(page).per(limit)
    @response = communities.map { |c|  c.output_json }

    respond_to do |format|
      format.json { render :json => @response }
    end
  end

  # return all the points for all campuses in a minimal format
  def points
    @response = []
    Community.find_each do |community|
      point = {
        type: 'Feature',
        geometry: nil,

        # so the user can look up the full data later
        properties: {
          slug: community.slug,
          campus: community.campus,
        },
      }

      # add the coordinates if they're available
      if (community.lat && community.lng)
        point[:geometry] = {
          type: 'Point',
          coordinates: [community.lng.to_f, community.lat.to_f]
        }
      end

      @response << point
    end

    respond_to do |format|
      format.json { render :json => @response }
    end
  end
end
