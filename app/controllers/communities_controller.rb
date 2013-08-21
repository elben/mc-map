class CommunitiesController < ApplicationController
  # params:
  #   limit - number of results per page, defaults to 50
  #   page - page of results to get, defaults to 1 (NOT zero-based)
  #   campus - blank, or enum value from Community::CAMPUSES
  #   host_day - blank, or enum value from Community::DAYS
  #   kinds - blank, or comma-seperated list of enum value from
  #           Community::MC_KINDS
  #   points_only - true if only minimal point data is to be returned
  def index
    # pull params from the params hash
    limit = (params[:limit] || 50).to_i
    page = (params[:page] || 1).to_i
    points_only = params[:points_only] == 'true'

    # normalize all filter values to lowercase
    filters = params.slice(:campus, :host_day)
    filters.each do |k, v|
      # Turn into array, split by comma, to do IN query.
      # e.g. where host_day IN ('monday', ...)
      filters[k] = v.downcase.split(",")
    end

    communities = Community.where(filters).with_kinds(params[:kinds]).page(page).per(limit)
    @response = communities.map do |community|
      response = nil

      # return only minimal point data if specified
      if points_only
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

        response = point
      else
        response = community.output_json
      end

    end

    respond_to do |format|
      format.json { render :json => @response }
    end
  end

  def signup_form
    @member = Member.new

    # get the community from the database by its slug
    @community = Community.where(slug: params[:community_id]).first

    # give up if that community doesn't exist
    if @community.blank?
      redirect_to '/404'
      return
    end

    # render the signup form if the community could be found
    respond_to do |format|
      format.html { render 'signup_form' }
    end
  end

  # render the HTML sign up form. this is shown in an iframe on the client.
  def signup
    # ensure we have a member present
    @member = Member.new

    if session.blank?
      # Either did not request with CSRF token or used an invalid CSRF token.
      # In these cases, Rails server resets (blanks out) session.
      respond_to do |format|
        format.html { render 'signup_form' }
      end
      return
    end

    @community = Community.where(slug: params[:community_id]).first

    # give up if no such community exists
    if @community.blank?
      @member.errors.add(:community, 'does not exist')

      respond_to do |format|
        format.html { render 'signup_form' }
      end
      return
    end

    # see whether the member already exists
    email = params[:member].try(:[], :email)
    @member = Member.where(email: email).first

    # create a new member if one didn't exist
    if @member.blank?
      @member = Member.new(params[:member])
      unless @member.save
        respond_to do |format|
          format.html { render 'signup_form' }
        end
        return
      end
    end

    # sign the member up for the given community
    @community.signup!(@member)
    respond_to do |format|
      format.html { render 'signup_success' }
    end
  end
end
