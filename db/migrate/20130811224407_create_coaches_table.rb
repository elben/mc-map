class CreateCoachesTable < ActiveRecord::Migration
  def change
    create_table "coaches_join" do |t|
      t.integer :community_id
      t.integer :admin_user_id
    end

    add_index :coaches_join, [:community_id, :admin_user_id], :unique => true
  end
end
