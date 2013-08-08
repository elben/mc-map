ActiveAdmin.register Member do
  index do
    selectable_column
    default_actions
    column :name
    column :email
    column :phone_number
    column :communities do |member|
      table_for member.communities do
        column do |community|
          link_to(community.title, admin_community_path(community)).html_safe
        end
      end
    end
  end
end
