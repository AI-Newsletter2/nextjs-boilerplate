import os
from flask import Flask
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
print(os.environ.get("SUPABASE_URL"))
print(os.environ.get("SUPABASE_PUBLISHABLE_KEY"))
app = Flask(__name__)

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_PUBLISHABLE_KEY")
)

@app.route('/')
def index():
    response = supabase.table('Test_Database_1').select("*").execute()
    users = response.data

    html = '<h1>Users</h1><ul>'
    for user in users:
        html += f'<li>Name: {user["name"]}, Topics:blank</li>'
    html += '</ul>'

    return html

if __name__ == '__main__':
    app.run(debug=True)
