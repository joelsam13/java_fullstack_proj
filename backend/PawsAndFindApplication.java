package com.pawsandfind;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

@SpringBootApplication
@RestController
@RequestMapping("/api")
public class PawsAndFindApplication {

    @Autowired
    private DataSource dataSource;

    public static void main(String[] args) {
        SpringApplication.run(PawsAndFindApplication.class, args);
    }

    // Create tables during application startup
    @PostConstruct
    public void createTables() {
        try (Connection conn = dataSource.getConnection()) {
            // Create pets table
            conn.createStatement().execute("""
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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """);

            // Create other tables similarly...

        } catch (SQLException e) {
            System.err.println("Error creating tables: " + e.getMessage());
        }
    }

    // User signup endpoint
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody User user) {
        try (Connection conn = dataSource.getConnection()) {
            PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE email = ?");
            stmt.setString(1, user.getEmail());
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return ResponseEntity.badRequest().body("Email already registered");
            }

            stmt = conn.prepareStatement("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
            stmt.setString(1, user.getName());
            stmt.setString(2, user.getEmail());
            stmt.setString(3, user.getPassword());  // Ideally, hash the password
            stmt.executeUpdate();

            return ResponseEntity.ok("Registration successful!");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    // User login endpoint
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest) {
        try (Connection conn = dataSource.getConnection()) {
            PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE email = ?");
            stmt.setString(1, loginRequest.getEmail());
            ResultSet rs = stmt.executeQuery();

            if (!rs.next() || !rs.getString("password").equals(loginRequest.getPassword())) {
                return ResponseEntity.status(401).body("Invalid email or password");
            }

            return ResponseEntity.ok("Login successful!");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    // Add other endpoints (e.g., add_pet, get_pets, etc.) with similar structure
}