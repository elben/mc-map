ActiveAdmin.register Community do
  config.sort_order = "id_asc"
  config.per_page = 100

  show :title => :title # Use Communtiy#title

  index do
    selectable_column
    default_actions
    column :leader, sortable: :leader_last_name
    column "Co-leader", :coleader, sortable: :coleader_last_name
    column :campus_name, sortable: :campus
    column "Day", :sortable => :host_day do |c|
      c.host_day.titleize
    end
    column "Kind", sortable: :host_kind do |c|
      c.kind
    end
    column "E-mail", sortable: :email do |c|
      link_to(c.email, "mailto:#{c.email}", target: "_blank")
    end
    column "Address" do |c|
      link_to(c.address, "https://www.google.com/maps?q=#{c.address}", target: "_blank")
    end
  end

  form do |f|
    f.inputs do
      f.input :leader_first_name
      f.input :leader_last_name
      f.input :coleader_first_name
      f.input :coleader_last_name
      f.input :campus, as: :select, collection: Community::CAMPUSES.map { |k, v| [v, k] }
      f.input :host_day, label: "Day", as: :select, collection: Community::DAYS.map { |d| [d.titleize, d] }
      f.input :host_kind, label: "Kind", as: :select, collection: Community::MC_KIND.map { |k, v| [v, k] }
      f.input :email, label: "E-mail"
      f.input :phone_number
      f.input :address_line_1
      f.input :address_line_2
      f.input :address_city
      f.input :address_province
      f.input :address_postal
      f.input :description
    end

    f.actions
  end

  filter :campus, as: :check_boxes, collection: Community::CAMPUSES.keys
  # filter :host_day, as: :check_boxes, collection: Community::DAYS, label: "Day"

  # Use meta_search's OR syntax
  filter :leader_last_name_or_leader_first_name_or_coleader_first_name_or_coleader_last_name_or_address_line_1_or_address_line_2_or_address_city_or_address_postal_or_address_province_or_email_or_phone_number, as: :string, label: "Leader or Contact Info"

  controller do
    def create
      create! do |format|
        format.html { redirect_to admin_communities_url }
      end
    end

    def update
      update! do |format|
        format.html { redirect_to admin_communities_url }
      end
    end
  end
end
