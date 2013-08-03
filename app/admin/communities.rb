ActiveAdmin.register Community do
  show :title => :admin_title
  controller do
    def resource
      Community.where(slug: params[:id]).first!
    end
  end
end
