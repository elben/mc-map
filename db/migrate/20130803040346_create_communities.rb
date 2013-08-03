class CreateCommunities < ActiveRecord::Migration
  def change
    create_table :communities do |t|
      t.string :slug
      t.string :lat
      t.string :lng
      t.string :campus
      t.string :leader

      t.timestamps
    end
  end
end
