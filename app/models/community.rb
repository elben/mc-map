class Community < ActiveRecord::Base
  attr_accessible :campus, :lat, :leader, :lng, :slug
end
