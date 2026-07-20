from database import SessionLocal, User
from main import hash_password

db = SessionLocal()

# Check if admin exists
admin = db.query(User).filter(User.username == "admin").first()
if not admin:
    admin = User(username="admin", password_hash=hash_password("admindhruva"), is_admin=True)
    db.add(admin)
else:
    admin.password_hash = hash_password("admindhruva")
    admin.is_admin = True

# Demote all other admin users
other_admins = db.query(User).filter(User.username != "admin", User.is_admin == True).all()
for u in other_admins:
    u.is_admin = False
    print(f"Demoted user: {u.username}")

db.commit()
print("Admin user created/updated: admin / admindhruva. All other users demoted.")
