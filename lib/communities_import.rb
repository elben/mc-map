require 'csv'

class CommunitiesImport

  # Community column name mapped to its corresponding row index (possibly index range)
  COLUMN_TO_INDEX = {
    campus: 0,
    leader_first_name: 1,
    leader_last_name: 2,
    coleader_first_name: 3,
    coleader_last_name: 4,
    email: 5,
    phone_number: 6,
    address_line_1: 7,
    address_line_2: 8,
    address_city: 9,
    address_province: 10,
    address_postal: 11,
    address_country: 12,
    host_day: 13..19,
    kind_list: 20..28,
    already_in_mc: 29,
    current_mc_leader: 30,
    useful_info: 31,
  }

  # read the given CSV file and import its contents
  def self.import!(filename, column_overrides={})
    f = File.open(filename)
    self.import_string!(f.read, column_overrides)
  end

  # parse a CSV string according to the St. John Wufoo data's CSV export format
  def self.import_string!(string, column_overrides={})
    communities = []

    # skipping the first row, which is likely the header row
    CSV.parse(string, headers: :first_row, return_headers: false) do |row|

      campus = self.get_row_value(row, :campus, transform: {
        'Downtown AM' => :dtam,
        'Downtown PM' => :dtpm,
        'downtown PM' => :dtpm,
        'St. John AM' => :stjam,
        'St. John PM' => :stjpm,
        'West' => :west,
        'South' => :south,
      })

      # force a campus to be specified
      campus = :dtam if campus.blank?

      host_days = self.get_row_value(row, :host_day, transform: {
        'Monday' => 'monday',
        'Tuesday' => 'tuesday',
        'Wednesday' => 'wednesday',
        'Thursday' => 'thursday',
        'Friday' => 'friday',
        'Saturday' => 'saturday',
        'Sunday' => 'sunday'
      })

      # force a day to be specified
      host_days = ['monday'] if host_days.empty?

      kind_list = self.get_row_value(row, :kind_list, transform: {
        "Men" => :men,
        "Men Only" => :men,

        "Women" => :women,
        "Women Only" => :women,

        "Open to everyone" => :open,
        "Open to Everyone" => :open,
        "Open to everyone (HIGHLY recommended)" => :open,

        "Single College Men" => [:singles, :college, :men],
        "Single College Women" => [:singles, :college, :women],

        "College" => :college,

        "Interested in the nations (Goer MC)" => :goer,
        "Interested in the Nations (Goer MC)" => :goer,
        "International Focused: Goer Mc" => :goer,
        "International Focused: Goer MC" => :goer,

        "Over 40 years old" => :over40,

        "Families with children" => :family,
        "Families with Children" => :family,

        "Singles/Young Professionals" => :singles,
        "Singles / Young Professionals" => :singles,

        "Nearly/Newly Married Couples" => :newly_married,
      })

      # force a kind to be specified
      kind_list = [:open] if kind_list.empty?

      community_hash = {
        campus: campus,
        leader_first_name: self.get_row_value(row, :leader_first_name),
        leader_last_name: self.get_row_value(row, :leader_last_name),
        coleader_first_name: self.get_row_value(row, :coleader_first_name),
        coleader_last_name: self.get_row_value(row, :coleader_last_name),
        email: self.get_row_value(row, :email),
        phone_number: self.get_row_value(row, :phone_number),
        address_line_1: self.get_row_value(row, :address_line_1),
        address_line_2: self.get_row_value(row, :address_line_2),
        address_city: self.get_row_value(row, :address_city),
        address_province: self.get_row_value(row, :address_province),
        address_postal: self.get_row_value(row, :address_postal),
        host_day: host_days.first,
        kind_list: kind_list,
      }

      # build a new community from the values we just parsed
      communities << Community.new(community_hash.merge(column_overrides))
    end

    # create all the communities at once, once we know our data was good
    communities.each { |c| c.save }
  end

  # get a value from a specific row, compressing those values if the row is a
  # range and :values is an array.
  def self.get_row_value(row, value_name, opts={})
    # make sure we can find the requested type
    if !CommunitiesImport::COLUMN_TO_INDEX.has_key? value_name
      raise ArgumentError, "no value exists for row type #{value_name.inspect}"
    end

    row_index = CommunitiesImport::COLUMN_TO_INDEX[value_name]

    # if it's a plain, just return the data from the specified column
    if row_index.is_a? Integer
      result = (row[row_index] || '').strip

      # transform result using given values, if necessary
      if (opts[:transform] && opts[:transform][result])
        return opts[:transform][result]
      end

      # make sure we expect the given value, because there will likely be a
      # problem if we didn't!
      if opts[:transform] && !opts[:transform][result]
        raise "Failed to transform value #{value_name}: #{result}"
      end

      return result
    end

    # otherwise, treat it as a Range and get its values list
    self.get_row_values(row, row_index, opts[:transform])
  end

  # take a series of columns and get all the values therein
  def self.get_row_values(row, range, transform={})
    result = []

    # get the values from the columns, transforming them as we go
    range.each do |index|
      # get the value and map it to something else if necessary
      value = row[index]
      if transform[value]
        value = transform[value]
      end

      # add the value to the list if it existed
      if !value.blank?
        if value.is_a? Array
          # add a list of values if necessary
          result += value
        else
          result << value
        end
      end
    end

    result
  end
end

