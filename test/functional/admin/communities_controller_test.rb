require 'test_helper'

class Admin::CommunitiesControllerTest < ActionController::TestCase
  setup do
    @user = FactoryGirl.create(:admin_user)
    sign_in @user

    @community = FactoryGirl.create(:community)

    @params = {}
  end

  teardown do
    sign_out @user
  end

  context "communities controller" do

    should "should get index" do
      get :index
      assert_response :success
      assert_not_nil assigns(:communities)
    end

    should "should get new" do
      get :new, @params
      assert_response :success
    end

    should "should show community" do
      @params[:id] = @community.id
      get :show, @params
      assert_response :success
    end
  end
end
