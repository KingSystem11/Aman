#!/bin/bash
cd "$(dirname "$0")"
git add -A
git commit -m "Add Mood Play feature and fake stats"
git branch -M main
git push -u origin main --force
echo "Done! Code pushed to GitHub successfully!"
