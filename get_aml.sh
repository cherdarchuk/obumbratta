# This snippet downloads aml json files using aml-gdoc-server

download_files () {
  curl http://127.0.0.1:6006/1LmJ50mgkjDUqAq44faZrn6mRkmmORSTi8swsyqHMynw | npx json > src/data/text.json
}

# Run aml-gdoc-server (or not), and download files
if lsof -Pi :6006 -sTCP:LISTEN -t >/dev/null ; then
  echo "AML server already running. Getting files"
  download_files
else
  echo "Starting AML server"
  nohup aml-gdoc-server >/dev/null 2>&1 &
  sleep 3
  echo "Getting files"
  download_files
  echo "Killing AML server"
  kill $!
fi