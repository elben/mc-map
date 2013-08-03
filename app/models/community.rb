class Community < ActiveRecord::Base
  acts_as_paranoid

  attr_accessible :email, :phone_number, :leader_first_name, :leader_last_name, :coleader_first_name, :coleader_last_name
  attr_accessible :address_line_1, :address_line_2, :address_city, :address_province, :address_postal
  attr_accessible :host_day, :host_kind, :description, :campus, :lat, :lng
  attr_accessible :slug, :deleted_at

  validate :slug, :presence => true

  after_create :create_slug
  before_save :set_lat_lng

  CAMPUSES = {
    stjam: "St John AM",
    stjpm: "St John PM",
    dtam: "Downtown AM",
    dtpm: "Downtown PM",
    south: "South",
    west: "West",
  }

  def to_param
    self.slug
  end

  def leader
    if !(self.leader_first_name.blank? && self.leader_last_name.blank?)
      "#{self.leader_first_name} #{self.leader_last_name}"
    else
      "NO LEADER NAME"
    end
  end

  def campus_name
    CAMPUSES[self.campus.to_sym]
  end

  def admin_title
    "#{self.leader} - #{self.campus_name}"
  end

  # Not super secret or anything, but we don't care
  def create_slug
    self.update_attributes(slug: KeyGenerator.generate(self.id, 8))
  end

  def set_lat_lng
    return if self.address_line_1.blank? && self.address_line_2.blank?

    result = SimpleGeocode.geocode("#{self.address_line_1} #{self.address_line_2} #{self.address_city} #{self.address_province} #{self.address_postal}")

    if result && result["status"] == "OK"
      place = result["results"].first
      self.lat = place["geometry"]["location"]["lat"]
      self.lng = place["geometry"]["location"]["lng"]
    end
  end
end
