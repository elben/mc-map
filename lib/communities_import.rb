require 'csv'

class CommunitiesImport

  # Community column name mapped to its corresponding row index (possibly index range)
  COLUMN_TO_INDEX = {
    entry_id: 0,
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
    host_kind: 20..29,
    already_in_mc: 30,
    current_mc_leader: 31
    # column 32 is blank
  }

  # read the given CSV file and import its contents
  def self.import!(filename, column_overrides={})
    f = File.open(filename)
    self.import_string!(f.read, column_overrides)
  end

  # parse a CSV string according to the St. John Wufoo data's CSV export format
  def self.import_string!(string, column_overrides={})
    # Using the St. John AM host signup Wufoo form CSV export, skipping the
    # first row, which we're assuming is the headers row.
    CSV.parse(string, headers: :first_row, return_headers: false) do |row|

      community_hash = {
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

        # for these assignments, the corresponding Community model's enums MUST
        # be in the same order that the CSV specifies.
        host_day: self.get_row_value(row, :host_day, values: Community::DAYS),
        host_kind: self.get_row_value(row, :host_kind, values: Community::MC_KINDS.keys),
      }

      # build a new community from the values we just parsed
      Community.create(community_hash.merge(column_overrides))
    end
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
      return row[row_index]
    end

    # otherwise, treat it as a Range and get its compressed value
    self.get_compressed_row_value(row, row_index, opts[:values])
  end

  # take a series of row values and compress them into a single value.
  # value_name should point to a range value in COLUMN_TO_INDEX.
  def self.get_compressed_row_value(row, range, values)
    # ensure 'range' and 'values' lengths match up
    if range.count < values.count
      msg = "there must be at least #{range.count} " +
          "#{"value".pluralize range.count} "
      raise ArgumentError, msg
    end

    # get the first value in the values array that's non-nil in the row columns
    result = nil
    values.each_with_index do |value, index|
      if row[range.begin + index]
        result = value
        break
      end
    end

    result
  end
end

