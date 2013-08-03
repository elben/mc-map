class DeleteLeaderFromCommunities < ActiveRecord::Migration
  def change
    remove_column :communities, :leader
  end
end
