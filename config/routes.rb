McMap::Application.routes.draw do
  root :to => 'map#show'

  resources :members do
  end

  resources :communities do
    collection do
      get "points"
    end
  end

  match "signup", to: "communities#signup_form", via: :get
  match "signup", to: "communities#signup", via: :post

  devise_for :admin_users, ActiveAdmin::Devise.config
  ActiveAdmin.routes(self)

  match "/map" => "map#index"
end
