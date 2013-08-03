class Community < ActiveRecord::Base
  acts_as_paranoid

  attr_accessible :campus, :lat, :leader, :lng, :slug, :deleted_at

  validate :slug, :presence => true

  after_create :create_slug

  def to_param
    self.slug
  end

  # Not super secret or anything, but we don't care
  def create_slug
    self.update_attributes(slug: KeyGenerator.generate(self.id, 8))
  end
end
