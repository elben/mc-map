class AddHiddenToCommunity < ActiveRecord::Migration
  def change
    add_column :communities, :hidden, :boolean, default: false, null: false
    add_index :communities, :hidden
  end
end
