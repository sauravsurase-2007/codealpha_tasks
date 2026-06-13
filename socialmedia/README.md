# 🌐 Friendzy — Mini Social Media Platform Codealpha Tasks2

A full-stack social media app built with **Express.js**, **SQL.js**, and **Vanilla JS**.

## Features
- ✅ User registration & login (with hashed passwords)
- ✅ User profiles with bio and follower/following counts
- ✅ Create, view, and delete posts (up to 500 chars)
- ✅ Like / unlike posts
- ✅ Comment on posts, delete your own comments
- ✅ Follow / unfollow users
- ✅ Explore page with user search
- ✅ Feed: All posts OR Following feed
- ✅ Responsive design (mobile + desktop)
- ✅ Blue theme throughout

## Tech Stack
| Layer    | Technology         |
|----------|--------------------|
| Backend  | Node.js + Express  |
| Database | SQL.js (SQLite)    |
| Auth     | bcryptjs + sessions|
| Frontend | HTML, CSS, JS      |

## Setup & Run

### Prerequisites
- Node.js v16 or higher

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
http://localhost:3000
```

## Project Structure
```
socialmedia/
├── server.js              # Express app entry point
├── package.json
├── db/
│   └── database.js        # SQL.js database + schema
├── middleware/
│   └── auth.js            # Session auth middleware
├── routes/
│   ├── auth.js            # Register, login, logout
│   ├── users.js           # Profiles, follow, search
│   └── posts.js           # Posts, likes, comments
└── public/
    ├── index.html         # Single-page app shell
    ├── css/style.css      # Blue theme styles
    └── js/app.js          # Frontend logic
```

## API Endpoints

### Auth
| Method | Endpoint            | Description     |
|--------|---------------------|-----------------|
| POST   | /api/auth/register  | Create account  |
| POST   | /api/auth/login     | Sign in         |
| POST   | /api/auth/logout    | Sign out        |
| GET    | /api/auth/me        | Current session |

### Posts
| Method | Endpoint                        | Description        |
|--------|---------------------------------|--------------------|
| GET    | /api/posts/feed?type=all        | All posts          |
| GET    | /api/posts/feed?type=following  | Following feed     |
| POST   | /api/posts                      | Create post        |
| DELETE | /api/posts/:id                  | Delete post        |
| POST   | /api/posts/:id/like             | Toggle like        |
| GET    | /api/posts/:id/comments         | Get comments       |
| POST   | /api/posts/:id/comments         | Add comment        |
| DELETE | /api/posts/:id/comments/:cid    | Delete comment     |

### Users
| Method | Endpoint                    | Description       |
|--------|-----------------------------|-------------------|
| GET    | /api/users/:username        | Get profile       |
| PUT    | /api/users/profile/update   | Update bio        |
| POST   | /api/users/:id/follow       | Follow/unfollow   |
| GET    | /api/users/search/users?q=  | Search users      |
| GET    | /api/users/:id/followers    | List followers    |
| GET    | /api/users/:id/following    | List following    |
