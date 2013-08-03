class Community < ActiveRecord::Base
  acts_as_paranoid

  attr_accessible :email, :phone_number, :leader_first_name, :leader_last_name, :coleader_first_name, :coleader_last_name
  attr_accessible :address_line_1, :address_line_2, :address_city, :address_province, :address_postal
  attr_accessible :host_day, :host_kind, :description, :campus, :lat, :lng
  attr_accessible :slug, :deleted_at

  validates :slug, :leader_first_name, presence: true

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

  MC_KIND = {
    open: "Open to everyone (highly recommended)",
    over40: "Over 40 years old",
    family: "Families with children",
    men: "Men only",
    women: "Women only",
    singles: "Singles & young professionals",
    newly_married: "Nearly & newly married couples",
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
