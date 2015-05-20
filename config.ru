require 'vienna'

# Serve static HTTP from the root.
run Vienna::Application.new('.')
