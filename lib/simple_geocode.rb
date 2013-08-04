class SimpleGeocode
  def self.geocode(address)
    url = URI.escape("http://maps.google.com/maps/api/geocode/json?address=#{address}&bounds=30.628249,-97.369248|30.0244991,-98.1729768&sensor=false")
    response = HTTParty.get(url)
    if response.code == 200
      location = response["results"].try(:first).try(:[], "geometry").try(:[], "location")
      if location
        return location
      end
    else
    end
  end
end
