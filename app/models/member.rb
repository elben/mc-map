class Member < ActiveRecord::Base
  attr_accessible :email, :name, :phone_number

  has_and_belongs_to_many :communities, :before_add => :no_duplicates

  before_create :strip_stuff

  validates :email, presence: true, uniqueness: true
  validates :name, presence: true

  private

  def strip_stuff
    self.name = self.name.strip
    self.email = self.email.strip
    self.phone_number = self.phone_number.strip
    ["name",
     "email",
     "phone_number",].each do |attr|
       self[attr] = self[attr].try(:strip)
     end
  end

  def no_duplicates(community)
    # ActiveRecord::Rollback is internally captured but not reraised. HABTM
    # doesn't create join if before_add throws exception.
    raise ActiveRecord::Rollback if community.members.include?(self)
  end
end
