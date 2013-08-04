class KeyGenerator
  require 'securerandom'

  # generate a hex key of the given length
  def self.generate(length=32, prefix='')
    key = SecureRandom.hex(length.to_i / 2)

    return key if prefix.blank?
    "#{prefix}-#{key}"
  end
end

