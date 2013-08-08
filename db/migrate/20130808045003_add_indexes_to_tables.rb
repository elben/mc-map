class AddIndexesToTables < ActiveRecord::Migration
  def change
    add_index :communities_members, [:community_id, :member_id], :unique => true
    add_index :communities, :campus
    add_index :communities, :host_day
    add_index :communities, :host_kind
    add_index :communities, :leader_first_name
    add_index :communities, :leader_last_name
    add_index :communities, :coleader_first_name
    add_index :communities, :coleader_last_name
    add_index :members, :name
    add_index :members, :email
  end
end
