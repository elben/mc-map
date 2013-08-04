class SimpleGeocode
  BASE_URL = 'http://maps.google.com/maps/api/geocode/json'

  # call Google's geocoding API to get the best latitude/longitude for an
  # address. returns nil if no corresponding coordinates could be found.
  def self.geocode(address)
    params = {
      address: address,
      sensor: false,

      # hint that we're looking for addresses around Austin, TX
      bounds: [
        [30.628249, -97.369248].join(','), # northeast
        [30.0244991, -98.1729768].join(',') # southwest
      ].join('|'),
    }

    url = URI.escape(SimpleGeocode::BASE_URL + '?' + params.to_param)
    response = HTTParty.get(url)

    # if we got a result, return it
    if response.code == 200
      location = response["results"].try(:first).try(:[], "geometry").try(:[], "location")
      if location
        return OpenStruct.new(
          latitude: location['lat'],
          longitude: location['lng'],
        )
      end
    else
    end
  end
end
