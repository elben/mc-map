class Community < ActiveRecord::Base
  acts_as_paranoid

  attr_accessible :email, :phone_number, :leader_first_name, :leader_last_name, :coleader_first_name, :coleader_last_name
  attr_accessible :address_line_1, :address_line_2, :address_city, :address_province, :address_postal
  attr_accessible :host_day, :host_kind, :description, :campus, :lat, :lng
  attr_accessible :slug, :deleted_at

  validates :slug, :leader_first_name, :leader_last_name, presence: true

  before_validation :set_slug
  before_save :set_lat_lng

  scope :with_leader_like, lambda { |leader|
    unless leader.blank?
      q = "#{leader}%"
      where(["leader_first_name LIKE (?) OR leader_last_name LIKE (?) OR coleader_first_name LIKE (?) or coleader_last_name LIKE (?)", q, q, q, q])
    end
  }

  CAMPUSES = {
    stjam: "St. John AM",
    stjpm: "St. John PM",
    dtam: "Downtown AM",
    dtpm: "Downtown PM",
    south: "South",
    west: "West",
  }

  MC_KIND = {
    open: "Open to Everyone",
    over40: "Over 40 Years Old",
    family: "Families with Children",
    men: "Men",
    women: "Women",
    singles: "Singles/Young Professionals",
    newly_married: "Nearly/Newly Married Couples",
    goer: "Interested in the Nations (Goer MC)",
    college: "College",
  }

  DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  def leader
    if !(self.leader_first_name.blank? && self.leader_last_name.blank?)
      "#{self.leader_first_name} #{self.leader_last_name}"
    else
      "NO LEADER NAME"
    end
  end

  def coleader
    if !(self.coleader_first_name.blank? && self.coleader_last_name.blank?)
      "#{self.coleader_first_name} #{self.coleader_last_name}"
    end
  end

  def address
    "#{self.address_line_1} #{self.address_line_2} #{self.address_city}, #{self.address_province} #{self.address_postal}"
  end

  def campus_name
    CAMPUSES[self.campus.to_sym]
  end

  def title
    "#{self.leader} - #{self.campus_name}"
  end

  def kind
    MC_KIND[self.host_kind.to_sym]
  end

  # Not super secret or anything, but we don't care
  def set_slug
    self.slug = KeyGenerator.generate("", 8) if self.slug.blank?
  end

  def set_lat_lng
    return if self.address_line_1.blank? && self.address_line_2.blank?

    location = SimpleGeocode.geocode("#{self.address_line_1} #{self.address_line_2} #{self.address_city} #{self.address_province} #{self.address_postal}")

    if location
      self.lat = location["lat"]
      self.lng = location["lng"]
    end
  end

  def output_json
    json = self.attributes.slice("slug", "campus", "email", "leader_first_name", "leader_last_name", "coleader_first_name", "coleader_last_name", "host_day", "host_kind", "description")
    json["location"] = {
      "geometry" => {
        "lat" => self.lat,
        "lng" => self.lng,
      },
      "address" => {
        "line_1" => self.address_line_1,
        "line_2" => self.address_line_2,
        "city" => self.address_city,
        "province" => self.address_province,
        "postal" => self.address_postal,
      }}
    json
  end

end
