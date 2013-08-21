class Member < ActiveRecord::Base
  attr_accessible :email, :name, :phone_number

  has_and_belongs_to_many :communities, :before_add => :no_duplicates

  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
  validates :phone_number, presence: true

  private

  def no_duplicates(community)
    # ActiveRecord::Rollback is internally captured but not reraised. HABTM
    # doesn't create join if before_add throws exception.
    raise ActiveRecord::Rollback if community.members.include?(self)
  end
end
