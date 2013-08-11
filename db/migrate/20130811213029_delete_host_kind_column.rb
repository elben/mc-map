class DeleteHostKindColumn < ActiveRecord::Migration
  def up
    remove_column :communities, :host_kind
  end

  def down
    add_column :communities, :host_kind, :string
  end
end
