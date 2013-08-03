class KeyGenerator
  SALT = "TCebqRUXemYunLvq3HxYCdAwPR"
  require "digest/sha1"
  def self.generate(word="", length=32)
    Digest::SHA1.hexdigest(Time.now.to_s + KeyGenerator::SALT + word.to_s + rand(12341234).to_s)[1..length]
  end
end

