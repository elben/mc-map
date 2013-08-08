class Community < ActiveRecord::Base
  acts_as_paranoid
  acts_as_taggable
  acts_as_taggable_on :kinds

  attr_accessible :email, :phone_number, :leader_first_name, :leader_last_name, :coleader_first_name, :coleader_last_name, :address_line_1, :address_line_2, :address_city, :address_province, :address_postal, :host_day, :host_kind, :description, :campus, :lat, :lng, :slug, :deleted_at, :kind_list

  validates :slug, :leader_first_name, :leader_last_name, presence: true

  before_validation :set_slug
  before_save :update_geo

  has_and_belongs_to_many :members, :before_add => :no_duplicates

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

  # these MUST be in the same order as the values in the Wufoo-exported CSV
  # (hashes are guaranteed to be insertion-ordered in Ruby 1.9+).
  MC_KINDS = {
    open: "Open to Everyone",
    goer: "Interested in the Nations (Goer MC)",
    over40: "Over 40 Years Old",
    family: "Families with Children",
    women: "Women",
    college: "College",
    men: "Men",
    singles: "Singles/Young Professionals",
    newly_married: "Nearly/Newly Married Couples",
  }

  # these MUST be in the same order as the values in the Wufoo-exported CSV
  DAYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]

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
    addy = self.address_line_1
    addy += " " + self.address_line_2 if !self.address_line_2.blank?

    "#{addy}, #{self.address_city}, #{self.address_province} #{self.address_postal}"
  end

  def campus_name
    CAMPUSES[self.campus.to_sym]
  end

  def title
    "#{self.leader} - #{self.campus_name}"
  end

  def kind
    MC_KINDS[self.host_kind.to_sym]
  end

  # Not super secret or anything, but we don't care
  def set_slug
    self.slug = KeyGenerator.generate(8) if self.slug.blank?
  end

  # update the latitude/longitude for this community
  # TODO only do this if address changed
  def update_geo
    return if self.address_line_1.blank? && self.address_line_2.blank?

    coords = SimpleGeocode.geocode(self.address)

    if coords
      self.lat = coords.latitude
      self.lng = coords.longitude
    end
  end

  def output_json
    json = self.attributes.slice(
      'slug',
      'campus',
      'email',
      'leader_first_name',
      'leader_last_name',
      'coleader_first_name',
      'coleader_last_name',
      'host_day',
      'host_kind',
      'description'
    )

    json['location'] = {
      'coords' => {
        'lat' => self.lat,
        'lng' => self.lng,
      },
      'address' => {
        'line_1' => self.address_line_1,
        'line_2' => self.address_line_2,
        'city' => self.address_city,
        'province' => self.address_province,
        'postal' => self.address_postal,
      }}

    json
  end

  def self.kind_tags
    tags = []
    Community::MC_KINDS.each do |k, v|
      tags << ActsAsTaggableOn::Tag.where(name: k).first
    end
    tags.compact
  end

  private

  def no_duplicates(member)
    # ActiveRecord::Rollback is internally captured but not reraised. HABTM
    # doesn't create join if before_add throws exception.
    raise ActiveRecord::Rollback if self.members.include?(member)
  end
end
