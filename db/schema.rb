# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20130907221501) do

  create_table "active_admin_comments", :force => true do |t|
    t.string   "resource_id",   :null => false
    t.string   "resource_type", :null => false
    t.integer  "author_id"
    t.string   "author_type"
    t.text     "body"
    t.datetime "created_at",    :null => false
    t.datetime "updated_at",    :null => false
    t.string   "namespace"
  end

  add_index "active_admin_comments", ["author_type", "author_id"], :name => "index_active_admin_comments_on_author_type_and_author_id"
  add_index "active_admin_comments", ["namespace"], :name => "index_active_admin_comments_on_namespace"
  add_index "active_admin_comments", ["resource_type", "resource_id"], :name => "index_admin_notes_on_resource_type_and_resource_id"

  create_table "admin_users", :force => true do |t|
    t.string   "email",                  :default => "", :null => false
    t.string   "encrypted_password",     :default => "", :null => false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          :default => 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.datetime "created_at",                             :null => false
    t.datetime "updated_at",                             :null => false
    t.boolean  "super_admin"
    t.string   "first_name"
    t.string   "last_name"
    t.string   "phone_number"
  end

  add_index "admin_users", ["email"], :name => "index_admin_users_on_email", :unique => true
  add_index "admin_users", ["reset_password_token"], :name => "index_admin_users_on_reset_password_token", :unique => true

  create_table "coaches_join", :force => true do |t|
    t.integer "community_id"
    t.integer "admin_user_id"
  end

  add_index "coaches_join", ["community_id", "admin_user_id"], :name => "index_coaches_join_on_community_id_and_admin_user_id", :unique => true

  create_table "communities", :force => true do |t|
    t.string   "slug"
    t.string   "lat"
    t.string   "lng"
    t.string   "campus"
    t.datetime "created_at",                             :null => false
    t.datetime "updated_at",                             :null => false
    t.datetime "deleted_at"
    t.string   "email"
    t.string   "phone_number"
    t.string   "leader_first_name"
    t.string   "leader_last_name"
    t.string   "coleader_first_name"
    t.string   "coleader_last_name"
    t.string   "address_line_1"
    t.string   "address_line_2"
    t.string   "address_city"
    t.string   "address_province"
    t.string   "address_postal"
    t.string   "host_day"
    t.text     "description"
    t.boolean  "hidden",              :default => false, :null => false
  end

  add_index "communities", ["campus"], :name => "index_communities_on_campus"
  add_index "communities", ["coleader_first_name"], :name => "index_communities_on_coleader_first_name"
  add_index "communities", ["coleader_last_name"], :name => "index_communities_on_coleader_last_name"
  add_index "communities", ["hidden"], :name => "index_communities_on_hidden"
  add_index "communities", ["host_day"], :name => "index_communities_on_host_day"
  add_index "communities", ["leader_first_name"], :name => "index_communities_on_leader_first_name"
  add_index "communities", ["leader_last_name"], :name => "index_communities_on_leader_last_name"

  create_table "communities_members", :force => true do |t|
    t.integer "community_id"
    t.integer "member_id"
  end

  add_index "communities_members", ["community_id", "member_id"], :name => "index_communities_members_on_community_id_and_member_id", :unique => true

  create_table "members", :force => true do |t|
    t.string   "name"
    t.string   "email"
    t.string   "phone_number"
    t.datetime "created_at",   :null => false
    t.datetime "updated_at",   :null => false
  end

  add_index "members", ["email"], :name => "index_members_on_email"
  add_index "members", ["name"], :name => "index_members_on_name"

  create_table "taggings", :force => true do |t|
    t.integer  "tag_id"
    t.integer  "taggable_id"
    t.string   "taggable_type"
    t.integer  "tagger_id"
    t.string   "tagger_type"
    t.string   "context",       :limit => 128
    t.datetime "created_at"
  end

  add_index "taggings", ["tag_id"], :name => "index_taggings_on_tag_id"
  add_index "taggings", ["taggable_id", "taggable_type", "context"], :name => "index_taggings_on_taggable_id_and_taggable_type_and_context"

  create_table "tags", :force => true do |t|
    t.string "name"
  end

end
