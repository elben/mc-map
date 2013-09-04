#!/usr/bin sh
bundle exec rake assets:precompile
sudo bundle exec pumactl -S tmp/puma.state stop
sudo bundle exec pumactl -F config/puma.rb start
