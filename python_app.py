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

# update_json should be a dict
def update_newsletter(user_id, newsletter_index, update_json):
    # Get a newsletter by its index
    response = (
        supabase.table("Test_Newsletter_Database")
        .update(update_json)
        .eq("user_id", user_id)
        .eq("user_newsletter_index", newsletter_index)
        .execute()
    )
    print(response) 
    return response


@app.post("/update-email")
def update_email(user_id, new_email):
    response = supabase.table("Test_User_Database").update({"email": new_email}).eq("id", user_id).execute()
    print(response) 
    return response

@app.route('/')
def index():
    update_email(1, "newemail3@gmail.com")
    update_newsletter(1, 0, {"schedule": {"frequency": "weekly", "weekly_on": "Wednesday"}})

    response = supabase.table('Test_User_Database').select("*, Test_Newsletter_Database(*)").execute()
    users = response.data

    html = '<h1>Users</h1><ul>'
    for user in users:
        # Getting user's newsletter with index 0 
        nl_response = (
            supabase.table("Test_Newsletter_Database")
            .select("*")
            .eq("user_id", user["id"])
            .eq("user_newsletter_index", 0)
            .execute()
        )
        # nl_response.data I think returns a list of data matching the conditions
        newsletter_0 = nl_response.data[0]

        html += f'<li>Name: {user["name"]}, Email: {user["email"]}, '
        html += f'Topics: {newsletter_0["topics"]["topics"][0]["topic_name"]}</li>'
    html += '</ul>'

    return html

if __name__ == '__main__':
    app.run(debug=True)
