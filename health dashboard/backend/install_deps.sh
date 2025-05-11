#!/bin/bash

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install Python dependencies
pip install -r requirements.txt

# Install system dependencies (for python-magic)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    sudo apt-get update
    sudo apt-get install -y libmagic1
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    brew install libmagic
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    echo "Please install python-magic-bin manually from: https://pypi.org/project/python-magic-bin/"
    pip install python-magic-bin
fi

echo "Dependencies installed successfully!"
