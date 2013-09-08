McMap::Application.routes.draw do
  devise_for :admin_users, path: "admin", path_names: {
    sign_in: "login",
    sign_out: "logout",
  }

  # devise_for :users, :path => "auth",
  #   :path_names => { :sign_in => 'login', :sign_out => 'logout', :password => 'secret', :confirmation => 'verification', :unlock => 'unblock', :registration => 'register', :sign_up => 'cmon_let_me_in' }

  # devise_scope :admin_user do
  #   get "/admin/login", :to => "devise/sessions#new"
  #   get "/admin/logout", :to => "devise/sessions#destroy"
  # end
  
  root :to => 'map#index'

  namespace :admin do
    root controller: :admin, action: :index
    resources :communities do
      member do
        post "add_coach"
        post "remove_coach"
      end
    end
    resources :members
  end

  resources :communities do
    collection do
      get "query"
    end
  end

  match "signup", to: "communities#signup_form", via: :get
  match "signup", to: "communities#signup", via: :post

  match "/map" => "map#index"
end
