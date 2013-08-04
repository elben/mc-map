require 'csv'

class CommunitiesImport
  def self.import!(filename, opts={})
    f = File.open(filename)
    self.import_string!(f.read, opts)
  end

  def self.import_string!(string, opts={})
    CSV.parse(string) do |row|
      # Using the St John AM host signup sheet
      # 0 Entry ID
      # 1 First name
      # 2 Last name
      # 3 Co-leader first name
      # 4 Co-leader last name
      # 5 E-mail
      # 6 Phone numbers
      # 7 Address line 1
      # 8 Address line 2
      # 9 City
      # 10 Province (may be TX or Texas or whatever)
      # 11 Postal
      # 12 Country
      # 13-19 What day (14 is Monday; 20 is Sunday)
      # 20-29 What kind
      # 30 In an MC?
      # 31 If so, MC leader
      # 32 (Blank)

      if row.first.include?("Id")
        # Skip header
        next
      end

      hash = {
        leader_first_name: row[1],
        leader_last_name: row[2],
        coleader_first_name: row[3],
        coleader_last_name: row[4],
        email: row[5],
        phone_number: row[6],
        address_line_1: row[7],
        address_line_2: row[8],
        address_city: row[9],
        address_province: row[10],
        address_postal: row[11],
      }

      ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].each_with_index do |day, idx|
        if row[13+idx]
          hash[:host_day] = day
          break
        end
      end

      [:open, :goer, :over40, :family, :women, :college, :men, :singles, :newly_married].each_with_index do |kind, idx|
        if row[20+idx]
          hash[:host_kind] = kind.to_s
          break
        end
      end

      Community.create(hash.merge(opts))
    end
  end
end

