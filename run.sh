#!/bin/bash

for dir in $(ls); do
  if [[ -d "$dir" ]]; then
    echo "running bench in $dir"
    cd $dir && npm run bench
    cd ..
  fi
done
