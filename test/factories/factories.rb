FactoryGirl.define do
  factory :community do
    lat "1"
    lng "1"
    leader_first_name  { Faker::Name.first_name }
    leader_last_name { Faker::Name.last_name }
    campus { Community::CAMPUSES.keys.sample.to_s }
    host_day { Community::DAYS.sample }
    kind_list "open"
    email { Faker::Internet.safe_email }
    phone_number { Faker::PhoneNumber.phone_number }
    address_line_1 { Faker::Address.street_address }
    address_line_2 { rand > 0.5 ? Faker::Address.secondary_address : nil }
    address_city { ['Austin', 'Roundrock', 'Georgetown', 'San Marcos'].sample }
    address_province { rand > 0.3 ? 'TX' : 'Texas' }
    address_postal { Faker::Address.postcode }
    description { Faker::Lorem.sentence }
  end

  factory :hidden_community, parent: :communtiy do
    hidden true
  end
end
