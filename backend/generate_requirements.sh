source venv/bin/activate
pip freeze | cut -d= -f1 > requirements.txt