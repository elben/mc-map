class Community < ActiveRecord::Base
  acts_as_paranoid
  acts_as_taggable
  acts_as_taggable_on :kinds

  attr_accessible(*[
    :email,
    :phone_number,
    :leader_first_name,
    :leader_last_name,
    :coleader_first_name,
    :coleader_last_name,
    :address_line_1,
    :address_line_2,
    :address_city,
    :address_province,
    :address_postal,
    :host_day,
    :description,
    :campus,
    :lat,
    :lng,
    :slug,
    :deleted_at,
    :kind_list,
  ])


  before_validation :set_slug
  before_save :update_geo

  has_and_belongs_to_many :members, before_add: :no_duplicates
  has_and_belongs_to_many :coaches, class_name: "AdminUser", join_table: :coaches_join

  scope :with_leader_like, lambda { |leader|
    return if leader.blank?
    q = "#{leader}%"
    where(["leader_first_name LIKE (?) OR leader_last_name LIKE (?) OR coleader_first_name LIKE (?) or coleader_last_name LIKE (?)", q, q, q, q])
  }

  # kinds is comma-seperated list
  scope :with_kinds, lambda { |kinds|
    return if kinds.blank?
    # filter by kinds tags; OR match
    tagged_with(kinds, on: :kinds, any: true)
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

  # generate a random community and return it, without creating it
  def self.fake

    # generate a latitude/longitude around Austin, TX
    latlng_sw = { lat: 29.99, lng: -98.14 }
    latlng_ne = { lat: 30.59, lng: -97.33 }
    lat_delta = latlng_ne[:lat] - latlng_sw[:lat]
    lng_delta = latlng_ne[:lng] - latlng_sw[:lng]

    # sometimes, we don't get geolocation data
    lat = nil
    lng = nil
    if rand > 0.1
      lat = (rand * lat_delta + latlng_sw[:lat]).round 6
      lng = (rand * lng_delta + latlng_sw[:lng]).round 6
    end

    community = Community.new(
      slug: rand(16 ** 8).to_s(16).rjust(8, '0'),

      lat: lat,
      lng: lng,

      description: rand > 0.7 ? Faker::Lorem.sentences(rand(4) + 1).join(' ') : nil,

      leader_first_name: Faker::Name.first_name,
      leader_last_name: Faker::Name.last_name,
      email: Faker::Internet.safe_email,
      phone_number: Faker::PhoneNumber.phone_number,
      address_line_1: Faker::Address.street_address,
      address_line_2: rand > 0.5 ? Faker::Address.secondary_address : nil,
      address_city: ['Austin', 'Roundrock', 'Georgetown', 'San Marcos'].sample,
      address_province: rand > 0.3 ? 'TX' : 'Texas',
      address_postal: Faker::Address.postcode,
      host_day: Community::DAYS.sample,
      campus: Community::CAMPUSES.keys.sample.to_s,
    )

    # maybe add a coleader name
    if rand > 0.5
      community.coleader_first_name = Faker::Name.first_name
      community.coleader_last_name = Faker::Name.last_name
    end

    # Tag with 1 to 3 kinds
    community.kind_list = Community::MC_KINDS.keys.sample(1 + rand(3)).join(",")

    now = Time.now
    community.created_at = now
    community.updated_at = now

    community
  end

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

  # Not super secret or anything, but we don't care
  def set_slug
    self.slug = KeyGenerator.generate(8) if self.slug.blank?
  end

  def address_changed?
    changed_attrs = self.changed_attributes.keys
    return false if changed_attrs.blank?

    [:address_line_1, :address_line_2, :address_city, :address_province, :address_postal].each do |attr|
      return true if changed_attrs.include?(attr.to_s)
    end
    false
  end

  def update_geo
    return unless address_changed?
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
      'description',
    )

    json['kinds'] = self.kind_list

    # GeoJSON data
    json[:location] = {
      type: 'Feature',
      geometry: nil,
      properties: {
        address: {
          line_1: self.address_line_1,
          line_2: self.address_line_2,
          city: self.address_city,
          province: self.address_province,
          postal: self.address_postal,
        }
      }
    }

    # add geometry information if possible
    if self.lat && self.lng
      json[:location][:geometry] = {
        type: 'Point',
        coordinates: [self.lng.to_f, self.lat.to_f],
      }
    end

    json
  end

  def kinds_display
    self.kind_list.map { |k| MC_KINDS[k.to_sym] }.join(", ")
  end

  def self.kind_tags
    tags = []
    Community::MC_KINDS.each do |k, v|
      tags << ActsAsTaggableOn::Tag.where(name: k).first
    end
    tags.compact
  end

  def signup!(member)
    members = self.members << member
    unless members.blank?
      # First time adding member to community. Email leader.
      MemberSignUpMailer.leaders_email(member, self).deliver
    end

    # Always email member, even if they sign up with same community multiple
    # times
    MemberSignUpMailer.welcome_email(member, self).deliver
    return members
  end

  private

  def no_duplicates(member)
    # ActiveRecord::Rollback is internally captured but not reraised. HABTM
    # doesn't create join if before_add throws exception.
    raise ActiveRecord::Rollback if member.communities.include?(self)
  end
end
