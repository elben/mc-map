class Member < ActiveRecord::Base
  attr_accessible :email, :name, :phone_number

  has_and_belongs_to_many :members
end
