namespace :mc do
  desc "Add tags to database"
  task :create_community_kind_tags => :environment do
    Community::MC_KINDS.each do |k, v|
      unless ActsAsTaggableOn::Tag.where(name: k).exists?
        ActsAsTaggableOn::Tag.create(name: k)
      end
    end
  end
end
