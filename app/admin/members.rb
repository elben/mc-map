ActiveAdmin.register Member do
  index do
    communities_hash = {}
    communities_members = CommunitiesMembers.where(:member_id => members).includes(:community)
    communities_members.each do |cm|
      communities_hash[cm.member_id] ||= []
      communities_hash[cm.member_id] << cm.community
    end

    selectable_column
    default_actions
    column :name
    column :email
    column :phone_number
    column :communities do |member|
      if communities_hash[member.id]
        table_for communities_hash[member.id] do
          column do |community|
            link_to(community.title, admin_community_path(community)).html_safe
          end
        end
      end
    end
  end
end
