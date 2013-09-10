require 'test_helper'

class CommunityTest < Test::Unit::TestCase # ActiveSupport::TestCase
  context "validations" do
    should "require at least one kind" do
      c = FactoryGirl.build(:community, kind_list: nil)
      assert !c.save
      assert_equal(["Please include at least one kind."], c.errors[:kind_list])
    end
  end
end
