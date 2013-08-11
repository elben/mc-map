class MemberSignUpMailer < ActionMailer::Base
  default from: "noreply@austinstone.org"

  # Sent to new members
  def welcome_email(member, community)
    @member = member
    @community = community
    mail(:to => member.email, :subject => "Austin Stone missional community confirmation")
  end

  # Sent to leaders of MC after new member
  def leaders_email(member, community)
    @member = member
    @community = community
    mail(:to => @community.email, :subject => "Someone signed up for your MC")
  end
end
