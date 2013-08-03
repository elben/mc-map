class Community < ActiveRecord::Base
  acts_as_paranoid

  attr_accessible :campus, :lat, :leader, :lng, :slug
end
