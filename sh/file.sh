#!/bin/sh

SOURCE_FILE="/Volumes/WORK2/monkey/monacoCopilot/dist/monacocopilot.js"
DESTINATION_DIR="/Volumes/STUDY/myProject/WangCode/src/assets/"

if [ -e "$DESTINATION_DIR/monacocopilot.js" ]; then
  rm "$DESTINATION_DIR/monacocopilot.js"
fi

cp "$SOURCE_FILE" "$DESTINATION_DIR"