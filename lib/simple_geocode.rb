class SimpleGeocode
  def self.geocode(address)
    url = "http://maps.google.com/maps/api/geocode/json?address=#{address}&components=administrative_area:TX|administrative_area:austin|country:US&sensor=false"
    url = URI.escape url
    response = HTTParty.get(url)
    if response.code == 200
      return response
    else
    end
  end
end
