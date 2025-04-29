from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
import os
from werkzeug.utils import secure_filename
import uuid
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure the MySQL connection using environment variables
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),  # Replace with your MySQL username
    'password': os.getenv('DB_PASS', 'MYSQL'),  # Replace with your MySQL password
    'database': os.getenv('DB_NAME', 'pawsandfind')
}

# Configure upload folder for pet images
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    return mysql.connector.connect(**db_config)

# Create tables if they don't exist
def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create pets table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS pets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        breed VARCHAR(100),
        age INT,
        description TEXT,
        image_url VARCHAR(255),
        user_id INT,
        is_adopted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
    ''')
    
    # Create adoptions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS adoptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pet_id INT NOT NULL,
        adopter_name VARCHAR(100) NOT NULL,
        adopter_email VARCHAR(100) NOT NULL,
        adopter_phone VARCHAR(20) NOT NULL,
        adoption_date DATE NOT NULL,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets(id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
    ''')
    
    # Create supplies table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS supplies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pet_type VARCHAR(50) NOT NULL,
        items TEXT NOT NULL,
        delivery_date DATE NOT NULL,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
    ''')
    
    # Create vet visits table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS vet_visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pet_id INT NOT NULL,
        date DATE NOT NULL,
        reason VARCHAR(255) NOT NULL,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets(id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
    ''')
    
    conn.commit()
    cursor.close()
    conn.close()

# Create tables during startup
create_tables()

# User signup endpoint
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not name or not email or not password:
        return jsonify({'message': 'All fields are required'}), 400
    
    # Hash the password
    hashed_password = generate_password_hash(password)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if user already exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({'message': 'Email already registered'}), 400
        
        # Insert new user
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)",
            (name, email, hashed_password)
        )
        conn.commit()
        
        return jsonify({'message': 'Registration successful!'}), 201
    
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500
    
    finally:
        cursor.close()
        conn.close()

# User login endpoint
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user or not check_password_hash(user['password'], password):
            return jsonify({'message': 'Invalid email or password'}), 401
        
        return jsonify({
            'message': 'Login successful!',
            'user_id': user['user_id']
        }), 200
    
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500
    
    finally:
        cursor.close()
        conn.close()

# Remaining endpoints stay largely the same, with the adjustments for consistency and robustness as recommended earlier.

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True, port=5000)