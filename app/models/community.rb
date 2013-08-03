class Community < ActiveRecord::Base
  acts_as_paranoid

  attr_accessible :email, :phone_number, :leader_first_name, :leader_last_name, :coleader_first_name, :coleader_last_name
  attr_accessible :address_line_1, :address_line_2, :address_city, :address_province, :address_postal
  attr_accessible :host_day, :host_kind, :description, :campus, :lat, :lng
  attr_accessible :slug, :deleted_at

  validate :slug, :presence => true

  after_create :create_slug

  def to_param
    self.slug
  end

  def admin_title
    self.name
  end

  # Not super secret or anything, but we don't care
  def create_slug
    self.update_attributes(slug: KeyGenerator.generate(self.id, 8))
  end
end
