McMap::Application.routes.draw do
  root :to => 'home#show'

  devise_for :admin_users, ActiveAdmin::Devise.config
  ActiveAdmin.routes(self)

  match "/map" => "map#index"
end
