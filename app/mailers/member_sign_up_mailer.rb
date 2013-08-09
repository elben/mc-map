class MemberSignUpMailer < ActionMailer::Base
  default from: "noreply@austinstone.org"

  def welcome_email(member, community)
    @member = member
    @community = community
    mail(:to => member.email, :subject => "Austin Stone missional community confirmation")
  end
end
