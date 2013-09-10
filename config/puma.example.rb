# see https://github.com/puma/puma/blob/master/examples/config.rb
# for more options
threads 1,16
workers 2
environment 'production'
daemonize true
bind 'unix:///tmp/mc_map.socket'
pidfile 'tmp/puma.pid'
state_path 'tmp/puma.state'
