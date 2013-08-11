class AddSuperAdminColumn < ActiveRecord::Migration
  def change
    add_column :admin_users, :super_admin, :boolean
  end
end
