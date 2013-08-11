ActiveAdmin.register_page "Dashboard" do

  menu :priority => 1, :label => proc{ I18n.t("active_admin.dashboard") }

  content :title => proc{ I18n.t("active_admin.dashboard") } do

    columns do
      column do
        panel "My communities" do
          table_for current_admin_user.communities do
            column "Name" do |c|
              link_to(c.title, admin_community_path(c))
            end
            column :campus_name, sortable: :campus
            column "Day", :sortable => :host_day do |c|
              c.host_day.titleize
            end
            column "E-mail", sortable: :email do |c|
              link_to(c.email, "mailto:#{c.email}", target: "_blank")
            end
          end
        end
      end
    end

    # Here is an example of a simple dashboard with columns and panels.
    #
    # columns do
    #   column do
    #     panel "Recent Posts" do
    #       ul do
    #         Community.first(5).map do |post|
    #           post.title
    #         end
    #       end
    #     end
    #   end

    #   column do
    #     panel "Info" do
    #       para "Welcome to ActiveAdmin."
    #     end
    #   end
    # end
  end # content
end
