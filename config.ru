require 'rack/ssl-enforcer'
require 'vienna'

use Rack::SslEnforcer

# Serve static HTTP from the root.
run Vienna::Application.new('.')
