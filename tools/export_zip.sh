#!/bin/sh
set -eu

repo_root=$(git rev-parse --show-toplevel)
commit_id=$(git -C "$repo_root" rev-parse --short=12 HEAD)
output_dir="$repo_root/exports"
mkdir -p "$output_dir"
zip_path="$output_dir/3percent-little-shop-$commit_id.zip"
git -C "$repo_root" archive --format=zip --output="$zip_path" HEAD
shasum -a 256 "$zip_path"
printf 'Created %s\n' "$zip_path"
