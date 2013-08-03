class AddColumnsToCommunities < ActiveRecord::Migration
  def change
    change_table :communities do |t|
      t.string :email
      t.string :phone_number

      t.string :leader_first_name
      t.string :leader_last_name

      t.string :coleader_first_name
      t.string :coleader_last_name

      t.string :address_line_1
      t.string :address_line_2
      t.string :address_city
      t.string :address_province
      t.string :address_postal

      t.string :host_day
      t.string :host_kind
      t.text :description
    end
  end
end
