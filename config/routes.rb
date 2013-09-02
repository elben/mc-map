McMap::Application.routes.draw do
  root :to => 'map#index'

  namespace :admin2 do
    root controller: :admin2, action: :index
    resources :communities do
      member do
        post "add_coach"
        post "remove_coach"
      end
    end
  end

  resources :communities do
    collection do
      get "query"
    end
  end

  match "signup", to: "communities#signup_form", via: :get
  match "signup", to: "communities#signup", via: :post

  devise_for :admin_users, ActiveAdmin::Devise.config
  ActiveAdmin.routes(self)

  match "/map" => "map#index"
end
