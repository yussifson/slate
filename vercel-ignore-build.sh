#!/bin/bash
# Check if this is the Production project
if [ "$DEPLOYMENT_TYPE" == "production" ]; then
  echo "Production project detected. Skipping auto-build to require manual deployment."
  exit 0
else
  # For the test project (or if the variable isn't set), proceed with auto-build
  echo "Test project detected. Proceeding with auto-deployment."
  exit 1
fi
