class LeadersAuthorization < ActiveAdmin::AuthorizationAdapter
  # Possible actions: :read, :create, :update, :destroy,
  def authorized?(action, subject = nil)
    return true if user.super_admin?

    # Only super admins can destroy; for all models
    return false if action == :destroy && !user.super_admin?

    # Let everyone read and create
    return true if [:read, :create].include?(action)

    if subject.class == Community
      # Is current user a coach of this community?
      subject.coaches.include?(user)
    else
      false
    end
  end

  def scope_collection(collection)
    # Be liberal for now due to scope_collection problems.
    collection

    # return collection if user.super_admin?
    # if collection == Community
    #   # TODO problem here is that this prevents a coach from looking at show
    #   page of communtiy they don't own. I want them to be able to see
    #   everything, just hide in index page.
    #   collection.joins(:coaches).where(:coaches_join => {:admin_user_id => user.id})
    # else
    #   # Be liberal in displaying data
    #   collection
    # end
  end
end
