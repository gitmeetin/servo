# meetings

- id
- user1 - user_id
- user2 - user_id
- link - string
- time - date_string

# Routes

- GET  /meeting/:id - all info
- POST /meeting/ - json payload - {"user1": int, "user2": int, "time": date object}
- POST /meeting/delete/:id
