class AddDeletedAtToCommunities < ActiveRecord::Migration
  def change
    add_column :communities, :deleted_at, :datetime
  end
end
