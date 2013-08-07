class JoinTableForCommunitiesAndMembers < ActiveRecord::Migration
  def change
    create_table :communities_members do |t|
      t.integer :community_id
      t.integer :member_id
      t.timestamp 
    end
  end
end
