# projects

- id
- name - string
- author - user_id
- readme - string
- tags - string[]
- swipes - swipeSchema[]
- repo_id - string
- repo_link - string
- location

# swipeSchema

- swipedBy - user_id
- swipedUser - user_id
- like - boolean

# Routes

 - GET  project/:id - minus the swipe data
 - POST project
 - POST project/delete/:id
 - POST project/edit/:id - exclusively for the author (readme, tags, name, link)
 - POST project/swipe/:id - json payload {"like": "true/false", "user_id": number}