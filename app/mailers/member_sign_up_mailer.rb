class MemberSignUpMailer < ActionMailer::Base
  default from: "connections@ministries.austinstone.org"

  # Sent to new members
  def welcome_email(member, community)
    @member = member
    @community = community
    reply_to = @community.email || "connections@ministries.austinstone.rog"
    mail(reply_to: reply_to, to: member.email, subject: "Austin Stone Missional Community Confirmation")
  end

  # Sent to leaders of MC after new member
  def leaders_email(member, community)
    @member = member
    @community = community
    mail(to: @community.email, subject: "#{member.name} signed up for your MC!")
  end
end
