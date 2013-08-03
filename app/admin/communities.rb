ActiveAdmin.register Community do
  controller do
    def resource
      Community.where(slug: params[:id]).first!
    end
  end
end
