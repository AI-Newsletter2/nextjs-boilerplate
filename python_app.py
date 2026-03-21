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

@app.post("/update-email")
def update_email(id, new_email):
    response = supabase.table("Test_Database_1").update({"email": new_email}).eq("id", id).execute()
    print(response) 
    return response

@app.route('/')
def index():
    response = supabase.table('Test_Database_1').select("*").execute()
    users = response.data

    html = '<h1>Users</h1><ul>'
    for user in users:
        html += f'<li>Name: {user["name"]}, Email: {user["email"]}, Topics: {user["topics"]["topics"][0]["topic_name"]}</li>'
    html += '</ul>'

    return html

if __name__ == '__main__':
    app.run(debug=True)
