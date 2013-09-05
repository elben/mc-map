ActiveAdmin.register Community do
  config.sort_order = "id_asc"
  config.per_page = 100

  show :title => :title # Use Communtiy#title

  index do
    members_count = CommunitiesMembers.group(:community_id).where(:community_id => communities).count

    taggings_hash = {}
    taggings = ActsAsTaggableOn::Tagging.where(:taggable_id => communities, :taggable_type => Community, :context => "kinds").includes(:tag)
    taggings.each do |tagging|
      taggings_hash[tagging.taggable_id] ||= []
      taggings_hash[tagging.taggable_id] << tagging.tag
    end

    selectable_column
    default_actions
    column :leader, sortable: :leader_last_name
    column :campus_name, sortable: :campus
    column "Day", :sortable => :host_day do |c|
      c.host_day.titleize
    end
    column "Kinds" do |c|
      taggings_hash[c.id].join(", ") if taggings_hash[c.id]
    end
    column "E-mail", sortable: :email do |c|
      link_to(c.email, "mailto:#{c.email}", target: "_blank")
    end
    column "Members" do |c|
      members_count[c.id].to_i
    end
    column "Hidden", sortable: :hidden do |c|
      if c.hidden?
        "yes"
      end
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
      f.input :kinds, as: :check_boxes, collection: Community.kind_tags

      f.input :email, label: "E-mail"
      f.input :phone_number
      f.input :address_line_1
      f.input :address_line_2
      f.input :address_city
      f.input :address_province
      f.input :address_postal
      f.input :description
      f.input :hidden, as: :radio
    end

    f.actions
  end

  filter :campus, as: :check_boxes, collection: Community::CAMPUSES.keys
  filter :host_day, as: :check_boxes, collection: Community::DAYS

  # Use meta_search's OR syntax
  filter :leader_last_name_or_leader_first_name_or_coleader_first_name_or_coleader_last_name_or_address_line_1_or_address_line_2_or_address_city_or_address_postal_or_address_province_or_email_or_phone_number, as: :string, label: "Leader or Contact Info"

  show do |c|
    attributes_table do
      row :leader
      row :campus_name
      row :email
      row :phone_number
      row :address do
        link_to(c.address, "https://www.google.com/maps?q=#{c.address}", target: "_blank")
      end
      row :host_day
      row :kinds do |community|
        community.kind_list.map { |kind| Community::MC_KINDS[kind.to_sym] }.join(", ")
      end
      table_for c.members do
        column "Name" do |member|
          link_to(member.name, admin_member_path(member))
        end
        column :email
        column :phone_number
      end
      row :hidden
      row :coach do |community|
        if community.coaches.include?(current_admin_user)
          link_to("remove me as a coach", remove_coach_admin_community_path(community), method: :post)
        else
          link_to("add me as a coach", add_coach_admin_community_path(community), method: :post)
        end
      end
    end
    active_admin_comments
  end

  controller do
    def create
      if params["community"].try(:[], "kind_ids")
        tags = []
        kind_ids = params["community"].delete("kind_ids")
        kind_ids.each do |kind_id|
          next if kind_id.blank?
          tag = ActsAsTaggableOn::Tag.find(kind_id)
          if tag
            tags << tag
          end
        end
        params["community"]["kind_list"] = tags.map(&:name).join(", ")
      end

      create! do |format|
        format.html { redirect_to admin_communities_url }
      end
    end

    def update
      # Deal with the madness of ActiveAdmin's insistence on setting kind_ids.
      @community = Community.find(params[:id])
      kind_ids = params["community"].delete("kind_ids")
      kind_ids.reject! { |kid| kid.blank? }
      tags = ActsAsTaggableOn::Tag.find(kind_ids)
      @community.kind_list = tags.map(&:name)
      @community.update_attributes(params["community"])
      respond_to do |format|
        format.html { redirect_to admin_communities_url }
      end
    end
  end

  member_action :add_coach, :method => :post do
    community = Community.find(params[:id])
    if community && !community.coaches.include?(current_admin_user)
      community.coaches << current_admin_user
      redirect_to :back
    end
  end

  member_action :remove_coach, :method => :post do
    community = Community.find(params[:id])
    if community && community.coaches.include?(current_admin_user)
      community.coaches.delete(current_admin_user)
      redirect_to :back
    end
  end
end
