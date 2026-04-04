import os
from flask import Flask
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
# print(os.environ.get("SUPABASE_URL"))
# print(os.environ.get("SUPABASE_PUBLISHABLE_KEY"))
app = Flask(__name__)

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_PUBLISHABLE_KEY")
)

# Might need to change updating to use jsonb_set() later 
# According to Claude: Any production app with multiple users → prefer jsonb_set() as a habit, 
# the race condition in fetch → merge is a real bug waiting to happen

# If update_data is a json in the table, it should be a dict in python 
def update_newsletter_data(user_id, newsletter_index, column, update_data):
    # Get a newsletter, should be only 1 newsletter row
    response = (
        supabase.table("Test_Newsletter_Database")
        .update({column: update_data})
        .eq("user_id", user_id)
        .eq("user_newsletter_index", newsletter_index)
        .execute()
    )
    print(response) 
    return response

# Returns the data in the selected row and column 
def fetch_newsletter_data(user_id, newsletter_index, column):
    # Get a newsletter, should be only 1 newsletter row
    # Normally response.data is a list of dicts with each value in the list corresponding to a row, 
    # .single() returns the singular value in the list, but gives error if the query doesn't match exactly 1 row 
    response = (
        supabase.table("Test_Newsletter_Database")
        .select(column)
        .eq("user_id", user_id)
        .eq("user_newsletter_index", newsletter_index)
        .single()
        .execute()
    )
    return response.data[column]

@app.post("/update-email")
def update_email(user_id, new_email):
    response = supabase.table("Test_User_Database").update({"email": new_email}).eq("id", user_id).execute()
    print(response) 
    return response

@app.route('/')
def index():
    # Updating a the topics json for a newsletter 
    newsletter_topics = fetch_newsletter_data(1, 0, "topics")
    newsletter_topics["topics"][1]["sources"][0] = "wsj.com"
    update_newsletter_data(1, 0, "topics", newsletter_topics)


    update_email(1, "newemail3@gmail.com")
    update_newsletter_data(1, 0, "schedule", {"frequency": "weekly", "weekly_on": "Thursdat"})

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
