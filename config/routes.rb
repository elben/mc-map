McMap::Application.routes.draw do
  resources :members


  root :to => 'home#show'

  devise_for :admin_users, ActiveAdmin::Devise.config
  ActiveAdmin.routes(self)

  match "/map" => "map#index"

  resources :communities do
    collection do
      get "points"
    end
  end
end
