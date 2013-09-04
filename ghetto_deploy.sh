#!/usr/bin/env sh
bundle exec rake assets:precompile
rm public/index.html # Expire map/index.html cache
sudo bundle exec pumactl -S tmp/puma.state stop
sudo bundle exec pumactl -F config/puma.rb start
