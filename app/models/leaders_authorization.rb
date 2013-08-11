class LeadersAuthorization < ActiveAdmin::AuthorizationAdapter
  # Possible actions: :read, :create, :update, :destroy,
  def authorized?(action, subject = nil)
    return true if user.super_admin?

    # Let everyone read and create
    return true if [:read, :create].include?(action)

    if subject.class == Community
      subject.coaches.include?(user)
    else
      false
    end
  end

  def scope_collection(collection)
    # Be liberal for now
    collection

    # return collection if user.super_admin?
    # if collection == Community
    #   collection.joins(:coaches).where(:coaches_join => {:admin_user_id => user.id})
    # else
    #   # Be liberal in displaying data
    #   collection
    # end
  end
end
